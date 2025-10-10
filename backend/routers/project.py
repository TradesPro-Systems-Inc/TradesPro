from fastapi import APIRouter
from models.schemas import ProjectRequest, ProjectResponse
from core.utils import get_service_size

router = APIRouter(prefix="/api/project", tags=["Project"])

@router.post("/calculate", response_model=ProjectResponse)
async def calculate_project_load(data: ProjectRequest):
    total = sum(b.totalLoad for b in data.buildings)
    building_count = len(data.buildings)
    overall_factor = 0.9 if building_count > 1 else 1.0
    total_load = total * overall_factor
    service_size = get_service_size(total_load)

    return ProjectResponse(
        totalLoad=round(total_load, 2),
        serviceSize=service_size,
    )
