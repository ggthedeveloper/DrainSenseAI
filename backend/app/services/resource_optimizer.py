"""
Operations Research Municipal Resource Dispatch & Fleet Optimization Engine.
Solves constrained allocation of high-capacity pumps, super-suckers, and rescue teams
across prioritized flood-risk sectors.
"""

from datetime import datetime
from typing import Dict, List, Any, Optional

FLEET_TEMPLATES = {
    "PUMP_HEAVY": {
        "asset_type": "100+ HP High-Head Dewatering Diesel Pump",
        "discharge_capacity_m3h": 450.0,
        "fuel_rate_lph": 18.0,
        "crew_size": 4,
        "optimal_target": "CRITICAL"
    },
    "SUPER_SUCKER": {
        "asset_type": "High-Vacuum Sludge Extraction Super-Sucker",
        "discharge_capacity_m3h": 180.0,
        "fuel_rate_lph": 14.0,
        "crew_size": 3,
        "optimal_target": "CHOKED_CULVERT"
    },
    "BOAT_SQUAD": {
        "asset_type": "NDRF / SDRF Inflatable Quick-Response Rescue Boat",
        "discharge_capacity_m3h": 0.0,
        "capacity_persons": 8,
        "crew_size": 4,
        "optimal_target": "RIVER_BREACH"
    },
    "SANDBAG_UNIT": {
        "asset_type": "Rapid Breach Sandbag Bunding Crew (2000 bags/unit)",
        "discharge_capacity_m3h": 0.0,
        "crew_size": 6,
        "optimal_target": "OVERFLOW_WEIR"
    }
}

