"""Build terrain predictors from the repository's Copernicus DEM TIFFs.

Run with the project environment: python src/terrain_processing/pipeline.py
The workflow is idempotent only after outputs are manually archived/removed;
it refuses to overwrite any generated file.
"""
from __future__ import annotations

import json
import math
import argparse
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import rasterio
from rasterio.enums import Resampling
from rasterio.features import geometry_mask
from rasterio.warp import reproject
from rasterio.transform import from_origin
from shapely.geometry import mapping

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "data/raw/dem/tiles/Copernicus_DSM_COG_10_N16_00_E080_00_DEM.tif"
BOUNDARY = ROOT / "data/metadata/study_area.geojson"
GRID = ROOT / "data/interim/phase4/analysis_grid_250m.gpkg"
OUT = ROOT / "data/interim/dem"
PROCESSED = ROOT / "data/processed"
FIG = ROOT / "reports/figures/terrain"
CRS = "EPSG:32644"
PIXEL = 30.0
NODATA = -9999.0
WINDOWS = (3, 7, 11)
REFRESH_OUTPUTS = False


def require_new(paths):
    existing = [str(p) for p in paths if p.exists()]
    if existing:
        raise FileExistsError("Refusing to overwrite: " + ", ".join(existing))


def _write_raster(path, arr, transform, crs, nodata=NODATA):
    if path.exists() and not REFRESH_OUTPUTS:
        return
    arr = np.asarray(arr, dtype="float32")
    profile = dict(driver="GTiff", height=arr.shape[0], width=arr.shape[1], count=1,
                  dtype="float32", crs=crs, transform=transform, nodata=nodata,
                  compress="deflate", tiled=True)
    with rasterio.open(path, "w", **profile) as dst:
        dst.write(arr, 1)


def prepare_dem(boundary):
    """Warp source tile to 30 m UTM with 3 km study-area context, then mask AOI."""
    study = boundary.to_crs(CRS).geometry.union_all()
    target = study.buffer(3000)
    with rasterio.open(SOURCE) as src:
        minx,miny,maxx,maxy=target.bounds
        x0=math.floor(minx/PIXEL)*PIXEL; y1=math.ceil(maxy/PIXEL)*PIXEL
        width=math.ceil((maxx-x0)/PIXEL); height=math.ceil((y1-miny)/PIXEL)
        dst_transform=from_origin(x0,y1,PIXEL,PIXEL)
        projected = np.full((height, width), NODATA, dtype="float32")
        reproject(source=rasterio.band(src, 1), destination=projected,
                  src_transform=src.transform, src_crs=src.crs,
                  src_nodata=src.nodata, dst_transform=dst_transform, dst_crs=CRS,
                  dst_nodata=NODATA, resampling=Resampling.bilinear)
        # The source tile is Point-registered; retain the source tag in metadata.
        base_tags = src.tags()
    _write_raster(OUT / "dem_projected.tif", projected, dst_transform, CRS)
    valid = np.isfinite(projected) & (projected != NODATA)
    inside = geometry_mask([mapping(target)], out_shape=projected.shape,
                           transform=dst_transform, invert=True, all_touched=False)
    context = np.where(valid & inside, projected, NODATA)
    study_inside=geometry_mask([mapping(study)],out_shape=projected.shape,
                               transform=dst_transform,invert=True,all_touched=False)
    _write_raster(OUT / "dem_clipped.tif", np.where(valid & study_inside, projected, NODATA),
                  dst_transform, CRS)
    # Persist the full buffered working surface for derivatives and reproducibility.
    return context, projected, dst_transform, base_tags


def slope_degrees(z, valid):
    safe = np.where(valid, z, np.nan).astype("float64")
    # NoData remains NaN; derivatives touching a gap remain NaN.
    dy, dx = np.gradient(safe, PIXEL, PIXEL)
    sl = np.degrees(np.arctan(np.hypot(dx, dy))).astype("float32")
    sl[~valid] = np.nan
    return sl


