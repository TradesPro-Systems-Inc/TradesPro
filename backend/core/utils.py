def get_demand_factor(num_units: int) -> float:
    if num_units <= 1:
        return 1.0
    elif num_units <= 5:
        return 0.9
    elif num_units <= 10:
        return 0.75
    elif num_units <= 20:
        return 0.65
    else:
        return 0.55


def get_service_size(total_load_w: float) -> float:
    amperage = total_load_w / 230.0
    if amperage <= 100:
        return 100
    elif amperage <= 200:
        return 200
    elif amperage <= 400:
        return 400
    else:
        return round(amperage / 100) * 100
