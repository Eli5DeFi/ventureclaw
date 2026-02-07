# Prisma Schema Fix Plan - SQLite Array Incompatibility

**Problem:** SQLite doesn't support `String[]` primitive arrays  
**Impact:** Cannot generate Prisma client (25 validation errors)  
**Solution:** Convert arrays to JSON-encoded strings

---

## Affected Models & Fields

### High Priority (Core Features)
These models are used by current features and need fixing immediately:

1. **VC** (VC Persona system)
   - `focusAreas: String[]` → `focusAreas: String` (JSON)
   - `stagePreference: String[]` → `stagePreference: String` (JSON)
   - `portfolio: String[]` → `portfolio: String` (JSON)
   - `priorities: String[]` → `priorities: String` (JSON)

2. **MemorySearch** (Semantic Memory)
   - `topResultIds: String[]` → `topResultIds: String` (JSON)

### Medium Priority (Matching Engine)
These models are for future features but block schema generation:

3. **Project**
   - `geography: String[]` → `geography: String` (JSON)
   - `keyRisks: String[]` → `keyRisks: String` (JSON)
   - `keyOpportunities: String[]` → `keyOpportunities: String` (JSON)
   - `comparables: String[]` → `comparables: String` (JSON)
   - `exitScenarios: String[]` → `exitScenarios: String` (JSON)
   - `idealInvestorTypes: String[]` → `idealInvestorTypes: String` (JSON)

4. **Investor**
   - `focusAreas: String[]` → `focusAreas: String` (JSON)
   - `stagePreference: String[]` → `stagePreference: String` (JSON)
   - `geography: String[]` → `geography: String` (JSON)
   - `priorities: String[]` → `priorities: String` (JSON)
   - `dealBreakers: String[]` → `dealBreakers: String` (JSON)
   - `portfolioCompanies: String[]` → `portfolioCompanies: String` (JSON)

5. **Match**
   - `synergies: String[]` → `synergies: String` (JSON)
   - `concerns: String[]` → `concerns: String` (JSON)

6. **ExitAnalysis**
   - `topAcquirers: String[]` → `topAcquirers: String` (JSON)

---

## Implementation Strategy

### Option 1: Quick Fix (THIS CYCLE)
**Goal:** Get `prisma generate` working immediately

**Approach:**
1. Change all `String[]` to `String` in schema
2. Add comments `// JSON array: ['item1', 'item2']`
3. Regenerate Prisma client
4. Update code to serialize/deserialize as needed
5. Run tests

**Pros:**
- ✅ Fixes schema generation immediately
- ✅ Minimal code changes (JSON.parse/stringify)
- ✅ Works with SQLite

**Cons:**
- ⚠️ Less elegant than native arrays
- ⚠️ Need helper functions
- ⚠️ Manual serialization

**Estimated Time:** 45 minutes

---

### Option 2: PostgreSQL Migration (CYCLE 24-25)
**Goal:** Proper database with full array support

**Approach:**
1. Set up PostgreSQL (Docker or managed service)
2. Update DATABASE_URL
3. Keep String[] in schema (PostgreSQL supports it)
4. Run migration
5. No code changes needed

**Pros:**
- ✅ Native array support
- ✅ Better performance
- ✅ Unlocks advanced features (semantic search vectors)
- ✅ Production-ready

**Cons:**
- ⏳ Requires infrastructure setup
- ⏳ Need data migration plan
- ⏳ 2-4 hours of work

**Recommended:** Do this in Cycle 24 or 25

---

## Quick Fix Implementation (Option 1)

### Step 1: Update Schema

Replace all `String[]` with `String` and add JSON comments:

```prisma
model VC {
  // ... other fields ...
  
  focusAreas      String   // JSON: ["AI", "Web3", "FinTech"]
  stagePreference String   // JSON: ["SEED", "SERIES_A"]
  portfolio       String   // JSON: ["Company A", "Company B"]
  priorities      String   // JSON: ["Team", "Market", "Traction"]
  
  // ... rest of model ...
}
```

### Step 2: Create Helper Functions

```typescript
// src/lib/utils/json-arrays.ts

export function encodeStringArray(arr: string[]): string {
  return JSON.stringify(arr);
}

export function decodeStringArray(str: string | null): string[] {
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}
```

### Step 3: Update Code

**Before:**
```typescript
const vc = await prisma.vC.create({
  data: {
    focusAreas: ["AI", "Web3"],
  }
});

console.log(vc.focusAreas); // ["AI", "Web3"]
```

**After:**
```typescript
const vc = await prisma.vC.create({
  data: {
    focusAreas: JSON.stringify(["AI", "Web3"]),
  }
});

const areas = JSON.parse(vc.focusAreas); // ["AI", "Web3"]
```

### Step 4: Test

- [ ] Run `npx prisma generate` (should succeed)
- [ ] Run test suite (should pass)
- [ ] Test VC persona creation
- [ ] Test semantic memory search
- [ ] Verify no runtime errors

---

## Rollback Plan

If Option 1 causes issues:

1. Revert schema changes: `git checkout prisma/schema.prisma`
2. Keep using stale Prisma client (works but no COPILOT enum)
3. Schedule PostgreSQL migration for Cycle 24

---

## Decision: Option 1 (Quick Fix)

**Rationale:**
1. Unblocks Prisma client generation immediately
2. Allows proper COPILOT enum support
3. Minimal risk (JSON is reliable)
4. Can still migrate to PostgreSQL later (data is already JSON-compatible)

**Next Step:** Implement schema changes

---

**Status:** 📋 Plan Ready  
**Estimated Time:** 45 minutes  
**Risk Level:** Low  
**Reversible:** Yes