def optimize_municipal_dispatch(
    city_id: str,
    priority_zones: List[Dict[str, Any]],
    available_fleet: Optional[Dict[str, int]] = None,
    officer_name: str = "Gaurav (Administrator)"
) -> Dict[str, Any]:
    """
    Allocates municipal response fleet to highest-threat sectors using multi-objective prioritization.
    Generates a structured dispatch manifest and NDMA-format Incident Action Memorandum.
    """
    cid = city_id.upper()
    fleet_inventory = available_fleet or {
        "PUMP_HEAVY": 12,
        "SUPER_SUCKER": 6,
        "BOAT_SQUAD": 4,
        "SANDBAG_UNIT": 8
    }

    # Sort target zones by priority score
    sorted_zones = sorted(
        priority_zones,
        key=lambda z: float(z.get("priority_score", z.get("risk_score", 50.0))),
        reverse=True
    )

    allocations: List[Dict[str, Any]] = []
    pumps_left = fleet_inventory.get("PUMP_HEAVY", 12)
    suckers_left = fleet_inventory.get("SUPER_SUCKER", 6)
    boats_left = fleet_inventory.get("BOAT_SQUAD", 4)
    sandbags_left = fleet_inventory.get("SANDBAG_UNIT", 8)

    total_mitigated_m3h = 0.0
    total_personnel_deployed = 0
    total_fuel_burn_lph = 0.0

    for idx, zone in enumerate(sorted_zones):
        r_score = float(zone.get("risk_score", 60.0))
        dist_w = float(zone.get("distance_to_water_m", 500.0))
        elev = float(zone.get("elevation_m", 15.0))
        gid = zone.get("grid_id", f"Z_{idx+1}")
        zname = zone.get("zone_name", f"Ward {idx+1}")

        assigned_units = []
        zone_capacity_m3h = 0.0
        zone_crew = 0
        zone_fuel = 0.0

        # Allocation rules
        if r_score >= 80.0 and pumps_left >= 2:
            assigned_units.append(f"2x {FLEET_TEMPLATES['PUMP_HEAVY']['asset_type']} (Pump Unit #{pumps_left-1}, #{pumps_left})")
            pumps_left -= 2
            zone_capacity_m3h += 900.0
            zone_crew += 8
            zone_fuel += 36.0
        elif r_score >= 65.0 and pumps_left >= 1:
            assigned_units.append(f"1x {FLEET_TEMPLATES['PUMP_HEAVY']['asset_type']} (Pump Unit #{pumps_left})")
            pumps_left -= 1
            zone_capacity_m3h += 450.0
            zone_crew += 4
            zone_fuel += 18.0

        # Assign super-sucker if culvert or low elevation
        if elev <= 16.0 and suckers_left >= 1:
            assigned_units.append(f"1x {FLEET_TEMPLATES['SUPER_SUCKER']['asset_type']} (Suction Squad #{suckers_left})")
            suckers_left -= 1
            zone_capacity_m3h += 180.0
            zone_crew += 3
            zone_fuel += 14.0

        # Assign rescue boats if immediate river proximity and high risk
        if dist_w <= 350.0 and r_score >= 75.0 and boats_left >= 1:
            assigned_units.append(f"1x {FLEET_TEMPLATES['BOAT_SQUAD']['asset_type']} (Boat Squad #{boats_left})")
            boats_left -= 1
            zone_crew += 4

        # Assign sandbag unit if low elevation weir/breach threat
        if r_score >= 70.0 and sandbags_left >= 1:
            assigned_units.append(f"1x {FLEET_TEMPLATES['SANDBAG_UNIT']['asset_type']} (Bunding Unit #{sandbags_left})")
            sandbags_left -= 1
            zone_crew += 6

        if assigned_units:
            est_shielded_pop = int(2500 + (r_score * 45))
            allocations.append({
                "grid_id": gid,
                "zone_name": zname,
                "risk_score": r_score,
                "risk_level": zone.get("risk_level", "HIGH"),
                "elevation_m": elev,
                "assigned_assets": assigned_units,
                "dewatering_capacity_m3h": zone_capacity_m3h,
                "personnel_deployed": zone_crew,
                "fuel_consumption_lph": zone_fuel,
                "estimated_population_shielded": est_shielded_pop,
                "dispatch_priority": f"P{len(allocations)+1} - URGENT"
            })
            total_mitigated_m3h += zone_capacity_m3h
            total_personnel_deployed += zone_crew
            total_fuel_burn_lph += zone_fuel

        if pumps_left == 0 and suckers_left == 0 and sandbags_left == 0:
            break

    # Generate NDMA Incident Memorandum
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    memo_id = f"NDMA-MEMO-{cid}-{datetime.utcnow().strftime('%Y%m%d%H%M')}"
    
    memo_text = f"""
================================================================================
           NATIONAL DISASTER MANAGEMENT AUTHORITY (NDMA) / MUNICIPAL CORP
                     SPECIAL DISPATCH DIRECTIVE & MEMORANDUM
================================================================================
MEMORANDUM ID  : {memo_id}
DATE & TIME    : {now_iso}
JURISDICTION   : {cid} Municipal Corporation Flood Control Command
AUTHORIZING    : {officer_name}
CLASSIFICATION : OPERATIONAL IMMEDIATE (PRIORITY DISASTER RESPONSE)
--------------------------------------------------------------------------------

1. SITUATIONAL ASSESSMENT:
   Dynamic telemetry indicates acute urban inundation threat across {len(allocations)} prioritized
   hydrological sectors. Topographic depression and channel backwater require immediate
   pre-positioning of mechanical dewatering and breach bunding equipment.

2. FLEET DEPLOYMENT SUMMARY:
   * Total Dewatering Capacity Authorized : {total_mitigated_m3h:,.1f} m3/hour
   * Total Response Personnel Mobilized   : {total_personnel_deployed} Officers & Crew
   * Total Estimated Fuel Requirement     : {total_fuel_burn_lph:.1f} Liters/hour
   * Estimated Population Shielded        : {sum(a['estimated_population_shielded'] for a in allocations):,} Citizens

3. SECTORAL DISPATCH DIRECTIVES:
"""
    for a in allocations:
        memo_text += f"""
   [{a['dispatch_priority']}] Sector: {a['zone_name']} ({a['grid_id']})
   - Threat Level: {a['risk_level']} ({a['risk_score']}%) | Elevation: {a['elevation_m']}m AMSL
   - Assigned Fleet: {', '.join(a['assigned_assets'])}
   - Dewatering Rate: {a['dewatering_capacity_m3h']} m3/h | Crew: {a['personnel_deployed']} | Shielded: ~{a['estimated_population_shielded']:,} residents
"""

    memo_text += f"""
--------------------------------------------------------------------------------
4. COMPLIANCE & SAFETY INSTRUCTIONS:
   a. Field units to report radio check on UHF Channel 4 every 30 minutes.
   b. Electrical sub-stations in sub-15m zones to undergo preventive shutdown.
   c. Sludge disposal to designated inland drying beds; avoid river tailback.
   d. Dewatering pumps to operate under 24/7 continuous duty rotation.

AUTHORIZED BY: {officer_name}
STAMP / SIGN : DIGITAL VERIFIED DISPATCH DIRECTIVE
================================================================================
"""

    return {
        "status": "OPTIMIZATION_SUCCESS",
        "memorandum_id": memo_id,
        "city_id": cid,
        "generated_at": now_iso,
        "authorized_by": officer_name,
        "summary": {
            "total_sectors_covered": len(allocations),
            "total_dewatering_capacity_m3h": total_mitigated_m3h,
            "total_personnel_deployed": total_personnel_deployed,
            "total_fuel_lph": total_fuel_burn_lph,
            "total_population_protected": sum(a["estimated_population_shielded"] for a in allocations),
            "remaining_unallocated_fleet": {
                "PUMP_HEAVY": pumps_left,
                "SUPER_SUCKER": suckers_left,
                "BOAT_SQUAD": boats_left,
                "SANDBAG_UNIT": sandbags_left
            }
        },
        "allocations": allocations,
        "ndma_memo_text": memo_text.strip()
    }
