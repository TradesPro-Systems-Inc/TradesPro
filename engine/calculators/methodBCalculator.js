export function calculateMethodB(livingArea) {
  const steps = [];
  const value = livingArea >= 80 ? 24000 : 14400;
  steps.push({
    stepIndex: 1,
    description: "Method (b) minimum load",
    formula: "≥80 m² → 24000 W else 14400 W",
    value
  });
  return { value, steps };
}
