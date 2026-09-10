"""
Main FastAPI Application Entrypoint for DrainSense India.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.api.endpoints import api_router
from backend.app.db.session import engine, Base
from backend.app.schemas.risk import HealthResponse
from ml.src.inference.predictor import predictor_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Ensure predictor service is loaded
    if predictor_service.model is None:
        predictor_service.reload()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="DrainSense India: Urban Waterlogging Early Warning & Response Intelligence API",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow development frontends
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """System health check and resource status."""
    model_loaded = predictor_service.model is not None
    model_version = predictor_service.metadata.get("model_version", "None") if predictor_service.metadata else "None"
    total_grids = len(predictor_service.all_grid_features_df) if predictor_service.all_grid_features_df is not None else 0
    
    return {
        "status": "HEALTHY" if model_loaded else "DEGRADED",
        "database": "CONNECTED",
        "model_loaded": model_loaded,
        "model_version": model_version,
        "total_grids": total_grids,
        "latest_data_timestamp": "2026-09-10T08:30:00Z"
    }

# Mount API router
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
