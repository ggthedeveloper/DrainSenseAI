"""
Topological Inundation Cascade Network Engine.
Constructs a Directed Acyclic Hydrological Flow Graph (DAHG) over 500m spatial cells.
Models hydrodynamic spillover propagation, D8 steepest-descent paths, and arrival lag times.
"""

import math
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two points in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class HydrologicalCascadeGraph:
    """
    Manages spatial adjacency and hydrodynamic cascade routing for 500m urban grid cells.
    """
    def __init__(self, grid_df: pd.DataFrame):
        self.grid_df = grid_df.copy()
        self.cell_lookup: Dict[str, Dict[str, Any]] = {}
        self.downstream_edges: Dict[str, str] = {}  # source_id -> target_id
        self.edge_metadata: Dict[str, Dict[str, Any]] = {}
        self._build_graph()

    def _build_graph(self):
        """Constructs spatial index and D8 steepest descent downstream pointers."""
        for _, row in self.grid_df.iterrows():
            gid = str(row["grid_id"])
            self.cell_lookup[gid] = {
                "grid_id": gid,
                "city_id": str(row.get("city_id", "VJA")),
                "zone_name": str(row.get("zone_name", f"Sector {gid}")),
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "elevation_m": float(row.get("elevation_m", 15.0)),
                "slope": float(row.get("slope", 1.5)),
                "flow_accumulation": float(row.get("flow_accumulation", 30.0)),
                "distance_to_water_m": float(row.get("distance_to_water_m", 500.0)),
                "risk_score": float(row.get("risk_score", 45.0)),
                "risk_level": str(row.get("risk_level", "MODERATE"))
            }

        coords = np.array([[c["latitude"], c["longitude"]] for c in self.cell_lookup.values()])
        cell_keys = list(self.cell_lookup.keys())

        # For each cell, locate lower neighbors within ~850 meters (diagonal of 500m cell)
        max_neighbor_dist = 850.0  # meters

        for idx, (gid, cell) in enumerate(self.cell_lookup.items()):
            c_lat, c_lon = cell["latitude"], cell["longitude"]
            c_elev = cell["elevation_m"]

            best_target: Optional[str] = None
            max_gradient: float = 0.0
            best_dist: float = 500.0

            # Test spatial proximity to other cells
            for n_idx, n_gid in enumerate(cell_keys):
                if gid == n_gid:
                    continue
                n_cell = self.cell_lookup[n_gid]
                
                # Fast bounding box filter (~0.01 deg is ~1.1km)
                if abs(c_lat - n_cell["latitude"]) > 0.012 or abs(c_lon - n_cell["longitude"]) > 0.012:
                    continue

                dist_m = haversine_distance_m(c_lat, c_lon, n_cell["latitude"], n_cell["longitude"])
                if 50.0 < dist_m <= max_neighbor_dist:
                    elev_diff = c_elev - n_cell["elevation_m"]
                    if elev_diff > 0.05:  # Downhill
                        gradient = elev_diff / dist_m
                        if gradient > max_gradient:
                            max_gradient = gradient
                            best_target = n_gid
                            best_dist = dist_m

            if best_target:
                self.downstream_edges[gid] = best_target
                self.edge_metadata[gid] = {
                    "target_id": best_target,
                    "gradient": max_gradient,
                    "distance_m": best_dist,
                    "elev_diff_m": c_elev - self.cell_lookup[best_target]["elevation_m"]
                }

    def trace_cascade_path(
        self,
        start_grid_id: str,
        current_rain_mm: float = 145.0,
        max_hops: int = 10
    ) -> Dict[str, Any]:
        """
        Traces downstream flood pulse propagation starting from any given grid cell.
        Calculates incremental travel velocities via Manning's formula and arrival times.
        """
        start_gid = str(start_grid_id).strip()
        if start_gid not in self.cell_lookup:
            raise ValueError(f"Grid cell '{start_gid}' not found in spatial registry.")

        path: List[Dict[str, Any]] = []
        visited = set()
        curr_gid = start_gid
        cum_dist_m = 0.0
        cum_time_minutes = 0.0
        
        # Initial spillover estimation
        start_cell = self.cell_lookup[start_gid]
        initial_spillover_m3 = round(
            (current_rain_mm * 0.72) * (250000.0 / 1000.0) * (start_cell["risk_score"] / 100.0),
            1
        )
        current_pulse_m3 = initial_spillover_m3

        # Manning roughness coefficient for urban drainage channels/streets
        manning_n = 0.035
        hydraulic_radius_m = 1.2

        step = 0
        while curr_gid and curr_gid not in visited and step < max_hops:
            visited.add(curr_gid)
            c_info = self.cell_lookup[curr_gid]
            
            # Record current waypoint
            waypoint = {
                "step": step,
                "grid_id": curr_gid,
                "zone_name": c_info["zone_name"],
                "latitude": c_info["latitude"],
                "longitude": c_info["longitude"],
                "elevation_m": c_info["elevation_m"],
                "risk_score": c_info["risk_score"],
                "risk_level": c_info["risk_level"],
                "cumulative_dist_m": round(cum_dist_m, 1),
                "arrival_time_min": round(cum_time_minutes, 1),
                "arrival_label": f"+{int(round(cum_time_minutes))} min" if step > 0 else "Origin T+0",
                "pulse_volume_m3": round(current_pulse_m3, 1)
            }
            path.append(waypoint)

            # Move to downstream recipient
            next_gid = self.downstream_edges.get(curr_gid)
            if not next_gid or next_gid in visited:
                break

            edge = self.edge_metadata.get(curr_gid, {"gradient": 0.005, "distance_m": 500.0})
            dist = edge["distance_m"]
            gradient = max(0.001, edge["gradient"])

            # Velocity v = (1/n) * R^(2/3) * S^(1/2)  [m/s]
            velocity_ms = (1.0 / manning_n) * (hydraulic_radius_m ** (2.0 / 3.0)) * math.sqrt(gradient)
            velocity_ms = max(0.4, min(3.5, velocity_ms))

            transit_sec = dist / velocity_ms
            cum_dist_m += dist
            cum_time_minutes += (transit_sec / 60.0)

            # Natural channel attenuation / lateral loss (8% per 500m cell)
            current_pulse_m3 = max(0.0, current_pulse_m3 * 0.92)

            curr_gid = next_gid
            step += 1

        # Identify terminal sink or receiving corridor
        terminal_cell = path[-1]
        sink_desc = f"Catchment Depression ({terminal_cell['zone_name']})"
        if terminal_cell["elevation_m"] <= 15.0:
            sink_desc = f"Primary River/Canal Outfall ({terminal_cell['zone_name']})"

        return {
            "origin_grid_id": start_gid,
            "origin_zone_name": start_cell["zone_name"],
            "city_id": start_cell["city_id"],
            "initial_spillover_volume_m3": initial_spillover_m3,
            "total_cascade_hops": len(path) - 1,
            "total_corridor_length_m": round(cum_dist_m, 1),
            "terminal_arrival_minutes": round(cum_time_minutes, 1),
            "terminal_sink": sink_desc,
            "cascade_path": path
        }
