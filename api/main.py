from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from api.packager import package_and_sign
from engine.calculateCecLoad import calculate_cec_load

app = FastAPI(title="CEC 8-200 MVP Calculator")

class Appliance(BaseModel):
    va: float = 0.0

class LoadRequest(BaseModel):
    livingArea_m2: float
    systemVoltage: float
    appliances: list[Appliance] = []

@app.post("/api/v1/calc")
def calc(req: LoadRequest):
    try:
        unsigned = calculate_cec_load(
            living_area=req.livingArea_m2,
            system_voltage=req.systemVoltage,
            appliances=[a.dict() for a in req.appliances],
        )
        return package_and_sign(unsigned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
