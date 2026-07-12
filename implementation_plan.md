# Review & Calibration Implementation Plan

This plan outlines the workflow for reviewing the hardware-related source code, ESP32-S3 firmware, Python backend, and signal-processing utilities in the **Silent Sense** project.

## Goal Description

The goal is to conduct a mathematically and physically rigorous review of all sensing subsystems, resolving bugs, and ensuring exactness by replacing empirical "magic constants" with verified scientific formulas and papers. This encompasses:
- **ESP32-S3 (16N8R) Firmware**: Aligning Wi-Fi CSI amplitude/phase extraction and BLE scanning with theoretical baselines.
- **Signal Processing & ML Backend**: Utilizing the host machine's **NVIDIA RTX 3050 GPU** for high-throughput pipelines (such as WiFi-DensePose tracking, RuVLLM, and WiFlow models).
- **Physical Calibration**: Replacing hardcoded coefficients (e.g. `0.85` signal-to-distance scaling) with physical models (e.g., Log-Distance Path Loss, phase unwrapping, and bandpass/FFT calculations for vital signs).
- **Full Scope Coverage**: Retaining and optimization of all modules—including Wi-Fi CSI, BLE Proximity, mmWave Radar, and Acoustic Doppler fallback.

---

## Technical Feasibility: BLE on ESP32-S3 (16N8R)

The ESP32-S3 (with 16MB Flash and 8MB PSRAM) is highly capable of running the NimBLE stack alongside Wi-Fi CSI capture. However, BLE RSSI is notoriously noisy due to multipath fading, shadow fading, and antenna polarization. To obtain "exact results" for positioning or occupancy:
1. **On-Chip Filtering**: We will implement a **Kalman Filter** or a **Double Exponential Moving Average (DEMA)** filter on the ESP32 to smooth RSSI values in real-time, leveraging the ESP32-S3's PSRAM to store historical statistics.
2. **Path Loss Modeling**: Rather than using magic values, RSSI-to-distance conversion will follow the **Log-Distance Path Loss Model**:
   $$d = 10^{\frac{P_{tx} - RSSI - X_g}{10 \cdot n}}$$
   where $P_{tx}$ is the RSSI at 1 meter, $n$ is the path loss exponent (calibrated for indoor environments), and $X_g$ is a Gaussian random variable representing flat fading.

---

## User Review & Clarifications

> [!NOTE]
> - **Host Hardware Acceleration**: We will optimize Python models (`densepose.py`, `vitals_suite.py`) to run directly on your **RTX 3050 GPU** via PyTorch/CUDA, removing CPU-bound bottlenecks.
> - **Formula Validation**: All magic coefficients will be replaced by verified formulas from research papers (e.g., phase-difference denoising from *Wi-Fi CSI-based passive vital sign monitoring*).

---

## Proposed Changes

### 1. ESP32-S3 Firmware (`hardware/esp32/firmware/`)

#### [MODIFY] [csi_collector.c](file:///c:/Users/Aayush%20Walsangikar/OneDrive/Desktop/Silent%20Sense/hardware/esp32/firmware/main/csi_collector.c)
- Refactor raw CSI parsing to extract exact amplitude and phase according to ESP32-S3 subcarrier mappings.
- Implement phase-sanitization formulas (linear phase unwrapping and removal of sampling frequency offset).

#### [NEW] [ble_filter.c](file:///c:/Users/Aayush%20Walsangikar/OneDrive/Desktop/Silent%20Sense/hardware/esp32/firmware/main/ble_filter.c)
- Add a 1D Kalman filter to smooth raw RSSI readings from BLE advertising packets.

#### [MODIFY] [edge_processing.c](file:///c:/Users/Aayush%20Walsangikar/OneDrive/Desktop/Silent%20Sense/hardware/esp32/firmware/main/edge_processing.c)
- Clean up localized DSP features, replacing fixed threshold bounds with dynamic variance-based thresholds.

---

### 2. Python Backend (`backend/`)

#### [MODIFY] [ble_collector.py](file:///c:/Users/Aayush%20Walsangikar/OneDrive/Desktop/Silent%20Sense/backend/ble_collector.py)
- Receive the Kalman-filtered BLE RSSI and apply the Log-Distance Path Loss Model to compute exact distances.

#### [MODIFY] [vitals_suite.py](file:///c:/Users/Aayush%20Walsangikar/OneDrive/Desktop/Silent%20Sense/backend/vitals_suite.py)
- Refactor the vital sign detector. Replace hardcoded FFT multipliers with the exact mathematical formulation of the Discrete Fourier Transform (DFT) windowing adjustments.
- Implement Welch’s method for PSD estimation to improve heart-rate peak selection.

#### [MODIFY] [densepose.py](file:///c:/Users/Aayush%20Walsangikar/OneDrive/Desktop/Silent%20Sense/backend/densepose.py)
- Ensure the neural network inference code is explicitly directed to load parameters and compute on the **RTX 3050 GPU** (using `cuda:0` via PyTorch) for real-time 3D twin rendering.

#### [MODIFY] [acoustic_collector.py](file:///c:/Users/Aayush%20Walsangikar/OneDrive/Desktop/Silent%20Sense/backend/acoustic_collector.py)
- Review the acoustic fallback pipeline. Correct the phase demodulation equations used to extract chest-displacement metrics from Doppler shift signals.

---

### 3. Signal Processing Utilities (`signal_processing/`)

#### [MODIFY] [gait-analyzer.js](file:///c:/Users/Aayush%20Walsangikar/OneDrive/Desktop/Silent%20Sense/signal_processing/node_utilities/gait-analyzer.js)
- Align gait metrics (cadence, stride length) with spatial step-estimation physics instead of empirical scaling coefficients.

#### [MODIFY] [rf-tomography.js](file:///c:/Users/Aayush%20Walsangikar/OneDrive/Desktop/Silent%20Sense/signal_processing/node_utilities/rf-tomography.js)
- Update the weight matrices using a mathematically correct ellipsoidal Fresnel zone model for multi-person tracking.

---

## Verification Plan

### Automated Testing
- **Unit Tests**: Add tests in `backend/tests/` to verify the mathematical outputs of the Kalman filter, Log-Distance Path Loss equation, and Welch's PSD calculation against reference inputs.
- **CUDA/GPU Acceleration Verification**: Run a validation script to assert that `densepose.py` successfully allocates Safetensor weights onto CUDA memory without falling back to CPU.

### Manual Verification
- Log raw BLE RSSI data and visualize the filtered output to verify standard deviation reduction.
- Compare vitals output (BPM) against a ground-truth physical sensor to validate the updated FFT equations.
