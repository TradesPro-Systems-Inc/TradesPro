export function lookupConductor(current) {
  if (current <= 55) return "#6 AWG Cu";
  if (current <= 70) return "#4 AWG Cu";
  if (current <= 95) return "#3 AWG Cu";
  return "#2 AWG Cu";
}
