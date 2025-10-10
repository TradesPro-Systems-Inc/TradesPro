import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api";

export async function calculateApartment(units) {
  const res = await axios.post(`${API_BASE}/apartment/calculate`, { units });
  return res.data;
}

export async function calculateProject(buildings) {
  const res = await axios.post(`${API_BASE}/project/calculate`, { buildings });
  return res.data;
}
