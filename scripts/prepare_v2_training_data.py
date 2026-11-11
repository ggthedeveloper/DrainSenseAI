import csv
import math
import os
from collections import defaultdict

def preprocess_and_build_dataset():
    print("=== Starting DrainSenseAI Dataset Preprocessing Pipeline ===")
    
    # -------------------------------------------------------------
    # STEP 1: Process Spatial Factors (terrain_features.csv)
    # -------------------------------------------------------------
    print("\n[Step 1] Imputing 12 boundary slivers in terrain_features.csv...")
    with open('data/terrain_features.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        raw_terrain = list(reader)
        
    print(f"Total raw terrain rows: {len(raw_terrain)}")
    
    # Identify valid cells vs slivers
    elev_idx = header.index('elevation_mean')
    slope_idx = header.index('slope_mean')
    tpi3_idx = header.index('tpi_3_mean')
    tpi7_idx = header.index('tpi_7_mean')
    tpi11_idx = header.index('tpi_11_mean')
    
    valid_cells = {}
    null_cells = []
    
    for row in raw_terrain:
        gid = row[0]
        parts = gid.split('_')
        r_num = int(parts[1][1:])
        c_num = int(parts[2][1:])
        if row[elev_idx] != '':
            valid_cells[(r_num, c_num)] = {
                'gid': gid,
                'row_raw': row,
                'elev': float(row[elev_idx]),
                'slope': float(row[slope_idx]),
                'tpi3': float(row[tpi3_idx]),
                'tpi7': float(row[tpi7_idx]),
                'tpi11': float(row[tpi11_idx])
            }
        else:
            null_cells.append((r_num, c_num, row))
            
    print(f"Valid terrain cells: {len(valid_cells)}, Null boundary cells: {len(null_cells)}")
    
    # Impute null cells via nearest neighbor
    imputed_count = 0
    clean_spatial_cells = []
    
    # Add valid cells first
    for (r, c), data in valid_cells.items():
        clean_spatial_cells.append({
            'grid_id': data['gid'],
            'grid_row': r,
            'grid_col': c,
            'elevation_m': data['elev'],
            'slope_deg': data['slope'],
            'tpi_3': data['tpi3'],
            'tpi_7': data['tpi7'],
            'tpi_11': data['tpi11'],
            'imputed': 0
        })
        
    # Impute null cells
    for r, c, row in null_cells:
        # find nearest
        min_dist = float('inf')
        nearest_data = None
        for (vr, vc), data in valid_cells.items():
            d = (r - vr)**2 + (c - vc)**2
            if d < min_dist:
                min_dist = d
                nearest_data = data
        
        clean_spatial_cells.append({
            'grid_id': row[0],
            'grid_row': r,
            'grid_col': c,
            'elevation_m': nearest_data['elev'],
            'slope_deg': nearest_data['slope'],
            'tpi_3': nearest_data['tpi3'],
            'tpi_7': nearest_data['tpi7'],
            'tpi_11': nearest_data['tpi11'],
            'imputed': 1
        })
        imputed_count += 1
        
    print(f"Successfully imputed {imputed_count} boundary cells using 1-hop nearest neighbors.")
    
    # Assign physical surface & drainage factors based on spatial geometry
    # Center of Vijayawada grid is approximately R=7300, C=1845
    # Budameru river runs along the northern boundary (R ~ 7290 - 7295)
    # Krishna river runs along the southern boundary (R ~ 7310 - 7320)
    for cell in clean_spatial_cells:
        r = cell['grid_row']
        c = cell['grid_col']
        elev = cell['elevation_m']
        
        # Approximate distance to Budameru / Krishna corridors (in meters: 250m per cell step)
        dist_budameru_m = max(50.0, abs(r - 7293) * 250.0)
        dist_krishna_m = max(50.0, abs(r - 7315) * 250.0)
        dist_water_m = min(dist_budameru_m, dist_krishna_m)
        cell['distance_to_water_m'] = round(dist_water_m, 1)
        
        # Urban Core distance from Governorpet / Benz Circle (R=7305, C=1850)
        dist_core_km = math.sqrt((r - 7305)**2 + (c - 1850)**2) * 0.25
        
        # Physical urban surface parameters
        if dist_core_km < 2.5:
            imp = 0.85
            drain_density = 4.2  # km/km2 (high density municipal storm drains)
            soil_group = "C"
            cn_base = 82.0
        elif dist_core_km < 6.0:
            imp = 0.65
            drain_density = 2.8
            soil_group = "C"
            cn_base = 76.0
        else:
            imp = 0.35
            drain_density = 1.4  # peri-urban agricultural buffer
            soil_group = "B"
            cn_base = 65.0
            
        cell['impervious_ratio'] = imp
        cell['drainage_density_km_km2'] = drain_density
        cell['soil_group'] = soil_group
        
        # Composite SCS Curve Number (CN)
        cn_composite = (cn_base * (1.0 - imp)) + (98.0 * imp)
        # Slope adjustment
        slope_pct = math.tan(math.radians(max(0.2, cell['slope_deg']))) * 100.0
        cn_adj = cn_composite * (322.79 + 15.63 * slope_pct) / (slope_pct + 323.52)
        cell['curve_number'] = round(max(55.0, min(98.0, cn_adj)), 1)
        
        # Maximum potential retention S (mm)
        s_ret = (25400.0 / cell['curve_number']) - 254.0
        cell['potential_retention_s_mm'] = round(s_ret, 2)
        cell['initial_abstraction_ia_mm'] = round(0.18 * s_ret, 2)
        
        # Topographic depression penalty (low elevation + negative TPI)
        elev_depression_score = max(0.0, min(1.0, (22.0 - elev) / 14.0))  # 8m to 22m base plain
        tpi_trap_score = max(0.0, min(1.0, (-cell['tpi_7']) / 5.0)) if cell['tpi_7'] < 0 else 0.0
        cell['topographic_trap_index'] = round(0.6 * elev_depression_score + 0.4 * tpi_trap_score, 3)

    print(f"Total processed static spatial cells: {len(clean_spatial_cells)}")
    
    # Save static features
    os.makedirs('data/processed', exist_ok=True)
    spatial_out = 'data/processed/vijayawada_grid_static_factors.csv'
    spatial_keys = list(clean_spatial_cells[0].keys())
    with open(spatial_out, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=spatial_keys)
        writer.writeheader()
        writer.writerows(clean_spatial_cells)
    print(f"Saved: {spatial_out}")
    
    # -------------------------------------------------------------
    # STEP 2: Process Hydro-Meteorological Storm Events
    # -------------------------------------------------------------
    print("\n[Step 2] Processing Rainfall Observations and Prakasam Barrage Telemetry...")
    
    # Read rainfall observations and aggregate by date
    daily_rain_by_date = defaultdict(list)
    with open('data/cwc_daily_rainfall_krishna_vja.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            dt_str = row[18].split(' ')[0] # DD-MM-YYYY
            try:
                val = float(row[19])
                daily_rain_by_date[dt_str].append(val)
            except:
                pass
                
    # Read clean Prakasam Barrage water levels (filter out -990m sensor dropouts)
    prakasam_stage_by_date = defaultdict(list)
    with open('data/cwc_krishna_river_telemetry_vja.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if row[0] == 'Prakasam Barrage':
                dt_str = row[8].split(' ')[0] # YYYY-MM-DD
                # convert YYYY-MM-DD to DD-MM-YYYY
                p = dt_str.split('-')
                if len(p) == 3:
                    dd_date = f"{p[2]}-{p[1]}-{p[0]}"
                    try:
                        v = float(row[9])
                        if v >= 0.0:  # clean non-negative
                            prakasam_stage_by_date[dd_date].append(v)
                    except:
                        pass
                        
    # Build unique storm event catalogue with zero-rain baseline days added
    event_list = []
    
    # Sample recorded storm days
    for dt_str, r_list in daily_rain_by_date.items():
        max_r = max(r_list)
        mean_r = sum(r_list) / len(r_list)
        
        # Get matching Prakasam Barrage stage
        stages = prakasam_stage_by_date.get(dt_str, [])
        if stages:
            stage_m = round(sum(stages) / len(stages), 2)
            stage_max_m = round(max(stages), 2)
        else:
            stage_m = 3.75 # normal median
            stage_max_m = 3.75
            
        # Classify storm intensity
        if max_r >= 80.0:
            tier = 'EXTREME_STORM'
        elif max_r >= 35.0:
            tier = 'HEAVY_STORM'
        elif max_r >= 10.0:
            tier = 'MODERATE_RAIN'
        elif max_r > 0.0:
            tier = 'LIGHT_DRIZZLE'
        else:
            tier = 'DRY_BASELINE'
            
        event_list.append({
            'date': dt_str,
            'rain_24h_mm': round(max_r, 1),
            'rain_mean_gauge_mm': round(mean_r, 1),
            'prakasam_stage_mean_m': stage_m,
            'prakasam_stage_max_m': stage_max_m,
            'storm_tier': tier
        })
        
    # Sort events by rain
    event_list.sort(key=lambda x: x['rain_24h_mm'], reverse=True)
    
    # Stratified balance sampling of events to prevent massive dry/light bias:
    # 20 Extreme (>=80mm), 25 Heavy (35-80mm), 20 Moderate (10-35mm), 15 Light (<10mm), 20 Dry synthetic baselines
    tier_groups = defaultdict(list)
    for e in event_list:
        tier_groups[e['storm_tier']].append(e)
        
    sampled_events = []
    sampled_events.extend(tier_groups['EXTREME_STORM'][:25])
    sampled_events.extend(tier_groups['HEAVY_STORM'][:30])
    sampled_events.extend(tier_groups['MODERATE_RAIN'][:25])
    sampled_events.extend(tier_groups['LIGHT_DRIZZLE'][:15])
    
    # Add representative dry baseline days
    dry_dates = [f"{d:02d}-01-2023" for d in range(1, 21)]
    for d_dt in dry_dates:
        sampled_events.append({
            'date': d_dt,
            'rain_24h_mm': 0.0,
            'rain_mean_gauge_mm': 0.0,
            'prakasam_stage_mean_m': 3.40,
            'prakasam_stage_max_m': 3.40,
            'storm_tier': 'DRY_BASELINE'
        })
        
    print(f"Total sampled balanced event snapshots: {len(sampled_events)}")
    for tier, items in defaultdict(list, {t: [x for x in sampled_events if x['storm_tier'] == t] for t in set(x['storm_tier'] for x in sampled_events)}).items():
        print(f"  {tier:15}: {len(items)} events")
        
    events_out = 'data/processed/vijayawada_event_telemetry.csv'
    with open(events_out, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=list(sampled_events[0].keys()))
        writer.writeheader()
        writer.writerows(sampled_events)
    print(f"Saved: {events_out}")
    
    # -------------------------------------------------------------
    # STEP 3: Spatiotemporal Fusion & Multi-Target Formulation
    # -------------------------------------------------------------
    print("\n[Step 3] Fusing Spatial Cells (1,100) with Balanced Events into Final ML Matrix...")
    
    matrix_rows = []
    
    # Danger mark at Prakasam Barrage is 17.5m GTS (local gauge relative ~6.5m)
    BARRAGE_HIGH_STAGE_THRESHOLD = 5.5
    
    for ev in sampled_events:
        p_24h = ev['rain_24h_mm']
        stage_m = ev['prakasam_stage_max_m']
        barrage_choke = stage_m >= BARRAGE_HIGH_STAGE_THRESHOLD
        
        # Estimate sub-daily bursts based on 24h total
        rain_1h = round(p_24h * 0.28, 1)
        rain_3h = round(p_24h * 0.52, 1)
        rain_6h = round(p_24h * 0.74, 1)
        
        for cell in clean_spatial_cells:
            # 1. Physical Runoff Calculation (SCS-CN)
            s_ret = cell['potential_retention_s_mm']
            ia = cell['initial_abstraction_ia_mm']
            p_effective = p_24h
            
            if p_effective > ia:
                runoff_mm = ((p_effective - ia) ** 2) / (p_effective - ia + s_ret + 1e-6)
            else:
                runoff_mm = 0.0
            runoff_mm = round(min(p_effective, runoff_mm), 2)
            
            # Volumetric runoff across 250m x 250m cell (62,500 m2)
            cell_area_m2 = 62500.0
            runoff_volume_m3 = round(runoff_mm * (cell_area_m2 / 1000.0), 1)
            
            # Drainage conveyance capacity of cell
            # Drainage density 4.2 km/km2 can handle ~45 mm/hr peak discharge
            drain_cap_mm = cell['drainage_density_km_km2'] * 12.0
            excess_runoff_mm = max(0.0, runoff_mm - drain_cap_mm)
            excess_volume_m3 = round(excess_runoff_mm * (cell_area_m2 / 1000.0), 1)
            
            # 2. Backwater Choking Multiplier
            # If Prakasam Barrage is high AND cell is within 1500m of water corridor
            water_dist = cell['distance_to_water_m']
            backwater_factor = 0.0
            if barrage_choke and water_dist < 2000.0:
                backwater_factor = (2000.0 - water_dist) / 2000.0
                
            # 3. Topographic Inundation Trap Score
            trap_score = cell['topographic_trap_index']
            
            # 4. Multi-Factor Inundation Probability Formulation
            # Physical combination of runoff excess, depression trapping, and river backwater
            if p_24h < 15.0:
                inundation_prob = 0.0
                flood_label = 0
                dominant_factor = "NONE_DRY"
            elif cell['slope_deg'] > 8.0 and cell['elevation_m'] > 45.0:
                # Steep Indrakeeladri hill slopes never flood
                inundation_prob = 0.0
                flood_label = 0
                dominant_factor = "NONE_STEEP_SLOPE"
            else:
                # Scaled multi-factor score
                score_runoff = min(1.0, runoff_mm / 75.0)
                score_excess = min(1.0, excess_runoff_mm / 35.0)
                
                raw_prob = (
                    (score_runoff * 0.35) +
                    (score_excess * 0.25) +
                    (trap_score * 0.25) +
                    (backwater_factor * 0.15)
                )
                inundation_prob = round(max(0.0, min(1.0, raw_prob)), 3)
                flood_label = 1 if inundation_prob >= 0.45 else 0
                
                # Determine Dominant Mechanistic Factor
                factor_scores = {
                    "DEPRESSION_TRAP": trap_score * 0.45,
                    "SURFACE_RUNOFF_CHOKE": score_runoff * 0.40 + score_excess * 0.30,
                    "BARRAGE_BACKWATER": backwater_factor * 0.85,
                    "DRAINAGE_DEFICIT": (1.0 - (cell['drainage_density_km_km2'] / 5.0)) * score_runoff
                }
                dominant_factor = max(factor_scores, key=factor_scores.get)
                if flood_label == 0:
                    dominant_factor = "NONE_SAFE"
                    
            matrix_rows.append({
                # Identifiers
                'grid_id': cell['grid_id'],
                'date': ev['date'],
                'storm_tier': ev['storm_tier'],
                # Spatial Factors
                'elevation_m': cell['elevation_m'],
                'slope_deg': cell['slope_deg'],
                'tpi_3': cell['tpi_3'],
                'tpi_7': cell['tpi_7'],
                'tpi_11': cell['tpi_11'],
                'topographic_trap_index': cell['topographic_trap_index'],
                'distance_to_water_m': cell['distance_to_water_m'],
                'impervious_ratio': cell['impervious_ratio'],
                'drainage_density_km_km2': cell['drainage_density_km_km2'],
                'curve_number': cell['curve_number'],
                'potential_retention_s_mm': cell['potential_retention_s_mm'],
                # Dynamic Hydro-Meteorological Forcing
                'rain_24h_mm': p_24h,
                'rain_6h_mm': rain_6h,
                'rain_3h_mm': rain_3h,
                'rain_1h_mm': rain_1h,
                'prakasam_stage_m': stage_m,
                'barrage_backwater_risk': 1 if barrage_choke else 0,
                # Physics Intermediate Variables
                'direct_runoff_mm': runoff_mm,
                'runoff_excess_volume_m3': excess_volume_m3,
                # Multi-Target ML Labels
                'flood_probability': inundation_prob,
                'flood_label': flood_label,
                'dominant_risk_factor': dominant_factor
            })
            
    print(f"Constructed spatiotemporal training matrix with {len(matrix_rows)} total rows.")
    
    # Target distribution summary
    pos_samples = sum(1 for r in matrix_rows if r['flood_label'] == 1)
    neg_samples = len(matrix_rows) - pos_samples
    print(f"Target distribution: {pos_samples} flooded ({pos_samples/len(matrix_rows)*100:.1f}%), {neg_samples} non-flooded.")
    
    factor_counts = defaultdict(int)
    for r in matrix_rows:
        factor_counts[r['dominant_risk_factor']] += 1
    print("Dominant Risk Factor Breakdown:")
    for f_name, cnt in sorted(factor_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {f_name:22}: {cnt:6} ({cnt/len(matrix_rows)*100:.1f}%)")
        
    out_matrix = 'data/processed/drainsense_v2_training_matrix.csv'
    with open(out_matrix, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=list(matrix_rows[0].keys()))
        writer.writeheader()
        writer.writerows(matrix_rows)
    print(f"Successfully generated final matrix: {out_matrix}")
    print("=== Pipeline Complete ===")

if __name__ == '__main__':
    preprocess_and_build_dataset()

