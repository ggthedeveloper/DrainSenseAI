export type RiskLevel = "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";

export interface TopFactor {
  factor: string;
  impact: string;
  value: string;
  direction: "escalating" | "mitigating" | "neutral";
  explanation: string;
}

export interface GridProperties {
  grid_id: string;
  city_id?: string;
  zone_name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  slope_deg: number;
  flow_accumulation: number;
  risk_probability: number;
  risk_score: number;
  risk_level: RiskLevel;
  priority_score: number;
  historical_flood_count: number;
}

export interface GridFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties: GridProperties;
}

export interface RiskMapGeoJSON {
  type: "FeatureCollection";
  name: string;
  features: GridFeature[];
}

export interface RiskSummary {
  city_id: string;
  monitored_city: string;
  total_grids: number;
  monitored_area_sqkm: number;
  critical_zones: number;
  high_risk_zones: number;
  elevated_zones: number;
  moderate_zones: number;
  low_zones: number;
  current_rainfall_24h_mm: number;
  highest_risk_zone: {
    grid_id: string;
    zone_name: string;
    risk_score: number;
    risk_level: RiskLevel;
  };
  last_updated: string;
}

export interface ZoneDetail {
  grid_id: string;
  city_id?: string;
  zone_name: string;
  latitude: number;
  longitude: number;
  risk_probability: number;
  risk_score: number;
  risk_level: RiskLevel;
  prediction_horizon_hours: number;
  model_version: string;
  terrain: {
    elevation_m: number;
    slope_deg: number;
    flow_accumulation: number;
    drainage_density: number;
    distance_to_water_m: number;
  };
  rainfall_summary: {
    rain_1h_mm: number;
    rain_3h_mm: number;
    rain_6h_mm: number;
    rain_24h_mm: number;
  };
  top_factors: TopFactor[];
  recommended_actions: string[];
}

export interface SimulationResult {
  city_id?: string;
  simulation_scenario: {
    multiplier: number;
    percentage_increase: string;
    scenario_rainfall_24h_mm: number;
    baseline_rainfall_24h_mm: number;
  };
  baseline_summary: RiskSummary;
  scenario_summary: RiskSummary;
  impact_deltas: {
    new_critical_zones: number;
    new_high_risk_zones: number;
    total_newly_escalated_zones: number;
    newly_escalated_grid_ids: string[];
  };
  scientific_note: string;
}

export interface PriorityZoneItem {
  grid_id: string;
  city_id?: string;
  zone_name: string;
  risk_level: RiskLevel;
  risk_score: number;
  priority_score: number;
  elevation_m: number;
  distance_to_water_m: number;
  reason: string;
  suggested_action: string;
}

export interface HistoricalEventItem {
  city_id: string;
  city_name: string;
  event_id: string;
  title: string;
  start_date: string;
  end_date: string;
  peak_24h_rainfall_mm: number;
  severity: string;
  water_level_m: number;
  affected_population_est: number;
  key_zones: string[];
  description: string;
  response_summary: string;
}

export interface CityMeta {
  city_id: string;
  city_name: string;
  state: string;
  country: string;
  status: string;
  center_lat: number;
  center_lon: number;
  zoom: number;
  key_water_body: string;
}

export interface AICopilotResponse {
  city_id: string;
  city_name: string;
  query: string;
  ai_situation_assessment: string;
  risk_level_summary: string;
  tactical_recommendations: string[];
  critical_infrastructure_alerts: string[];
  evacuation_and_traffic_advisories: string[];
  model_confidence_score: number;
  model_provider?: string;
  model_name?: string;
  conversational_answer?: string;
  suggested_followups?: string[];
}

export interface DrainAsset {
  asset_id: string;
  city_id: string;
  asset_name: string;
  asset_type: string;
  location_desc: string;
  latitude: number;
  longitude: number;
  capacity_discharge_m3s: number;
  siltation_level_pct: number;
  condition: "EXCELLENT" | "FAIR" | "DEGRADED" | "CRITICAL";
  risk_level: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
  last_inspection_date: string;
  assigned_team: string;
  operational_status: "OPERATIONAL" | "REDUCED_CAPACITY" | "STANDBY" | "OFFLINE";
}

export interface AlertItem {
  alert_id: string;
  city_id: string;
  zone_name: string;
  grid_id: string;
  severity: "CRITICAL" | "HIGH" | "ELEVATED" | "MODERATE" | "INFO";
  title: string;
  message: string;
  trigger_metric: string;
  timestamp: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
}

export interface CascadeWaypoint {
  step: number;
  grid_id: string;
  zone_name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  risk_score: number;
  risk_level: RiskLevel;
  cumulative_dist_m: number;
  arrival_time_min: number;
  arrival_label: string;
  pulse_volume_m3: number;
}

export interface CascadeTraceResponse {
  origin_grid_id: string;
  origin_zone_name: string;
  city_id: string;
  initial_spillover_volume_m3: number;
  total_cascade_hops: number;
  total_corridor_length_m: number;
  terminal_arrival_minutes: number;
  terminal_sink: string;
  cascade_path: CascadeWaypoint[];
}

export interface SCSMetrics {
  curve_number: number;
  soil_hydrologic_group: string;
  imperviousness_pct: number;
  potential_retention_mm: number;
  initial_abstraction_mm: number;
  rainfall_depth_mm: number;
  runoff_depth_mm: number;
  runoff_volume_m3: number;
  time_of_concentration_hours: number;
  time_to_peak_hours: number;
  peak_discharge_m3s: number;
  drainage_conveyance_m3s: number;
  drainage_deficit_m3s: number;
  drainage_overloaded: boolean;
}

export interface PhysicsAuditResponse {
  grid_id: string;
  zone_name: string;
  risk_level: RiskLevel;
  concordance_pct: number;
  concordance_class: "STRONG_CONCORDANCE" | "ML_ELEVATED_ANOMALY" | "HIGH_INFILTRATION_BUFFER";
  concordance_label: string;
  diagnosis: string;
  ml_risk_score: number;
  physical_runoff_ratio_pct: number;
  scs_metrics: SCSMetrics;
}

export interface NowcastTimelineStep {
  horizon_hours: number;
  label: string;
  stage: string;
  description: string;
  rainfall_24h_mm: number;
  summary: RiskSummary;
  cell_states: Record<string, { risk_score: number; risk_level: RiskLevel }>;
}

export interface TemporalNowcastResponse {
  city_id: string;
  monitored_city: string;
  generated_at: string;
  base_rainfall_24h_mm: number;
  total_horizons: number;
  timeline: NowcastTimelineStep[];
}

export interface DispatchAllocationItem {
  grid_id: string;
  zone_name: string;
  risk_score: number;
  risk_level: RiskLevel;
  elevation_m: number;
  assigned_assets: string[];
  dewatering_capacity_m3h: number;
  personnel_deployed: number;
  fuel_consumption_lph: number;
  estimated_population_shielded: number;
  dispatch_priority: string;
}

export interface DispatchOptimizationResponse {
  status: string;
  memorandum_id: string;
  city_id: string;
  generated_at: string;
  authorized_by: string;
  summary: {
    total_sectors_covered: number;
    total_dewatering_capacity_m3h: number;
    total_personnel_deployed: number;
    total_fuel_lph: number;
    total_population_protected: number;
    remaining_unallocated_fleet: Record<string, number>;
  };
  allocations: DispatchAllocationItem[];
  ndma_memo_text: string;
}


