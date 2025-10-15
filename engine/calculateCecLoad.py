import json
import math
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# -------------------------------------------------------
# ✅ Table 2 导线查表（简化但接近官方数据）
# -------------------------------------------------------
def load_table2():
    table_path = os.path.join(BASE_DIR, "table2.json")
    with open(table_path, "r", encoding="utf-8") as f:
        return json.load(f)

# -------------------------------------------------------
# ✅ 导线查找逻辑（含温度、并列、修正）
# -------------------------------------------------------
def lookup_conductor_from_table(current_a, material="Cu", temp_c=30, num_parallel=1):
    table = load_table2()
    rows = table.get(material, [])

    # 温度修正系数（根据 30°C 基准）
    if temp_c <= 30:
        temp_factor = 1.0
    elif temp_c <= 40:
        temp_factor = 0.91
    elif temp_c <= 50:
        temp_factor = 0.82
    else:
        temp_factor = 0.71

    # 并列修正系数（简单模型）
    parallel_factor = 1.0 if num_parallel <= 3 else 0.8

    adjusted_current = current_a / (temp_factor * parallel_factor)

    for row in rows:
        if row["ampacity"] >= adjusted_current:
            return {
                "conductorSize": row["size"],
                "baseAmpacity": row["ampacity"],
                "adjustedCurrent": adjusted_current,
                "tempFactor": temp_factor,
                "parallelFactor": parallel_factor,
            }

    return {
        "conductorSize": "N/A",
        "baseAmpacity": 0,
        "adjustedCurrent": adjusted_current,
        "tempFactor": temp_factor,
        "parallelFactor": parallel_factor,
    }

# -------------------------------------------------------
# ✅ 核心计算函数
# -------------------------------------------------------
def calculate_cec_load(living_area, system_voltage, appliances=None):
    if appliances is None:
        appliances = []

    steps = []

    # 1️⃣ Basic load per 8-200 (a)
    if living_area <= 90:
        base_load = 5000
        formula = "P = 5000 (≤90 m²)"
    else:
        extra = math.ceil((living_area - 90) / 90)
        base_load = 5000 + extra * 1000
        formula = f"P = 5000 + {extra} × 1000"

    steps.append({
        "stepIndex": 1,
        "description": "Basic load (8-200 a)",
        "formula": formula,
        "value": base_load,
        "unit": "W"
    })

    # 2️⃣ Appliance total
    appliances_va = sum(a.get("va", 0) for a in appliances)
    steps.append({
        "stepIndex": 2,
        "description": "Total appliance load",
        "formula": "Σ appliance VA",
        "value": appliances_va,
        "unit": "VA"
    })

    # 3️⃣ Total before comparison
    total_va = base_load + appliances_va
    steps.append({
        "stepIndex": 3,
        "description": "Subtotal demand",
        "formula": "P_total = base_load + appliances",
        "value": total_va,
        "unit": "VA"
    })

    # 4️⃣ Minimum service (b)
    b_load = 24000 if living_area >= 80 else 14400
    steps.append({
        "stepIndex": 4,
        "description": "Minimum service (8-200 b)",
        "formula": "P_min = 24,000 W (≥80 m²) else 14,400 W",
        "value": b_load,
        "unit": "W"
    })

    # 5️⃣ Choose greater of (a) or (b)
    final_demand_va = max(total_va, b_load)
    steps.append({
        "stepIndex": 5,
        "description": "Choose greater of (a) or (b)",
        "formula": "P_final = max(P_total, P_min)",
        "value": final_demand_va,
        "unit": "VA"
    })

    # 6️⃣ Service current
    service_current_a = final_demand_va / system_voltage
    steps.append({
        "stepIndex": 6,
        "description": "Service current",
        "formula": "I = P_final / V",
        "value": round(service_current_a, 2),
        "unit": "A"
    })

    # 7️⃣ Conductor lookup (Table 2)
    conductor_info = lookup_conductor_from_table(service_current_a)
    steps.append({
        "stepIndex": 7,
        "description": "Conductor size selection (CEC Table 2)",
        "formula": f"Lookup({round(service_current_a,2)} A, {conductor_info['tempFactor']} temp factor)",
        "value": conductor_info["conductorSize"],
        "details": conductor_info
    })

    # 结果包
    result = {
        "inputs": {
            "livingArea_m2": living_area,
            "systemVoltage": system_voltage,
            "appliances": appliances,
        },
        "results": {
            "demandVA": round(final_demand_va, 2),
            "serviceCurrentA": round(service_current_a, 2),
            "conductorSize": conductor_info["conductorSize"]
        },
        "steps": steps,
        "meta": {
            "engine": "CEC-MVP",
            "ruleSet": "CEC 8-200",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    }

    return result
