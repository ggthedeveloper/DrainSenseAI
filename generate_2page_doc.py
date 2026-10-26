import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_document():
    doc = docx.Document()
    
    # Page setup: Letter 8.5 x 11 in (612 x 792 pt)
    section = doc.sections[0]
    section.page_width = Pt(612.0)
    section.page_height = Pt(792.0)
    section.top_margin = Pt(32.4)
    section.bottom_margin = Pt(32.4)
    section.left_margin = Pt(39.6)
    section.right_margin = Pt(39.6)
    
    # Configure Normal style
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Times New Roman'
    font.size = Pt(9.5)
    font.color.rgb = RGBColor(0, 0, 0)
    style_normal.paragraph_format.line_spacing = 1.0
    style_normal.paragraph_format.space_after = Pt(0)
    style_normal.paragraph_format.space_before = Pt(0)
    style_normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    def add_p(text="", font_size=9.5, bold=False, italic=False, space_after=0.7, space_before=0.0, align=WD_ALIGN_PARAGRAPH.JUSTIFY):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        if text:
            r = p.add_run(text)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(font_size)
            r.bold = bold
            r.italic = italic
            r.font.color.rgb = RGBColor(0, 0, 0)
        return p

    def add_bullet(lead_bold, body_text, font_size=9.0, space_after=0.6):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(0.0)
        p.paragraph_format.left_indent = Pt(12.0)
        
        r_bullet = p.add_run("• ")
        r_bullet.font.name = 'Times New Roman'
        r_bullet.font.size = Pt(font_size)
        r_bullet.bold = False
        r_bullet.font.color.rgb = RGBColor(0, 0, 0)

        if lead_bold:
            r_lead = p.add_run(lead_bold + " ")
            r_lead.font.name = 'Times New Roman'
            r_lead.font.size = Pt(font_size)
            r_lead.bold = True
            r_lead.font.color.rgb = RGBColor(0, 0, 0)

        r_body = p.add_run(body_text)
        r_body.font.name = 'Times New Roman'
        r_body.font.size = Pt(font_size)
        r_body.bold = False
        r_body.font.color.rgb = RGBColor(0, 0, 0)
        return p

    def add_link(label, url, space_after=0.5):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(0.0)
        
        r_lbl = p.add_run(label + ": ")
        r_lbl.font.name = 'Times New Roman'
        r_lbl.font.size = Pt(8.5)
        r_lbl.bold = True
        r_lbl.font.color.rgb = RGBColor(0, 0, 0)

        r_url = p.add_run(url)
        r_url.font.name = 'Times New Roman'
        r_url.font.size = Pt(8.5)
        r_url.bold = False
        r_url.font.color.rgb = RGBColor(0, 51, 102)
        return p

    def add_ref(num, cit, url, space_after=0.4):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(0.0)
        
        r_num = p.add_run(f"{num}. ")
        r_num.font.name = 'Times New Roman'
        r_num.font.size = Pt(8.0)
        r_num.bold = True
        r_num.font.color.rgb = RGBColor(0, 0, 0)

        r_cit = p.add_run(cit + " ")
        r_cit.font.name = 'Times New Roman'
        r_cit.font.size = Pt(8.0)
        r_cit.bold = False
        r_cit.font.color.rgb = RGBColor(0, 0, 0)

        if url:
            r_url = p.add_run(url)
            r_url.font.name = 'Times New Roman'
            r_url.font.size = Pt(8.0)
            r_url.bold = False
            r_url.font.color.rgb = RGBColor(0, 51, 102)
        return p

    # --- P0 & P1 ---
    add_p("DrainSense", font_size=15.0, bold=True, space_after=1.0)
    add_p("Group Number - 02", font_size=9.5, bold=False, space_after=3.0)
    add_p("", font_size=4.0, space_after=1.0)

    # --- 1. Abstract ---
    add_p("1. Abstract", font_size=11.0, bold=True, space_after=1.0)
    add_p("DrainSense is a generalized, physics-informed hydro-AI decision-support framework engineered to diagnose the dominant mechanism behind urban flooding and generate autonomous municipal response plans rather than producing passive inundation maps. The framework unifies spatial rainfall forcing, downstream river/receiving-water stage, terrain and drainage network connectivity, and multi-temporal Sentinel-1 SAR change-detection radar across a standardized 500 m spatial grid. To resolve the physical inconsistency of pure statistical machine learning, DrainSense couples an optimized calibrated XGBoost classifier with two core physical novelties: a Directed Acyclic Hydrodynamic Graph (DAHG) employing Manning's open-channel equation to route downstream cascade transit lags (τ_lag), and a USDA-NRCS Curve Number (SCS-CN) mass-balance guardrail computing the Hydrological Concordance Index (HCI). DrainSense explicitly isolates pluvial (rainfall-excess), fluvial/backwater (outlet tailback), and compound flood mechanisms while driving an integer linear programming dispatch optimizer for emergency equipment. Validated across 18,304 cells in 12 major Indian river basins, the system delivers sub-15 ms inference latency, ensuring robust real-time computational and operational feasibility.", font_size=9.0, space_after=2.0)
    add_p("Keywords: Urban flooding; Flood mechanism attribution; Physics-informed machine learning; DAHG cascade routing; Sentinel-1 SAR; SCS-CN guardrail; Emergency dispatch optimization", font_size=8.5, space_after=2.0)
    add_p("", font_size=4.0, space_after=1.0)

    # --- 2. Introduction ---
    add_p("2. Introduction", font_size=11.0, bold=True, space_after=1.0)
    add_p("Urban flooding in rapidly expanding Indian metropolises is governed by complex non-linear interactions among localized cloudburst precipitation, surface impermeability, topographic sumps, and downstream receiving-water tailbacks. Consequently, two adjacent wards receiving identical rainfall often experience diametrically opposed inundation severity. Conventional municipal dashboards rely on macroscopic, rain-gauge-only alerts that ignore channel backwaters, while satellite imagery provides only retrospective detection without attributing the generating mechanism. Recent flood studies demonstrate numerical hydrodynamic solvers (e.g., SWMM, 2D HEC-RAS) and pure machine-learning classifiers; however, numerical models suffer prohibitive multi-day computational latencies during emergency operations, whereas pure statistical models exhibit physical hallucinations during extreme tail events. DrainSense resolves this dichotomy by formulating urban deluge prediction as an explainable, physics-constrained mechanism-attribution problem. Operating over unified 500 m grid topologies, it models both local surface runoff and downstream cascade propagation while maintaining mathematical conservation of mass. By decoupling study basins from algorithmic formulation, DrainSense acts as a transferable, production-grade intelligence layer for municipal disaster authorities.", font_size=9.0, space_after=2.0)
    add_p("", font_size=4.0, space_after=1.0)

    # --- 2.1 Problem Identified ---
    add_p("2.1 Problem Identified", font_size=10.5, bold=True, space_after=1.0)
    add_bullet("Mechanism Attribution Deficit:", "Conventional flood monitoring maps inundated extents but fails to differentiate whether inundation is driven by localized cloudburst saturation (pluvial), riverine/canal outlet tailback (fluvial/backwater), or compound interactions.", font_size=9.2, space_after=0.6)
    add_bullet("Downstream Tailback Blindness:", "Rainfall-only classifiers misdiagnose risk in downstream lowlands where elevated river stages cause severe backwater flooding even during moderate local showers.", font_size=9.2, space_after=0.6)
    add_bullet("Physical Inconsistency in Pure ML:", "Statistical models (standard XGBoost/RF) lack mass-balance constraints, generating unphysical runoff volumes (Q > P) during severe precipitation anomalies.", font_size=9.2, space_after=0.6)
    add_bullet("Spatial Isolation & Actionability Void:", "Existing systems treat urban cells as isolated spatial silos neglecting hydrological spillover velocity, while providing passive probabilities rather than actionable municipal equipment dispatch schedules.", font_size=9.2, space_after=0.6)
    add_p("", font_size=4.0, space_after=1.0)

    # --- 2.2 Contribution & Novelty ---
    add_p("2.2 Scientific Novelties", font_size=10.5, bold=True, space_after=1.0)
    add_bullet("Novelty 1: Topological Directed Acyclic Hydrodynamic Graph (DAHG):", "Replaces isolated grid classification with D8 flow-routing network continuity. Dynamic wave velocity is derived from Manning's open-channel equation [v = (1/n) · R_h^(2/3) · S^(1/2)], calculating cumulative downstream arrival transit lag [τ_lag = Σ (Δx_k / v_k)] and flood pulse attenuation to model true cascade inundation.", font_size=9.0, space_after=0.6)
    add_bullet("Novelty 2: Physics-Informed SCS-CN Mass-Balance Guardrail (PIML):", "Integrates USDA-NRCS Curve Number hydrology to audit ML outputs against potential maximum retention [S = (25400 / CN) - 254]. It computes the real-time Hydrological Concordance Index [HCI = 1 - (|Q_xgb - Q_scs| / Q_scs)], strictly enforcing physical conservation of mass.", font_size=9.0, space_after=0.6)
    add_bullet("Novelty 3: Dynamic Multi-Horizon Temporal Nowcasting (T+0h to T+6h):", "Extends spatial attribution across progressive operational horizons, predicting peak inundation timing, canal capacity saturation, and floodwater recession trajectories.", font_size=9.0, space_after=0.6)
    add_bullet("Novelty 4: Autonomous Operations-Research Dispatch Optimizer:", "Employs Integer Linear Programming (ILP) to optimize emergency fleet routing (dewatering pumps, super-suckers, boat squads, sandbags) subject to municipal depot supply constraints, directly compiling NDMA Form D-4 Incident Action Plans.", font_size=9.0, space_after=0.6)
    add_p("", font_size=4.0, space_after=1.0)

    # --- 2.3 Feasibility Analysis ---
    add_p("2.3 Technical & Operational Feasibility", font_size=10.5, bold=True, space_after=1.0)
    add_bullet("Computational Feasibility:", "Achieves an inference latency of < 15 ms per grid cell on standard commodity multi-core CPUs, bypassing the multi-hour computational bottlenecks of 2D shallow-water numerical models and enabling real-time municipal execution.", font_size=9.0, space_after=0.6)
    add_bullet("Data & Sensor Feasibility:", "Verified on real empirical data for Vijayawada (810 cells) and Chennai (1,485 cells) using 30m Copernicus DEM elevations, true finite-difference gradient slopes, and Open-Meteo ERA5 hourly precipitation series (August 2024 Budameru and December 2023 Michaung deluges), eliminating synthetic proxies.", font_size=9.0, space_after=0.6)
    add_bullet("Validation Feasibility:", "Ground-truth flood labels are derived from all-weather Sentinel-1 SAR backscatter change detection, providing objective spatial calibration across cloud-covered monsoon deluges.", font_size=9.0, space_after=0.6)
    add_bullet("Operational Scalability:", "Tested across 18,304 cells spanning 12 Indian river basins (Vijayawada, Chennai, Mumbai, Bengaluru, Delhi, Hyderabad, etc.), demonstrating seamless zero-re-architecture transferability.", font_size=9.0, space_after=0.6)
    add_p("", font_size=4.0, space_after=1.0)

    # --- 3. Methodology ---
    add_p("3. Methodology", font_size=11.0, bold=True, space_after=1.0)
    add_bullet("Data Ingestion & Preprocessing:", "Ingests gridded precipitation (IMERG/Open-Meteo), downstream gauge stages (India-WRIS/CWC), Copernicus 30 m DEM elevation/slope, OpenStreetMap drainage geometry, and multi-temporal Sentinel-1 SAR scenes (pre-event, peak deluge, recession).", font_size=9.2, space_after=0.6)
    add_bullet("Spatial Discretization & DAHG Construction:", "Discretizes the urban basin into standardized 500 m × 500 m cells. Constructs a directed acyclic graph linking each cell to primary arterial canals, diversion channels, and river outfalls with Manning hydraulic attributes (n, R_h, S).", font_size=9.2, space_after=0.6)
    add_bullet("Physics-Informed XGBoost Training:", "Trains gradient-boosted decision trees using calibrated hydro-meteorological features, audited continuously by the SCS-CN mass-balance guardrail to output concordance-checked flood probabilities.", font_size=9.2, space_after=0.6)
    add_bullet("Flood Attribution Index (FAI) Formulation:", "Synthesizes rainfall pressure (P), downstream backwater pressure (B), drainage constraint (D), and SAR wetness response (W) into FAI = f(P, B, D, W), classifying cells into pluvial, backwater, or compound regimes.", font_size=9.2, space_after=0.6)
    add_bullet("Operations-Research Fleet Dispatch:", "Solves an integer linear programming problem minimizing transit time Σ (c_ij · x_ij) subject to depot resource availability and cell criticality, generating automated dispatch manifests.", font_size=9.2, space_after=0.6)
    add_bullet("Independent Transfer Validation:", "Validates the frozen FAI framework against independent historical flood events across contrasting hydrological regimes (e.g., Budameru canal breach vs. Adyar tidal surge).", font_size=9.2, space_after=0.6)
    add_p("", font_size=4.0, space_after=1.0)

    # --- 4. Dataset Link ---
    add_p("4. Dataset Link", font_size=11.0, bold=True, space_after=1.0)
    add_link("Rainfall - Open-Meteo Historical Weather API", "https://open-meteo.com/en/docs/historical-weather-api", space_after=0.5)
    add_link("Rainfall - NASA GPM IMERG", "https://gpm.nasa.gov/data/imerg", space_after=0.5)
    add_link("Flood extent - Copernicus Sentinel-1", "https://browser.dataspace.copernicus.eu/", space_after=0.5)
    add_link("River stage - India-WRIS", "https://indiawris.gov.in/wris/", space_after=0.5)
    add_link("River water level - NWDP/CWC", "https://nwdp.nwic.in/", space_after=0.5)
    add_link("DEM - OpenTopography", "https://opentopography.org/", space_after=0.5)
    add_link("DEM - Copernicus Data Space", "https://dataspace.copernicus.eu/", space_after=0.5)
    add_link("Drainage - OpenStreetMap", "https://www.openstreetmap.org/", space_after=0.5)
    add_link("Land cover - ESA WorldCover", "https://esa-worldcover.org/", space_after=0.5)
    add_p("", font_size=4.0, space_after=1.0)

    # --- 4.1 Dataset Description ---
    add_p("4.1 Dataset Description", font_size=10.5, bold=True, space_after=1.0)
    add_p("The DrainSense empirical package aggregates seven standardized geospatial layers: (1) hourly and 24 h antecedent precipitation grids from NASA GPM IMERG and Open-Meteo; (2) downstream river stage and discharge telemetry from India-WRIS and CWC; (3) Copernicus 30 m DEM topographic elevation, slope, and flow-direction rasters; (4) OpenStreetMap vector channel networks categorized into natural drains, concrete storm channels, and major receiving rivers; (5) multi-date Copernicus Sentinel-1 SAR Level-1 GRD microwave radar scenes processed via Otsu thresholding change detection to derive ground-truth inundation masks; and (6) official NDMA/municipal flood hazard zoning for empirical validation. The framework replaces synthetic proxies with verified Earth observation layers, calibrating physical parameters across 18,304 cells.", font_size=9.2, space_after=1.5)
    add_p("", font_size=4.0, space_after=1.0)

    # --- 5. References ---
    add_p("5. References", font_size=10.5, bold=True, space_after=1.0)
    add_ref(1, "Open-Meteo. Historical Weather API Documentation.", "https://open-meteo.com/en/docs/historical-weather-api", space_after=0.4)
    add_ref(2, "NASA Global Precipitation Measurement (GPM). IMERG Precipitation Dataset.", "https://gpm.nasa.gov/data/imerg", space_after=0.4)
    add_ref(3, "Copernicus Data Space Ecosystem. Sentinel-1 SAR Dual-Pol GRD Access.", "https://dataspace.copernicus.eu/", space_after=0.4)
    add_ref(4, "OpenTopography. Global High-Resolution DEM Data Portal.", "https://opentopography.org/", space_after=0.4)
    add_ref(5, "OpenStreetMap Foundation. OpenStreetMap Vector Hydrography.", "https://www.openstreetmap.org/", space_after=0.4)
    add_ref(6, "India-WRIS / National Water Informatics Centre. Telemetric River Gauge Time-Series.", "https://indiawris.gov.in/wris/", space_after=0.4)
    add_ref(7, "ESA WorldCover. Global 10 m High-Resolution Land Cover.", "https://esa-worldcover.org/", space_after=0.4)

    # Save to both target locations
    target_1 = "DrainSense_2_Page_Requested_Format (1).docx"
    target_2 = "DrainSense_2_Page_Proposal_Group_02.docx"
    doc.save(target_1)
    doc.save(target_2)
    print(f"Successfully saved to {target_1} and {target_2}")

create_document()
