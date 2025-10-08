import { describe, it, expect } from "vitest";
import { getResidentialHeatingAmpacity } from "./power";
import type { HeatingAmpacityInput } from "./power";

describe("getResidentialHeatingAmpacity", () => {
  const continuousFactor = 1.25;

  // Base input for residential tests
  const baseInput: Omit<
    HeatingAmpacityInput,
    | "totalHeatingKw"
    | "thermalStorageKw"
    | "ductHeaterKw"
    | "furnaceKw"
    | "hasThermostatControl"
  > = {
    hasCyclicHeating: false,
    occupancyType: "residential",
    otherLoadsKw: 0
  };

  it("should apply 100% demand for remaining kW <= 10 with thermostat control", () => {
    const input: HeatingAmpacityInput = {
      ...baseInput,
      totalHeatingKw: 8,
      thermalStorageKw: 0,
      ductHeaterKw: 0,
      furnaceKw: 0,
      hasThermostatControl: true
    };
    // Demand kW = 8 kW. Total = 8 kW. Ampacity = 8 * 1.25
    expect(getResidentialHeatingAmpacity(input)).toBe(8 * continuousFactor);
  });

  it("should apply 100% on first 10kW and 75% on remainder with thermostat control", () => {
    const input: HeatingAmpacityInput = {
      ...baseInput,
      totalHeatingKw: 12,
      thermalStorageKw: 0,
      ductHeaterKw: 0,
      furnaceKw: 0,
      hasThermostatControl: true
    };
    // Demand kW = 10kW * 100% + (12 - 10)kW * 75% = 10 + 2 * 0.75 = 11.5 kW
    // Ampacity = 11.5 * 1.25
    expect(getResidentialHeatingAmpacity(input)).toBe(11.5 * continuousFactor);
  });

  it("should apply 100% demand for all remaining kW without thermostat control", () => {
    const input: HeatingAmpacityInput = {
      ...baseInput,
      totalHeatingKw: 15,
      thermalStorageKw: 0,
      ductHeaterKw: 0,
      furnaceKw: 0,
      hasThermostatControl: false
    };
    // Demand kW = 15 kW. Ampacity = 15 * 1.25
    expect(getResidentialHeatingAmpacity(input)).toBe(15 * continuousFactor);
  });

  it("should correctly handle fixed loads combined with variable loads", () => {
    const input: HeatingAmpacityInput = {
      ...baseInput,
      totalHeatingKw: 15, // 5kW fixed + 10kW variable
      thermalStorageKw: 2,
      ductHeaterKw: 3,
      furnaceKw: 0,
      hasThermostatControl: true
    };
    // Fixed = 5kW. Remaining = 10kW.
    // Demand on remaining = 10kW * 100% = 10kW.
    // Total demand = 5kW (fixed) + 10kW (variable) = 15kW.
    // Ampacity = 15 * 1.25
    expect(getResidentialHeatingAmpacity(input)).toBe(15 * continuousFactor);
  });
});
