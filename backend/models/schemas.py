from pydantic import BaseModel
from typing import List

class Unit(BaseModel):
    area: float
    lighting: float
    appliances: int
    hvac: float

class ApartmentRequest(BaseModel):
    units: List[Unit]

class ApartmentResponse(BaseModel):
    totalLoad: float
    demandFactor: float
    serviceSize: float

class Building(BaseModel):
    name: str
    totalLoad: float

class ProjectRequest(BaseModel):
    buildings: List[Building]

class ProjectResponse(BaseModel):
    totalLoad: float
    serviceSize: float