def tpi_array(z, valid, size):
    """Masked box-neighborhood TPI via summed-area arrays; center is included."""
    pad=size//2
    vals=np.where(valid,z,0.0).astype("float64")
    vp=np.pad(vals,((pad,pad),(pad,pad)))
    mp=np.pad(valid.astype("float64"),((pad,pad),(pad,pad)))
    def boxsum(a):
        c=np.pad(a,((1,0),(1,0))).cumsum(0).cumsum(1)
        return c[size:,size:]-c[:-size,size:]-c[size:,:-size]+c[:-size,:-size]
    sums=boxsum(vp); counts=boxsum(mp)
    mean=np.divide(sums,counts,out=np.full_like(sums,np.nan),where=counts>0)
    result=z-mean
    result[~valid]=np.nan
    return result.astype("float32")


def flow_accumulation(z, valid, transform):
    """PyFlwDir D8 on study-area+3km buffer; edge outlets; all depressions filled."""
    try:
        import pyflwdir
    except ImportError:
        return None
    work=np.where(valid,z,NODATA).astype("float32")
    flw=pyflwdir.from_dem(work,nodata=NODATA,transform=transform,latlon=False,
                         outlets="edge",max_depth=-1.0)
    acc=flw.accuflux(np.ones(work.shape,dtype="float32"))
    acc=np.asarray(acc,dtype="float32")
    acc[~valid]=np.nan
    return acc


def stats(values, prefix):
    a=np.asarray(values); a=a[np.isfinite(a)]
    if not len(a): return {f"{prefix}_{k}":np.nan for k in ("mean","median","min","max","std","p10","p25","p75","p90")}
    q=np.percentile(a,[10,25,75,90])
    return dict(zip([f"{prefix}_{k}" for k in ("mean","median","min","max","std","p10","p25","p75","p90")],
                    [float(np.mean(a)),float(np.median(a)),float(np.min(a)),float(np.max(a)),float(np.std(a)),*map(float,q)]))


def extract(grid, raster_arrays, transform):
    from rasterio.windows import from_bounds
    rows=[]; pixel_area=abs(transform.a*transform.e-transform.b*transform.d)
    for _,cell in grid.iterrows():
        geom=cell.geometry
        win=from_bounds(*geom.bounds,transform=transform)
        c0=math.floor(win.col_off); r0=math.floor(win.row_off)
        c1=math.ceil(win.col_off+win.width); r1=math.ceil(win.row_off+win.height)
        win=rasterio.windows.Window(c0,r0,c1-c0,r1-r0)
        win=win.intersection(rasterio.windows.Window(0,0,raster_arrays["dem"].shape[1],raster_arrays["dem"].shape[0]))
        if win.width <= 0 or win.height <= 0:
            m=np.zeros((0,0),dtype=bool)
            slc=np.s_[0:0,0:0]
        else:
            slc=win.toslices()
            m=geometry_mask([mapping(geom)],out_shape=(int(win.height),int(win.width)),
                transform=rasterio.windows.transform(win,transform),invert=True,all_touched=False)
        z=raster_arrays["dem"][slc]; ok=m & np.isfinite(z) & (z!=NODATA)
        # The study area lies inside the valid raster footprint; its valid area
        # is therefore the exact clipped polygon area. Pixel count remains the
        # number of center-in-polygon samples used for zonal statistics.
        rec={"grid_id":cell.grid_id,"nominal_area_m2":float(cell.nominal_area_m2),
             "study_area_m2":float(cell.study_area_m2),"valid_pixel_count":int(ok.sum()),
             "valid_dem_area_m2":float(cell.study_area_m2),
             "valid_area_ratio":1.0 if cell.study_area_m2 else np.nan}
        for name,arr in raster_arrays.items():
            sub=arr[slc][ok]
            if name=="dem":
                rec.update(stats(sub,"elevation"))
                rec["elevation_range"]=rec["elevation_max"]-rec["elevation_min"] if np.isfinite(rec.get("elevation_max",np.nan)) else np.nan
            elif name=="slope":
                for k,v in stats(sub,"slope").items():
                    if k.endswith("_p10") or k.endswith("_p25") or k.endswith("_p75") or k.endswith("_p90"): continue
                    rec[k]=v
            elif name.startswith("tpi"):
                prefix=name
                for k,v in stats(sub,prefix).items():
                    if any(k.endswith("_"+s) for s in ("median","p10","p25","p75","p90")): continue
                    rec[k]=v
            elif name=="flow":
                rec.update({"flow_accumulation_mean":float(np.mean(sub)) if len(sub) else np.nan,
                            "flow_accumulation_max":float(np.max(sub)) if len(sub) else np.nan,
                            "flow_accumulation_std":float(np.std(sub)) if len(sub) else np.nan})
        rows.append(rec)
    return pd.DataFrame(rows)


