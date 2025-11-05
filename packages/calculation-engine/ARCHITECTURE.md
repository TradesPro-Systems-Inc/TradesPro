# CEC Calculator Engine - Architecture Documentation

## V4.1 Architecture: Stable Core with Pure Functions

### Design Principles

1. **Separation of Concerns**: Calculation logic is separated from orchestration logic
2. **Pure Functions**: All calculators are pure functions (no side effects, deterministic)
3. **Stable Coordinator**: The main rule file (`8-200-single-dwelling.ts`) should NOT be frequently modified
4. **CEC Compliance**: Each calculator strictly follows specific CEC code sections
5. **Testability**: Pure functions can be easily unit tested
6. **Audit Trail**: Every calculation step is recorded with formula references

### Directory Structure

```
packages/calculation-engine/src/
├── calculators/              # Pure calculation functions
│   ├── baseLoadCalculator.ts         # CEC 8-200 1)a)i-ii (Living area → base load)
│   ├── heatingCoolingCalculator.ts   # CEC 62-118 3), 8-106 3) (HVAC demand)
│   ├── rangeLoadCalculator.ts        # CEC 8-200 1)a)iv (Range demand)
│   ├── waterHeaterCalculator.ts      # CEC 8-200 1)a)v (Water heater demand)
│   ├── evseCalculator.ts             # CEC 8-200 1)a)vi, 8-106 11 (EVSE demand)
│   ├── largeLoadCalculator.ts        # CEC 8-200 1)a)vii (Other large loads)
│   └── applianceLoadCalculator.ts    # Re-exports all appliance calculators
│
├── core/                     # Core types and table management
│   ├── types.ts              # TypeScript type definitions
│   ├── tables.ts             # Node.js table manager
│   ├── tables.browser.ts     # Browser-compatible table manager
│   └── tableLookups.ts       # Pure functions for table lookups
│
└── rules/                    # Rule coordinators (STABLE)
    └── 8-200-single-dwelling.ts  # Orchestrates CEC 8-200 calculation
```

### Calculator Modules (Pure Functions)

#### 1. Base Load Calculator (`baseLoadCalculator.ts`)
**CEC Reference**: 8-200 1)a)i-ii  
**Purpose**: Calculate basic electrical load based on living area

**Functions**:
- `calculateBaseLoad(livingArea_m2: number): number`
  - First 90m²: 5000W
  - Additional: 1000W per 90m² portion (rounded up)

**Example**:
```typescript
calculateBaseLoad(100)  // Returns 6000W
// Explanation: 5000W + ceil(10/90) × 1000W = 6000W
```

#### 2. Heating/Cooling Calculator (`heatingCoolingCalculator.ts`)
**CEC Reference**: 62-118 3), 8-106 3)  
**Purpose**: Calculate HVAC demand with proper demand factors

**Functions**:
- `calculateHeatingCoolingLoad(heatingLoadW, coolingLoadW, isInterlocked): number`
  - Heating ≤10kW: 100%
  - Heating >10kW: 10kW @ 100% + excess @ 75%
  - Interlock: Use max(heating, cooling)
  - No interlock: Sum both

**Example**:
```typescript
calculateHeatingCoolingLoad(12000, 2000, false)
// Returns: 11500W (heating) + 2000W (cooling) = 13500W
// Heating: 10000 @ 100% + 2000 @ 75% = 11500W
```

#### 3. Range Load Calculator (`rangeLoadCalculator.ts`)
**CEC Reference**: 8-200 1)a)iv  
**Purpose**: Calculate electric range demand load

**Functions**:
- `calculateRangeLoad(rangeRating_kW: number): number`
  - Rating ≤12kW: 6000W
  - Rating >12kW: 6000W + 40% of excess

**Example**:
```typescript
calculateRangeLoad(14)  // Returns 6800W
// Explanation: 6000W + 40% × (14-12) × 1000 = 6800W
```

#### 4. Water Heater Calculator (`waterHeaterCalculator.ts`)
**CEC Reference**: 8-200 1)a)v, Section 62  
**Purpose**: Calculate water heater demand load

**Functions**:
- `calculateWaterHeaterLoad(ratingW, type): number`
  - All types (tankless, storage, pool/spa): 100%

**Example**:
```typescript
calculateWaterHeaterLoad(4500, 'storage')  // Returns 4500W
```

#### 5. EVSE Calculator (`evseCalculator.ts`)
**CEC Reference**: 8-200 1)a)vi, 8-106 11  
**Purpose**: Calculate EVSE (Electric Vehicle Supply Equipment) demand

**Functions**:
- `calculateEVSELoad(ratingW, hasEVEMS): number`
  - With EVEMS: 0W (exempted)
  - Without EVEMS: 100%

**Example**:
```typescript
calculateEVSELoad(7200, false)  // Returns 7200W (no EVEMS)
calculateEVSELoad(7200, true)   // Returns 0W (managed by EVEMS)
```

#### 6. Large Load Calculator (`largeLoadCalculator.ts`)
**CEC Reference**: 8-200 1)a)vii  
**Purpose**: Calculate demand for other large loads (>1500W)

**Functions**:
- `calculateLargeLoads(totalLargeLoadW, hasElectricRange): number`
  - With range: 25% of all large loads
  - Without range: 100% up to 6000W + 25% of excess

**Example**:
```typescript
// With range present
calculateLargeLoads(8000, true)   // Returns 2000W (8000 × 25%)

// Without range
calculateLargeLoads(8000, false)  // Returns 6500W
// Explanation: 6000W @ 100% + 2000W @ 25% = 6500W
```

