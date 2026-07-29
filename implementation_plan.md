# Physics-Grounded Per-Occupant Tracking Engine

## Background & Problem Statement

The current backend has a fundamental architecture flaw: **one single global Doppler velocity is computed for the whole room and then cloned to every occupant**. This is why "when one person moves, all dummies move simultaneously."

The root physics constraint with a **single ESP32 (1 TX-RX link)** is:

> The received CSI signal at each subcarrier is the **superposition** of all reflections:
> `H[k] = Σ_n a_n · exp(-j·2π·f_k·τ_n)`
> where each `n` is a scatterer (person, wall, furniture).

This means we **cannot** extract per-person I/Q velocity directly from a scalar Doppler shift. **But we CAN** using the OFDM Channel Impulse Response (CIR):

> `h[m] = IDFT{H[k]}` → each peak at bin `m` corresponds to a scatterer at excess path delay `τ_m = m·T_sc`
> Distance: `d_m = τ_m · c = m · c / B` where `B = N_sc × Δf`
> **The phase of h[m] across time** gives the Doppler of that specific scatterer only.

This is the standard OFDM radar principle used in papers like "Widar2.0" (NSDI 2018) and "EI" (MobiCom 2019).

---

## Open Questions

> [!IMPORTANT]
> **ESP32 antenna count**: Terminal shows `n_ant=1` typically. With 1 antenna we get range (distance) but NOT angle-of-arrival (AoA). Occupants will be placed on a 1D line at their correct distances, fanned out at estimated angles using the subcarrier phase gradient as a rough proxy.

> [!NOTE]
> **Phase data quality**: The ESP32 sends raw phase per subcarrier (`phase_list[:56]`). Phase calibration (removing hardware offset, STO, CFO) is needed for accurate AoA — this plan includes hardware-offset correction.

---

## Proposed Changes

### Component 1: CIR Engine (`backend/cir_engine.py`) — [NEW]

New module implementing the OFDM radar pipeline:

#### [NEW] `cir_engine.py`
```
CirEngine:
  - compute_cir(amplitudes, phases) → complex CIR array
  - find_range_peaks(cir, min_dist_m, max_dist_m) → [(distance_m, power, phase)]
  - compute_bin_doppler(cir_prev, cir_curr, dt, bin_idx) → velocity_mps
  - estimate_aoa_phase_gradient(phases, n_antennas) → angle_rad
```

**Key formulas:**
```
# CIR from OFDM subcarriers
H[k] = A[k] · exp(j·φ[k])          # complex CSI per subcarrier
h[m] = IFFT{H[k]}                   # channel impulse response

# Range from bin index
d_m = m · c / (2 · B)              # B = n_sc × Δf (Δf=312500 Hz for 802.11n/ac)
range_resolution = c / (2B) ≈ 0.78m for 192 sc, ≈ 2.34m for 64 sc

# Per-bin Doppler (key innovation: independent per scatterer)
dφ_m = angle(h_curr[m] · conj(h_prev[m]))
v_m  = dφ_m · λ / (4π · dt)       # λ = c/f ≈ 0.052m at 5.8GHz

# AoA from phase gradient (single-antenna approximation)
dφ/df = -2π · τ_excess              # slope of phase vs frequency
τ_excess = -(dφ/df) / (2π)
d_excess = τ_excess · c
θ ≈ arcsin(d_excess / d_ref)       # rough angle
```

---

### Component 2: `ws_server.py` — [MODIFY]

#### `__init__` additions:
```python
from .cir_engine import CirEngine
self._cir_engine = CirEngine(n_subcarriers=192, freq_mhz=5800, n_antennas=1)
self._prev_cir = None          # CIR from last tick for per-bin Doppler
self._prev_cir_ts = 0.0
```

#### Replace fake position generator (lines ~1079–1145):
Remove the current fallback `while len(estimated_positions) < wifi_occupancy_estimate` loop that generates fake angular positions. Replace with:

```python
# ── CIR-Based Range Profile Position Estimation ──────────────────
if csi_data and "amplitude" in csi_data and len(csi_data["amplitude"]) >= 8:
    cir_positions, cir_velocities = self._cir_engine.estimate_positions_and_velocities(
        amplitudes=csi_data["amplitude"],
        phases=csi_data.get("phase", []),
        prev_cir=self._prev_cir,
        dt=tick_dt,
        n_persons=wifi_occupancy_estimate,
        d_reference=d_rl,
    )
    for pos, vel in zip(cir_positions, cir_velocities):
        estimated_positions.append(pos)
        doppler_velocities.append(vel)
        phase_directions.append(math.atan2(pos[1], pos[0]))
    # Update CIR buffer
    self._prev_cir = self._cir_engine.last_cir
    self._prev_cir_ts = ts
```

#### Remove global velocity from occupant loop:
The global `velocity` variable should no longer be passed into `doppler_velocities`. Instead each person gets their own from the CIR bin.

#### Per-occupant activity thresholds (physics-tuned):
```
v > 0.4 m/s  → walk    (translational body movement)
v > 0.15 m/s → stand   (postural shift, weight transfer)
v ≤ 0.15 m/s → sit     (micro-movements, breathing only)
```

Rationale:
- Walking human velocity: 1–2 m/s, but WiFi Doppler underestimates by ~4x (λ/4π scaling, partial reflection angle). Effective threshold ~0.4 m/s.
- Standing fidget: ~0.2–0.5 m/s real → ~0.1–0.15 effective.

---

### Component 3: `multi_person_tracker.py` — [MODIFY]

#### `update_tracking()` — accept per-occupant velocity:
Current: tracker computes velocity from position delta only.
Change: **Blend CIR-derived Doppler with position-delta velocity** (position delta is noisy for stationary people; CIR Doppler is more sensitive):

```python
# Blend: position-delta velocity (spatial) + CIR Doppler (motion)
if doppler_velocities and idx < len(doppler_velocities):
    cir_v = doppler_velocities[idx]
    # Use CIR Doppler as the primary motion signal
    occ.vx = 0.4 * occ.vx + 0.6 * (vx + cir_v * math.cos(occ.direction))
    occ.vy = 0.4 * occ.vy + 0.6 * (vy + cir_v * math.sin(occ.direction))
```

---

## What This Solves

| Problem | Root Cause | Fix |
|---|---|---|
| All move together | Global velocity → all occupants | Per-bin CIR Doppler: velocity is measured at each scatterer's range bin independently |
| No movement shown | Position re-generated each tick from scratch, delta=0 | CIR peaks give stable positions + real Doppler shift |
| False WALK label | Raw amplitude variance fed to CNN normalizer | CNN bypassed; activity from per-occupant CIR Doppler |
| Occupants stacked | Fake angular distribution | CIR peaks = real range distances, spread with phase-gradient AoA |

## Verification Plan

1. Check `cir_engine.py` unit test: feed known 2-path CIR (direct + 2m reflected), verify 2 peaks at correct distances
2. Restart backend, stand still → all occupants show `SITTING`, speed ≈ 0
3. Walk in front of ESP32 → only nearest occupant shows `WALK`, others unchanged
4. Fall simulation (fast drop) → fall alert fires for closest occupant, others unchanged