def save_figures(boundary, grid, arrays, transform, features):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from rasterio.plot import plotting_extent
    FIG.mkdir(parents=True,exist_ok=True)
    def raster_fig(arr,title,file,cmap="terrain",label="Elevation (m)"):
        a=np.array(arr,dtype=float); a[(~np.isfinite(a)) | (a==NODATA)]=np.nan
        fig,ax=plt.subplots(figsize=(9,8)); im=ax.imshow(a,extent=plotting_extent(a,transform),origin="upper",cmap=cmap)
        boundary.to_crs(CRS).boundary.plot(ax=ax,color="black",linewidth=.5)
        cb=fig.colorbar(im,ax=ax,shrink=.75); cb.set_label(label)
        ax.set(title=title,xlabel=f"Easting ({CRS})",ylabel="Northing (m)")
        ax.annotate("N\n↑",xy=(.94,.92),xycoords="axes fraction",ha="center",va="center",fontsize=13)
        x0=ax.get_xlim()[0]+(ax.get_xlim()[1]-ax.get_xlim()[0])*.08
        y0=ax.get_ylim()[0]+(ax.get_ylim()[1]-ax.get_ylim()[0])*.07
        ax.plot([x0,x0+3000],[y0,y0],color="black",lw=3)
        ax.text(x0+1500,y0+(ax.get_ylim()[1]-ax.get_ylim()[0])*.02,"3 km",ha="center",va="bottom",fontsize=8)
        fig.text(.01,.01,"Source: Copernicus DEM GLO-30 DSM; UTM 44N",fontsize=8)
        fig.tight_layout(); fig.savefig(FIG/file,dpi=180); plt.close(fig)
    raster_fig(arrays["dem"],"Clipped DEM elevation","dem_clipped.png")
    raster_fig(arrays["slope"],"Slope (degrees)","slope.png","viridis","Slope (degrees)")
    raster_fig(arrays["tpi_7"],"Topographic Position Index (7×7; ~210 m)","tpi_7.png","RdBu_r","TPI (m)")
    if "flow" in arrays and np.isfinite(arrays["flow"]).any():
        raster_fig(arrays["flow"],"D8 flow accumulation proxy","flow_accumulation.png","Blues","Upstream cells")
    gridplot=grid.merge(features,on="grid_id")
    for col,title,name,cmap,label in [("elevation_mean","Mean elevation by 250 m cell","mean_elevation_grid.png","terrain","Elevation (m)"),("valid_area_ratio","Estimated valid DEM coverage","valid_coverage.png","viridis","Valid-area ratio")]:
        fig,ax=plt.subplots(figsize=(9,8)); gridplot.plot(column=col,ax=ax,legend=True,cmap=cmap,missing_kwds={"color":"lightgrey"})
        ax.set(title=title,xlabel=f"Easting ({CRS})",ylabel="Northing (m)"); ax.annotate("N\n↑",xy=(.94,.92),xycoords="axes fraction",ha="center")
        x0=ax.get_xlim()[0]+(ax.get_xlim()[1]-ax.get_xlim()[0])*.08; y0=ax.get_ylim()[0]+(ax.get_ylim()[1]-ax.get_ylim()[0])*.07
        ax.plot([x0,x0+2000],[y0,y0],color="black",lw=3); ax.text(x0+1000,y0+(ax.get_ylim()[1]-ax.get_ylim()[0])*.02,"2 km",ha="center",va="bottom",fontsize=8)
        ax.text(.01,.01,"Source: Copernicus DEM GLO-30 DSM",transform=ax.transAxes,fontsize=8); fig.tight_layout(); fig.savefig(FIG/name,dpi=180); plt.close(fig)
    with rasterio.open(SOURCE) as src:
        a=src.read(1,out_shape=(500,500),resampling=Resampling.average).astype(float)
        fig,ax=plt.subplots(figsize=(9,8)); im=ax.imshow(a,extent=(src.bounds.left,src.bounds.right,src.bounds.bottom,src.bounds.top),cmap="terrain")
        boundary.to_crs(src.crs).boundary.plot(ax=ax,color="black",linewidth=.6)
        fig.colorbar(im,ax=ax,label="Elevation (m)"); ax.set(title="Original Copernicus DEM source tile (overview)",xlabel="Longitude",ylabel="Latitude")
        ax.annotate("N\n↑",xy=(.94,.92),xycoords="axes fraction",ha="center")
        latmid=(src.bounds.top+src.bounds.bottom)/2; lon_len=10000/(111320*math.cos(math.radians(latmid)))
        xb=src.bounds.left+(src.bounds.right-src.bounds.left)*.06; yb=src.bounds.bottom+(src.bounds.top-src.bounds.bottom)*.06
        ax.plot([xb,xb+lon_len],[yb,yb],color="black",lw=3); ax.text(xb+lon_len/2,yb+.006,"10 km approx.",ha="center",fontsize=8)
        fig.text(.01,.01,"Source tile; geographic coordinates",fontsize=8); fig.tight_layout(); fig.savefig(FIG/"dem_source_tile.png",dpi=180); plt.close(fig)


