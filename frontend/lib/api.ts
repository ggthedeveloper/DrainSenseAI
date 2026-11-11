import {
  RiskMapGeoJSON,
  RiskSummary,
  ZoneDetail,
  SimulationResult,
  PriorityZoneItem,
  HistoricalEventItem,
  DrainAsset,
  AlertItem,
  AICopilotResponse,
  CascadeTraceResponse,
  PhysicsAuditResponse,
  TemporalNowcastResponse,
  DispatchOptimizationResponse,
} from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new ApiError("The service is unreachable.");
  }
  if (!res.ok) {
    throw new ApiError(`Request failed (${res.status}).`);
  }
  return (await res.json()) as T;
}

function rainQuery(rain24h?: number) {
  if (rain24h == null || Number.isNaN(rain24h)) return "";
  return `&rain_24h=${encodeURIComponent(String(rain24h))}`;
}

export async function fetchHealthStatus() {
  return request<{ status: string; model_version?: string; database?: string; model_loaded?: boolean }>(
    `${API_BASE_URL}/health`
  );
}

export async function fetchCurrentRiskMap(
  cityId: string,
  rain24h?: number
): Promise<{ summary: RiskSummary; geojson: RiskMapGeoJSON }> {
  const cid = cityId.toUpperCase();
  const rain = rain24h == null ? "" : `&rain_24h=${encodeURIComponent(String(rain24h))}`;
  return request(`${API_BASE_URL}/api/v1/risk/map?city_id=${cid}${rain}`);
}

export async function fetchZoneDetail(gridId: string, rain24h?: number): Promise<ZoneDetail> {
  return request(`${API_BASE_URL}/api/v1/risk/${encodeURIComponent(gridId)}?${rainQuery(rain24h).replace(/^&/, "")}`);
}

export async function runSimulation(
  cityId: string,
  multiplier: number,
  baseRain24h: number
): Promise<SimulationResult> {
  return request(`${API_BASE_URL}/api/v1/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city_id: cityId.toUpperCase(),
      multiplier,
      base_rain_24h_mm: baseRain24h,
    }),
  });
}

export async function fetchPriorityZones(
  cityId: string
): Promise<{ total_prioritized: number; zones: PriorityZoneItem[] }> {
  return request(`${API_BASE_URL}/api/v1/risk/priority-zones?city_id=${cityId.toUpperCase()}&limit=10`);
}

export async function fetchHistoricalEvents(cityId?: string): Promise<HistoricalEventItem[]> {
  const query = cityId ? `?city_id=${cityId.toUpperCase()}` : "";
  return request(`${API_BASE_URL}/api/v1/historical-events${query}`);
}

export async function fetchEvaluationReport() {
  try {
    const data = await request<{ evaluation?: unknown }>(`${API_BASE_URL}/api/v1/statistics`);
    if (data.evaluation) return data.evaluation;
  } catch {
    // The published evaluation file is a real report, not a synthesized score.
  }
  return request("/data/evaluation.json");
}

export async function askAICopilot(
  cityId: string,
  query: string,
  currentRain24h?: number,
  apiKey?: string,
  provider: string = "auto",
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<AICopilotResponse> {
  return request(`${API_BASE_URL}/api/v1/ai/copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city_id: cityId.toUpperCase(),
      query,
      current_rainfall_24h_mm: currentRain24h,
      api_key: apiKey || undefined,
      provider,
      conversation_history: conversationHistory,
    }),
  });
}

export async function fetchDrainAssets(cityId?: string): Promise<{ total: number; assets: DrainAsset[] }> {
  const query = cityId ? `?city_id=${cityId.toUpperCase()}` : "";
  const data = await request<DrainAsset[] | { total: number; assets: DrainAsset[] }>(
    `${API_BASE_URL}/api/v1/assets${query}`
  );
  if (Array.isArray(data)) return { total: data.length, assets: data };
  return data;
}

export async function fetchAlerts(cityId?: string): Promise<{ total: number; alerts: AlertItem[] }> {
  const query = cityId ? `?city_id=${cityId.toUpperCase()}` : "";
  const data = await request<AlertItem[] | { total: number; alerts: AlertItem[] }>(
    `${API_BASE_URL}/api/v1/alerts${query}`
  );
  if (Array.isArray(data)) return { total: data.length, alerts: data };
  return data;
}

export async function acknowledgeAlert(alertId: string, acknowledgedBy = "Municipal desk"): Promise<AlertItem> {
  return request<AlertItem>(
    `${API_BASE_URL}/api/v1/alerts/${encodeURIComponent(alertId)}/acknowledge?officer_name=${encodeURIComponent(acknowledgedBy)}`,
    { method: "POST" }
  );
}

export async function resolveAlert(alertId: string): Promise<AlertItem> {
  return request<AlertItem>(
    `${API_BASE_URL}/api/v1/alerts/${encodeURIComponent(alertId)}/resolve`,
    { method: "POST" }
  );
}

export async function fetchCascadeTrace(gridId: string, rain24h?: number): Promise<CascadeTraceResponse> {
  return request(`${API_BASE_URL}/api/v1/hydrology/cascade/${encodeURIComponent(gridId)}?${rainQuery(rain24h).replace(/^&/, "")}`);
}

export async function fetchPhysicsAudit(gridId: string, rain24h?: number): Promise<PhysicsAuditResponse> {
  return request(
    `${API_BASE_URL}/api/v1/hydrology/physics-audit/${encodeURIComponent(gridId)}?${rainQuery(rain24h).replace(/^&/, "")}`
  );
}

export async function fetchTemporalNowcast(cityId: string, rain24h?: number): Promise<TemporalNowcastResponse> {
  return request(
    `${API_BASE_URL}/api/v1/hydrology/nowcast/${cityId.toUpperCase()}?${rainQuery(rain24h).replace(/^&/, "")}`
  );
}

export async function fetchOptimizeDispatch(
  cityId: string,
  availableFleet?: Record<string, number>,
  officerName = "Municipal desk"
): Promise<DispatchOptimizationResponse> {
  return request(`${API_BASE_URL}/api/v1/operations/optimize-dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city_id: cityId.toUpperCase(),
      available_fleet: availableFleet,
      officer_name: officerName,
    }),
  });
}
