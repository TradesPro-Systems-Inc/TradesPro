export function calculateBaseLoad(livingArea) {
  const steps = [];
  let base = 5000;
  steps.push({
    stepIndex: 1,
    description: "Basic load (CEC 8-200 1)a)i)",
    formula: "5000 W for first 90 m²",
    value: 5000
  });
  if (livingArea > 90) {
    const add = Math.ceil((livingArea - 90) / 90) * 1000;
    base += add;
    steps.push({
      stepIndex: 2,
      description: "Additional 1000W per 90m² beyond first 90",
      formula: "5000 + ceil((area-90)/90)*1000",
      value: add
    });
  }
  return { value: base, steps };
}