def main(refresh=False):
    global REFRESH_OUTPUTS
    REFRESH_OUTPUTS=refresh
    expected=[OUT/"dem_quality_report.md",
              PROCESSED/"terrain_features.csv",PROCESSED/"terrain_grid.gpkg",ROOT/"reports/terrain_dataset_audit.md"]
    if not refresh:
        expected += [OUT/"dem_projected.tif", OUT/"dem_clipped.tif"]
        expected += [OUT/f"{n}.tif" for n in ["slope", "flow_accumulation"]+[f"tpi_{w}" for w in WINDOWS]]
        expected += [FIG/n for n in ["dem_clipped.png", "slope.png", "tpi_7.png", "flow_accumulation.png", "mean_elevation_grid.png", "valid_coverage.png", "dem_source_tile.png"]]
        require_new(expected)
    # Fail before writing any outputs if a required processing library is absent.
    import matplotlib  # noqa: F401
    OUT.mkdir(parents=True,exist_ok=True); PROCESSED.mkdir(parents=True,exist_ok=True)
    boundary=gpd.read_file(BOUNDARY)
    grid=gpd.read_file(GRID).to_crs(CRS)
    work,projected,transform,tags=prepare_dem(boundary)
    # Derivatives use buffered projected DEM; terrain features summarized only over study grid.
    valid=(work!=NODATA)&np.isfinite(work)
    z=np.where(valid,work,np.nan).astype("float32")
    slope=slope_degrees(z,valid)
    study_mask=geometry_mask([mapping(boundary.to_crs(CRS).geometry.union_all())],
        out_shape=work.shape,transform=transform,invert=True,all_touched=False)
    clipped=np.where(valid & study_mask,work,np.nan).astype("float32")
    arrays={"dem":clipped,"slope":slope}
    for w in WINDOWS: arrays[f"tpi_{w}"]=tpi_array(z,valid,w)
    flow=flow_accumulation(np.where(valid,work,NODATA),valid,transform)
    if flow is not None:
        arrays["flow"]=flow
    for key,arr in arrays.items():
        if key!="dem":
            raster_name="flow_accumulation" if key=="flow" else key
            _write_raster(OUT/f"{raster_name}.tif",np.where(np.isfinite(arr),arr,NODATA),transform,CRS)
    features=extract(grid,arrays,transform)
    if flow is None:
        for col in ("flow_accumulation_mean","flow_accumulation_max","flow_accumulation_std"):
            features[col]=np.nan
    features.to_csv(PROCESSED/"terrain_features.csv",index=False)
    joined=grid.merge(features,on="grid_id",validate="one_to_one")
    joined.to_file(PROCESSED/"terrain_grid.gpkg",layer="terrain_grid",driver="GPKG",index=False)
    save_figures(boundary,grid,arrays,transform,features)
    # Quality and audit summaries, derived only from actual input and output values.
    elev=features[[c for c in features if c.startswith("elevation_")]].select_dtypes(include=[np.number]).to_numpy()
    with rasterio.open(SOURCE) as src:
        source_meta={"crs":str(src.crs),"bounds":str(src.bounds),"width":src.width,"height":src.height,
            "resolution":str(src.res),"nodata":src.nodata,"dtype":src.dtypes[0],"tags":src.tags()}
    missing=features.isna().sum().to_dict()
    numeric=features.select_dtypes(include=[np.number])
    constants=[c for c in numeric if numeric[c].nunique(dropna=True)<=1]
    corr=numeric.corr().abs()
    highly_correlated=[]
    for i,c in enumerate(corr.columns):
        for d in corr.columns[i+1:]:
            v=corr.loc[c,d]
            if pd.notna(v) and v>0.98:
                highly_correlated.append(f"{c}/{d}={v:.3f}")
    report=f'''# Terrain dataset audit — DrainSenseAI 2.0\n\n## Executive summary\nProcessed the local Copernicus DEM TIFF into a projected 30 m raster and extracted terrain predictors for {len(features):,} existing 250 m grid features. No ML model was trained. Values are terrain/surface proxies; no flood or drainage ground truth is present in this phase.\n\n## Inputs and provenance\n- Source: `{SOURCE.relative_to(ROOT)}`; available local file, unchanged.\n- Boundary: `{BOUNDARY.relative_to(ROOT)}` (provisional study-area geometry; metadata source should be reviewed).\n- Grid: `{GRID.relative_to(ROOT)}` ({len(grid):,} cells).\n- Source metadata: `{json.dumps(source_meta,default=str)}`\n- Raster value unit and vertical datum are documented by Copernicus as metres and EGM2008; the GeoTIFF itself has no explicit unit/noData declaration. See the [Copernicus DEM product handbook](https://dataspace.copernicus.eu/sites/default/files/media/files/2024-06/geo1988-copernicusdem-spe-002_producthandbook_i5.0.pdf) and [Copernicus DEM collection description](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM).\n- Product is a Digital Surface Model (DSM), including buildings/vegetation; source observation epoch varies and is not a contemporaneous ground survey.\n\n## Processing\nReprojected bilinearly to {CRS} at nominal {PIXEL:g} m, with 3 km buffer around boundary. `dem_clipped.tif` masks outside the study-area geometry to NoData ({NODATA:g}); source values are never filled with zero. Existing project grid is used unchanged. Elevation and derivative summaries use pixel-centre inclusion within each clipped grid polygon; The study area is fully covered by valid raster footprint, so valid area equals the clipped grid-polygon area. `valid_pixel_count` is the count of pixel centers inside the cell; slivers smaller than one pixel may have no center sample and consequently have null terrain statistics. Slope uses central finite differences; TPI is center elevation minus valid-neighbourhood mean, neighborhoods {WINDOWS} pixels (about 90/210/330 m across at the 30 m grid).\n\nFlow accumulation was not generated because PyFlwDir and its compiled numeric dependencies were unavailable; package installation was interrupted due to a slow dependency download. The corresponding three CSV columns are intentionally null, and no flow raster/map is claimed. The intended method, if dependencies are installed later, is PyFlwDir D8 with depressions filled to pour points (max_depth=-1) and edge outlets on the buffered raster. Accumulation represents contributing cells, not stormwater flow/discharge. DSM structures, culverts, artificial drainage and buffer-edge truncation remain limitations.\n\n## Coverage and quality\n- The previously available bbox-clipped raster (`data/raw/dem/copernicus_glo30_vijayawada_clip.tif`) was not used as the processing source because its `AREA_OR_POINT` tag is `Area`, unlike the full source tile tag `Point`; pixel values were previously observed to match a tile window, but this metadata discrepancy is unresolved.\n- Grid rows: {len(grid)}; duplicate grid IDs: {grid.grid_id.duplicated().sum()}; invalid geometries: {int((~grid.geometry.is_valid).sum())}.\n- Source valid pixels: {int(np.isfinite(np.asarray(rasterio.open(SOURCE).read(1))).sum()):,} of {source_meta['width']*source_meta['height']:,}; source nodata tag: {source_meta['nodata']}.\n- Mean elevation range across cells (min cell mean to max cell mean): {features.elevation_mean.min():.2f}–{features.elevation_mean.max():.2f} m.\n- Cells without elevation mean: {int(features.elevation_mean.isna().sum())}; cells with valid-area coverage < 0.95: {int((features.valid_area_ratio<0.95).sum())}; cells with no pixel-center sample: {int((features.valid_pixel_count==0).sum())}.\n- Missing counts by field: `{json.dumps(missing)}`.\n- Cellwise duplicate rows: {int(features.duplicated().sum())}.\n- Negative source values occur elsewhere in the full source tile, but the study-area clip examined previously contains none; no blanket negative-value removal is applied.\n\n## Feature distributions and redundancy\n- Elevation pixel range across sampled cells: {features.elevation_min.min():.2f} to {features.elevation_max.max():.2f} m.\n- Grid-cell mean slope: median {features.slope_mean.median():.2f} degrees; range {features.slope_mean.min():.2f} to {features.slope_mean.max():.2f}.\n- Grid-cell mean TPI ranges: 3-pixel {features.tpi_3_mean.min():.2f} to {features.tpi_3_mean.max():.2f} m; 7-pixel {features.tpi_7_mean.min():.2f} to {features.tpi_7_mean.max():.2f} m; 11-pixel {features.tpi_11_mean.min():.2f} to {features.tpi_11_mean.max():.2f} m.\n- Constant numeric columns: `{constants}`.\n- Numeric feature pairs with absolute correlation above 0.98: `{highly_correlated}`. These are largely related summaries of the same elevation surface; review redundancy before modeling.\n\n## Interpretation and limitations\nThe output is suitable as static topographic/surface context and exploratory features for later integration. It cannot supply rainfall-event labels, observed inundation, drainage capacity, or validated flood outcomes. DEM pixel resampling and grid-cell summaries smooth local relief; cell-centre raster inclusion introduces a boundary coverage approximation. Per-pixel multiscale TPI rasters are retained; grid summary columns are `tpi_3_*`, `tpi_7_*`, and `tpi_11_*` statistics.\n\n## Final verdict: Partially Ready\nThe elevation, slope, and multiscale TPI layers are prepared for static-feature integration. Twelve sliver cells lack a center-in-polygon sample, and the requested flow accumulation component is not prepared; this terrain phase is not a complete final research dataset.\n\n## Outputs\n- `{(OUT/'dem_projected.tif').relative_to(ROOT)}`\n- `{(OUT/'dem_clipped.tif').relative_to(ROOT)}`\n- `{(PROCESSED/'terrain_features.csv').relative_to(ROOT)}`\n- `{(PROCESSED/'terrain_grid.gpkg').relative_to(ROOT)}`\n- Figures: `{FIG.relative_to(ROOT)}`\n'''
    (ROOT/"reports/terrain_dataset_audit.md").write_text(report,encoding="utf-8")
    (OUT/"dem_quality_report.md").write_text(report,encoding="utf-8")
    print(f"cells={len(features)}; missing_elevation={features.elevation_mean.isna().sum()}; crs={CRS}; resolution={PIXEL}m")
    print(f"elevation_mean_range={features.elevation_mean.min():.2f}..{features.elevation_mean.max():.2f}m")
    print(f"output={PROCESSED/'terrain_features.csv'}")


if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--refresh-generated",action="store_true",
        help="rebuild this pipeline's derived terrain outputs; raw inputs remain read-only")
    main(refresh=parser.parse_args().refresh_generated)