### Rule Coordinator (`8-200-single-dwelling.ts`)

**Purpose**: Orchestrate the complete CEC 8-200 calculation by calling pure functions

**Responsibilities**:
1. ✅ Accept inputs and ruleTables
2. ✅ Call specialized calculator functions
3. ✅ Create detailed audit trail
4. ✅ Assemble final calculation bundle
5. ❌ DOES NOT contain calculation logic
6. ❌ Should NOT be frequently modified

**Key Design Points**:
- **Stability**: This file should remain stable across versions
- **Orchestration**: Only coordinates calculations, doesn't perform them
- **Audit Trail**: Records every step with formula references
- **Type Safety**: Uses TypeScript for compile-time verification

### Calculation Flow (CEC 8-200)

```
Input: CecInputsSingle + EngineMeta + RuleTables
  │
  ├─► Step 1: Basic Load (baseLoadCalculator)
  │    └─► 5000W + 1000W per 90m² portion
  │
  ├─► Step 2: Categorize Appliances by Type
  │    └─► range, heating, cooling, water_heater, evse, etc.
  │
  ├─► Step 3: HVAC Load (heatingCoolingCalculator)
  │    └─► Apply CEC 62-118 demand factors
  │
  ├─► Step 4: Range Load (rangeLoadCalculator)
  │    └─► 6000W + 40% of excess over 12kW
  │
  ├─► Step 5: Water Heaters (waterHeaterCalculator)
  │    └─► Each at 100%
  │
  ├─► Step 6: Pool/Spa (waterHeaterCalculator)
  │    └─► Each at 100%
  │
  ├─► Step 7: EVSE (evseCalculator)
  │    └─► 100% unless EVEMS
  │
  ├─► Step 8: Other Large Loads (largeLoadCalculator)
  │    └─► 25% if range, else 100% up to 6kW + 25% excess
  │
  ├─► Step 9: Small Loads (≤1500W)
  │    └─► 100%
  │
  ├─► Step 10: Sum Appliances
  │
  ├─► Step 11: Method A Total = Basic + Appliances
  │
  ├─► Step 12: Method B = Minimum (14.4kW or 24kW)
  │
  ├─► Step 13: Final Load = max(Method A, Method B)
  │
  ├─► Step 14: Service Current = Load ÷ Voltage
  │
  ├─► Step 15: Conductor Selection (tableLookups)
  │
  └─► Step 16: Breaker/Panel Sizing
       │
       └─► Output: UnsignedBundle with complete audit trail
```

### Example Calculation

**Inputs**:
- Living Area: 100m²
- Range: 14kW
- Water Heater: 4500W
- EVSE: 7200W (no EVEMS)
- Air Conditioning: 2233W
- Voltage: 240V, Single Phase

**Step-by-Step**:
```
1. Basic Load:
   100m² → 5000W + ceil(10/90) × 1000W = 6000W

2. Air Conditioning:
   2233W @ 100% = 2233W

3. Range:
   14kW → 6000W + 40% × (14-12) × 1000 = 6800W

4. Water Heater:
   4500W @ 100% = 4500W

5. EVSE:
   7200W @ 100% (no EVEMS) = 7200W

6. Total Appliances:
   2233 + 6800 + 4500 + 7200 = 20,733W

7. Method A:
   6000 + 20,733 = 26,733W

8. Method B:
   100m² ≥ 80m² → 24,000W

9. Final Load:
   max(26,733W, 24,000W) = 26,733W

10. Service Current:
    26,733W ÷ 240V = 111.39A

11. Breaker:
    Next standard size ≥ 111.39A = 125A
```

### Testing Strategy

Each pure function can be independently tested:

```typescript
// Example unit test
describe('calculateRangeLoad', () => {
  it('should return 6000W for 12kW range', () => {
    expect(calculateRangeLoad(12)).toBe(6000);
  });
  
  it('should return 6800W for 14kW range', () => {
    expect(calculateRangeLoad(14)).toBe(6800);
  });
  
  it('should return 7200W for 15kW range', () => {
    expect(calculateRangeLoad(15)).toBe(7200);
  });
});
```

### Adding New Calculators

When adding a new calculator:

1. Create a new file in `calculators/` (e.g., `generatorCalculator.ts`)
2. Implement pure functions with clear CEC references
3. Add unit tests
4. Export from `applianceLoadCalculator.ts` (if appliance-related)
5. Update the coordinator to call the new function
6. Update this documentation

### Maintenance Guidelines

**DO**:
- ✅ Add new calculator modules for new appliance types
- ✅ Update calculator functions when CEC rules change
- ✅ Add comprehensive unit tests for all calculators
- ✅ Document CEC section references in code comments
- ✅ Return detailed audit information from calculators

**DON'T**:
- ❌ Put calculation logic directly in the coordinator
- ❌ Modify the coordinator for minor calculation changes
- ❌ Mix I/O operations with pure calculations
- ❌ Use global state or side effects in calculators
- ❌ Hardcode values without CEC references

### Version History

- **V4.1** (2025-10-29): Refactored to stable coordinator with pure function calculators
- **V4.0**: Initial implementation with V4.1 architecture
- **V3.x**: Legacy implementation (deprecated)

---

**Last Updated**: 2025-10-29  
**Architecture Version**: V4.1  
**CEC Edition**: 2024





