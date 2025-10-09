from fastapi import APIRouter
from models.schemas import ApartmentRequest, ApartmentResponse
from core.utils import get_demand_factor, get_service_size

router = APIRouter(prefix="/api/apartment", tags=["Apartment"])

@router.post("/calculate", response_model=ApartmentResponse)
async def calculate_apartment_load(data: ApartmentRequest):
    total_connected_load = sum(
        u.lighting + u.appliances * 1500 + u.hvac for u in data.units
    )
    demand_factor = get_demand_factor(len(data.units))
    total_demand_load = total_connected_load * demand_factor
    service_size = get_service_size(total_demand_load)

    return ApartmentResponse(
        totalLoad=round(total_demand_load, 2),
        demandFactor=demand_factor,
        serviceSize=service_size,
    )
