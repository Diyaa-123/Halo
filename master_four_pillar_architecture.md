# SilentSense Four-Pillar Multi-Person Sensing Master Architecture

## 1. Overview

SilentSense is a passive Wi-Fi sensing platform designed to solve the hardest problem in ambient health monitoring: reliably tracking a specific person in a multi-occupant environment when standard sensing systems become ambiguous or fail.

This master architecture merges four complementary pillars into one unified methodology:

1. Multi-Modal Wi-Fi Sensing
2. RSSI Presence and People Counting
3. VitalCSI Respiratory Sensing
4. WiEat Fine-Grained Eating Monitoring

The central idea is simple:

- Use RSSI for coarse occupancy and crowd-size gating.
- Use CSI-based respiration for physiological identity anchoring.
- Use fine-grained behavior sensing for contextual confirmation.
- Use multi-modal training, fusion, and distillation to make the Wi-Fi-only deployment robust.

The system remains wearable-free, camera-free in deployment, and privacy-preserving.

## 2. Core Thesis

When all systems fail to track a specific person in a crowded space, the right answer is not one brittle classifier. The correct approach is a layered attribution stack that combines occupancy, physiology, behavior, and cross-modal training support into one confidence-based inference engine.

## 3. Main USP

SilentSense focuses on target-person sensing in multi-occupant environments without wearables, cameras, or intrusive user action.

This is the key differentiator:

- Not just sensing presence.
- Not just estimating respiration.
- Not just detecting eating.
- Not just fusing modalities.

It is about keeping identity stable when the environment becomes messy, crowded, or contradictory.

## 4. The Four Pillars

### Pillar 1: Multi-Modal Wi-Fi Sensing

**Source file:** `MultiModal_WiFi_Sensing_Architecture_Methodology.docx`

This pillar provides the training backbone for the full platform. It uses auxiliary modalities during development or labeling to improve the Wi-Fi student model, especially when Wi-Fi alone is not enough to obtain clean supervision.

#### Purpose

Strengthen Wi-Fi sensing by combining CSI and RSSI with stronger sensing modalities such as:

- Camera
- Radar
- LiDAR
- IMU
- Bluetooth
- ZigBee
- Depth sensors

#### Key methodologies

- Input fusion
- Feature fusion
- Cross-modal knowledge distillation
- Vision-based label generation
- Feature alignment using CLIP-style contrastive learning
- Hybrid fusion and distillation

#### Signal model

- CSI representation: `H = |H|e^(j angle H)`
- Received signal model: `Y = HX + N`

#### Important insight

CSI is decomposed into static and dynamic components so that human motion can be isolated while suppressing the static environment.

#### Main architecture patterns

##### 1. Input Fusion

`Sensor acquisition -> preprocessing -> concatenate modalities -> shared encoder (ViT or GNN) -> cross-modal attention -> task head`

##### 2. Feature Fusion

`Wi-Fi encoder + auxiliary encoders -> feature extraction -> attention / transformer / concatenation -> fusion layer -> prediction`

##### 3. Knowledge Distillation

`Teacher model from vision or radar -> soft targets -> student Wi-Fi model -> soft loss + hard loss`

##### 4. Vision-Based Label Generation

`Synchronized camera + Wi-Fi collection -> YOLO / OpenPose / Mask R-CNN -> automatic labels -> CSI supervision`

##### 5. Feature Alignment

`Wi-Fi embeddings + auxiliary embeddings -> shared latent space -> contrastive alignment`

#### Representative architectures

- SCL: graph neural network with cross-modal attention
- MaskFi: vision transformer with masked pre-training
- HDANet: dual-attention fusion for crowd counting
- ViFi-ReID: CLIP-assisted person re-identification
- X-Fi: cross-modal transformer foundation model with missing-modality robustness
- Babel: prototype alignment with expandable modalities
- WiFitness / WiMix / Wivi-Uf: Wi-Fi plus vision HAR using attention-based fusion

#### Mathematical components

- `Y = HX + N`
- `H = |H|e^(j angle H)`
- Cross-attention: `softmax(QK^T / sqrt(dk)) V`
- Knowledge distillation losses:
  - Cross-entropy soft loss
  - Embedding MSE loss
- CLIP-style contrastive alignment objective

#### Strengths

- Improves robustness under missing or noisy modalities
- Supports automatic label generation
- Improves cross-domain generalization
- Useful for multi-person scenes where raw Wi-Fi alone is ambiguous

#### Limitations

- Requires heterogeneous data synchronization
- Depends on external sensors during training if label generation is used
- Harder to standardize across hardware setups

#### SilentSense adaptation

Use camera or radar only as teacher and label generator during development, while deploying the Wi-Fi student stack on commodity hardware in production.

---

### Pillar 2: RSSI Presence and People Counting

**Source file:** `RSSI_Presence_Counting_Architecture_Methodology.docx`

This pillar acts as the occupancy gate. Before identity-sensitive CSI models run, the system first estimates whether the room is occupied and how many people are present.

#### Purpose

Build device-free occupancy sensing using only RSSI from commodity Wi-Fi for:

- Binary presence detection
- People counting

#### Hardware setup

- 2.4 GHz Wi-Fi transmitter
- Multiple RSSI detectors
- 3-detector setup for presence detection
- 9-detector setup for counting

#### Room geometry

- Larger experiment used a `4 x 4.5 m` room

#### Presence configurations

- `M1`: source inside the room
- `M2`: source outside the room

#### Main methodology

- Continuous RSSI acquisition
- Split into 20-second windows
- Extract statistical descriptors
- Presence branch:
  - Standard deviation analysis
  - Threshold decision
  - Isolation Forest anomaly detection
- Counting branch:
  - tsfresh time-series features
  - KNN
  - Decision Tree
  - Random Forest

#### Experimental methodology

Presence detection:

- 3 detectors
- 20-minute recordings
- Noise baseline plus 1 to 5 people
- Random walking and stationary behavior
- Repeated on a second day

People counting:

- 9 detectors
- 20-minute recordings
- 1, 3, 5, 7, and 9 people
- 10 minutes stationary + 10 minutes moving
- Noise recording as reference

#### Key observations

- RSSI standard deviation increases significantly when people are present
- Mean RSSI is not reliable because reflections and absorption can increase or decrease strength
- More people do not always mean linearly separable mean RSSI

#### Proposed presence methods

1. Threshold detector-wise standard deviation
2. Product of detector standard deviations
3. Product of correlated detector signals
4. Isolation Forest trained only on noise

#### Results

- Presence detection achieved nearly 100 percent accuracy when source and detectors were inside the room
- Performance dropped when the source was outside the room
- Random Forest achieved about 99 percent average accuracy for counting
- Four detectors already gave about 98 percent accuracy
- Five detectors gave about 99 percent accuracy
- Diminishing returns appeared beyond five detectors

#### Strengths

- Commodity hardware
- No wearables
- Simple signal processing
- Excellent occupancy accuracy

#### Limitations

- Sensitive to sensor placement
- Daily calibration recommended
- Lower performance when transmitter is outside the monitored room
- More complex spaces may need more detectors

#### SilentSense adaptation

Use RSSI as the first gate in the master stack:

- occupancy detection
- crowd size estimate
- sensor health check
- pre-filter before identity-sensitive CSI models are activated

---

### Pillar 3: VitalCSI Respiratory Sensing

**Source file:** `VitalCSI_Detailed_Architecture_and_Methodology.docx`

This pillar provides the physiological identity anchor. Respiration is one of the strongest passive signals for identifying and tracking a target person across time.

#### Purpose

Estimate respiratory rate contactlessly using commodity Wi-Fi CSI and fuse multiple estimates through signal-quality-aware filtering.

#### Hardware layer

- ASUS AC86U router
- Raspberry Pi receiver with Nexmon CSI
- Raspi-TX and Raspi-RX exchange ping traffic
- Subject positioned between access point and receiver

#### Available CSI

- 256 OFDM subcarriers
- 80 MHz bandwidth

#### Sampling characteristics

- Approximately 50 packets per second
- 30-second windows
- 1-second overlap

#### Methodology pipeline

`CSI capture -> sliding window -> PCA -> CQI -> filtering -> FFT RR estimation + breath counting -> SQI -> multidimensional Kalman fusion`

#### Step-by-step methodology

1. Capture CSI magnitude from every received packet.
2. Use magnitude only because commodity phase measurements are noisy.
3. Apply PCA to convert 256 correlated subcarriers into orthogonal principal components.
4. Score components with the Component Quality Index.
5. Retain the five highest-CQI components.
6. Apply high-pass and low-pass IIR filters to keep breathing frequencies.
7. Estimate respiratory rate using:
   - FFT spectral peak detection
   - Breath counting with Box Slope Sum Function
8. Compute Signal Quality Index for confidence.
9. Fuse all respiratory-rate estimates using a multidimensional Kalman filter.

#### Component Quality Index

CQI combines:

- Variance index
- Signal-to-noise ratio
- Spectral peak index

This selects components that are most informative for breathing.

#### Mathematical foundation

- Wireless propagation model: `Y = Hx + n`
- CSI encodes amplitude and phase changes caused by respiration

#### Experimental methodology

- 15 healthy volunteers
- Controlled indoor room
- Subject about 1 m from Wi-Fi devices
- 20-minute recordings
- Guided breathing from 6 to 33 breaths/min
- Increment: 3 breaths/min every 2 minutes
- Ground truth from nasal airflow pressure sensor and pulse oximeter

#### Results

- Respiratory range: 6 to 33 breaths per minute
- Mean absolute error: about 1.20 breaths per minute
- R²: about 0.93

#### Strengths

- Commodity hardware
- No wearables
- Adaptive PCA selection
- Multiple complementary respiratory estimators
- Kalman fusion improves robustness

#### Limitations

- Focused more on respiratory monitoring than identity recognition alone
- Commodity phase noise limits some CSI features

#### SilentSense adaptation

Use respiration as a stable physiological identity anchor inside the multi-person attribution stack so the target person can still be recognized when spatial overlap is high.

---

### Pillar 4: WiEat Fine-Grained Eating Monitoring

**Source file:** `WiEat_Architecture_and_Methodology.docx`

This pillar supplies fine-grained behavioral context. Eating behavior is highly valuable because it creates patterned micro-motions that can help distinguish a target person in shared spaces.

#### Purpose

Detect eating, classify utensil type, and infer chew and swallow behavior using Wi-Fi CSI without deep learning.

#### Data collection

- CSI amplitude and phase from 30 OFDM subcarriers

#### Preprocessing

- Calibration
- Outlier removal with IQR
- Band-pass filtering
- Remove ambient RF noise and multipath interference

#### Activity segmentation

- Spectrogram generation
- CPSD: Cumulative Power Spectral Density
- CSTE: Cumulative Short Time Energy
- Boundary detection for activity segmentation

#### Eating detection

- PCA for dimensionality reduction
- K-Means clustering into eating and non-eating

#### Motion classification

- Extract 14 handcrafted time/frequency-domain features from each subcarrier
- Train Linear SVM to classify:
  - Fork
  - Spoon
  - Knife+Fork
  - Hand

#### Soft decision

- Fuse weighted probabilities from every subcarrier
- Give higher weight to more stable subcarriers
- Avoid majority voting

#### Minute motion reconstruction

- Use 250 ms sliding windows
- Select stable subcarriers
- Reconstruct a representative CSI signal
- Amplify chewing and swallowing motion

#### Chewing detection

- Compute FFT and APSD
- Detect dominant peak in the 0.8 to 3 Hz band
- Estimate chewing frequency

#### Swallow detection

- Use amplitude thresholds
- Use peak-to-valley duration thresholds

#### Final outputs

- Eating vs non-eating
- Utensil identification
- Chew count
- Swallow count
- Dietary behavior inference

#### Strengths

- No deep learning required
- Interpretable pipeline
- Robust to noise
- Suitable for subtle behavioral monitoring

#### Limitations

- Behavior-specific, not a general identity signal by itself
- Sensitive to signal quality and activity segmentation

#### SilentSense adaptation

Use eating patterns as a contextual cue for target attribution, meal regularity, and behavior drift inside the broader health monitoring stack.

## 5. Master Architecture

### Name

**Four-Pillar Unified Target-Attribution Pipeline**

### Description

The master architecture does not try to solve multi-person sensing with one model. It uses four cooperating layers that progressively reduce uncertainty:

1. Occupancy
2. Physiological identity
3. Behavioral context
4. Multi-modal training support

### High-level flow

1. Pillar 1 trains and aligns the representation space using auxiliary modalities and distillation.
2. Pillar 2 estimates room occupancy and crowd size.
3. Pillar 3 anchors the target with respiration and other stable physiological signatures.
4. Pillar 4 captures fine-grained eating and motion context when the target is active near meals.
5. A confidence fusion layer merges all evidence into one target-person attribution score.
6. Task heads emit respiration, fall risk, mobility drift, sleep state, eating activity, occupancy, and alert outputs.

### Core design principles

- Do not depend on a single sensor modality for identity.
- Use cheap detectors for coarse gating and richer features for refinement.
- Keep deployment passive and wearable-free.
- Use teacher models and synchronized auxiliary sensors during development only when they improve label quality.
- Prefer interpretable signal-processing blocks where possible, then add learned fusion where necessary.

### Master modules

#### Occupancy Gate

- Source pillar: P2
- Purpose: detect whether the space is empty, occupied, or crowded before identity-level inference
- Inputs:
  - RSSI streams
  - windowed statistics
  - detector geometry
- Outputs:
  - presence score
  - people count estimate
  - sensor reliability flag

#### Physiology Anchor

- Source pillar: P3
- Purpose: lock onto a person-specific biological rhythm that is stable enough to separate the target from surrounding movement
- Inputs:
  - CSI magnitude windows
  - PCA components
  - CQI and SQI
- Outputs:
  - respiration rate
  - confidence score
  - breathing quality score

#### Behavior Context Layer

- Source pillar: P4
- Purpose: recognize eating and chewing or swallowing behavior that provides context for target attribution and longitudinal health patterns
- Inputs:
  - CSI spectrograms
  - PCA clusters
  - handcrafted features
- Outputs:
  - eating state
  - utensil class
  - chew count
  - swallow count

#### Multi-Modal Training Backbone

- Source pillar: P1
- Purpose: improve robustness, alignment, and generalization through cross-modal pretraining, fusion, and teacher-student supervision
- Inputs:
  - Wi-Fi data
  - optional camera or radar teacher streams
  - automatic pseudo-labels
- Outputs:
  - aligned embedding space
  - student robustness gains
  - missing-modality tolerance

### Target attribution strategy

1. Use RSSI to determine whether one person, multiple people, or no one is present.
2. When occupancy is non-trivial, use CSI-based physiological anchoring to identify the most likely target person.
3. Use behavioral context such as eating, sleep, gait drift, or inactivity to refine target confidence.
4. Use cross-modal training and distillation to stabilize the model when ground truth labels are sparse.
5. Fuse all evidence into a Bayesian-like confidence score that drives alerts, dashboards, and downstream analytics.

### Confidence fusion inputs

- RSSI presence probability
- Estimated crowd size
- Respiration confidence
- Eating or activity context confidence
- Temporal continuity score
- Cross-modal agreement score
- Sensor health and calibration score

### Master outputs

- Target-person attribution score
- Room occupancy state
- Respiration estimate
- Eating state estimate
- Behavioral risk indicators
- Downstream alert triggers

## 6. Detailed Methodology Plan

### Phase 0: Define the objective

- Define the deployment setting.
- Define the sensor geometry.
- Define the exact person-of-interest attribution objective.

### Phase 1: Infrastructure and calibration

Goals:

- Place Wi-Fi transmitter, receivers, and optional teacher sensors.
- Calibrate RSSI stability and CSI capture quality.
- Define room dimensions, blind spots, and detector locations.
- Choose whether the AP is inside or outside the monitored room based on the use case.

Outputs:

- Hardware map
- Sensor calibration record
- Collection protocol

### Phase 2: Data acquisition

Goals:

- Collect synchronized RSSI, CSI, and optional teacher-modality data.
- Capture noise-only baselines.
- Record multiple occupancy levels and motion states.
- Capture respiration, eating, and other targeted behavior sessions.

Outputs:

- Raw multimodal dataset
- Time-synced streams
- Ground-truth annotations

### Phase 3: Signal conditioning

Goals:

- Apply windowing to RSSI and CSI.
- Remove outliers and transient packet errors.
- Filter for physiological or behavioral frequency bands.
- Standardize per-sensor amplitudes and align timestamps.

Outputs:

- Cleaned windows
- Normalized features
- Synchronized modality frames

### Phase 4: Pillar-specific modeling

Goals:

- Train RSSI presence and counting models.
- Train VitalCSI respiration extraction and fusion.
- Train WiEat eating and swallow models.
- Train multi-modal teacher-student or feature-fusion support models.

Outputs:

- Pillar models
- Task-specific metrics
- Feature banks

### Phase 5: Attribution fusion

Goals:

- Combine occupancy, physiology, and behavior confidence signals.
- Use cross-modal alignment to reduce ambiguous cases.
- Handle missing-modality situations gracefully.
- Produce a final person-specific confidence score.

Outputs:

- Fusion engine
- Confidence policy
- Decision thresholds

### Phase 6: Evaluation and stress testing

Goals:

- Measure accuracy, recall, precision, MAE, F1, and calibration.
- Test under multiple occupants, moving occupants, and noisy environments.
- Compare inside-room and outside-room transmitter placement.
- Evaluate sensor-count sensitivity and diminishing returns.

Outputs:

- Benchmark report
- Failure-mode analysis
- Robustness matrix

### Phase 7: Deployment and monitoring

Goals:

- Run low-cost RSSI gating continuously.
- Activate CSI analysis when occupancy warrants it.
- Persist confidence histories for temporal smoothing.
- Emit alerts into the SilentSense dashboard and digital twin pipeline.

Outputs:

- Live inference stack
- Dashboard events
- Audit trail

## 7. Combined Methodology by Problem

### Multi-person attribution

RSSI occupancy gating -> VitalCSI physiological anchoring -> WiEat context confirmation -> multi-modal refinement from Pillar 1

### Occupancy detection

RSSI standard deviation, detector product statistics, correlated detector behavior, and anomaly detection

### Respiration monitoring

CSI magnitude acquisition, PCA, CQI, filtering, FFT, BSSF breath counting, SQI, and Kalman fusion

### Eating monitoring

CSI preprocessing, CPSD/CSTE segmentation, PCA plus K-Means, SVM utensil classification, soft decision, APSD chewing, swallow thresholding

### Training acceleration

Use teacher sensors only for label generation and representation alignment; then deploy the Wi-Fi student model alone

## 8. Math and Signal Modeling

### Wireless model

`Y = HX + N`

### CSI representation

`H = |H|e^(j angle H)`

### Attention equation

`softmax(QK^T / sqrt(dk)) V`

### Occupancy rationale

Human bodies perturb Wi-Fi propagation through reflection, absorption, scattering, and shadowing, which appear strongly in RSSI variance and CSI dynamics.

### Respiration rationale

Periodic chest motion modulates the multipath profile in a quasi-periodic way that can be extracted from CSI magnitude sequences.

### Eating rationale

Chewing and swallowing create short rhythmic micro-motions that affect CSI amplitude and spectral energy in recognizable bands.

## 9. Deployment Blueprint

### Edge layer

ESP32, commodity router, or Raspberry Pi class receivers collect Wi-Fi data passively.

### Signal layer

Windowing, filtering, PCA, CQI, and RSSI statistics run as the first processing stage.

### Intelligence layer

Model heads perform presence detection, respiration estimation, eating classification, and fused target attribution.

### Orchestration layer

A confidence manager resolves contradictions and emits a single target-person belief state.

### Application layer

Dashboards, alerts, sleep monitoring, fall detection, gait analysis, eating analytics, and digital twin reasoning.

## 10. Risks and Mitigations

### Sensor placement sensitivity

Mitigation: use calibration routines, redundant detectors, and confidence weighting.

### Multi-person ambiguity

Mitigation: rely on layered evidence instead of one classifier and maintain a temporal belief state.

### Missing modalities during deployment

Mitigation: train with distillation and alignment so the Wi-Fi student survives when teachers are absent.

### Room-to-room domain shift

Mitigation: use cross-domain adaptation, alignment losses, and per-room calibration.

### Noisy phase or unstable CSI

Mitigation: prefer magnitude when needed, use PCA, and fuse several complementary estimators.

## 11. Implementation Notes

### Recommended development order

1. Build RSSI occupancy first.
2. Add respiration extraction next.
3. Add eating and activity context after the core physiological layer is stable.
4. Introduce multi-modal teacher supervision only if additional training data is available.
5. Finish with confidence fusion and dashboard integration.

### Priority for SilentSense

The main product advantage is not raw detection alone. It is the ability to keep tracking the right person when the environment becomes crowded, messy, or ambiguous.

### Runtime policy

Default to passive, privacy-preserving inference. Only use auxiliary modalities for training, calibration, or label generation when necessary.

## 12. Paper Summaries

### Multi-Modal Wi-Fi Sensing

Defines the broader multi-modal design space: fusion, distillation, automatic label generation, and shared latent alignment.

### RSSI Presence and People Counting

Defines the occupancy layer through RSSI windowing, detector statistics, anomaly detection, and supervised counting.

### VitalCSI

Defines the respiration and physiological anchoring layer through CSI, PCA, CQI, FFT, breath counting, and Kalman fusion.

### WiEat

Defines the fine-grained eating behavior layer through CSI preprocessing, segmentation, utensil classification, chewing, and swallowing analysis.

## 13. Closing Summary

The four-pillar architecture turns SilentSense into a layered attribution system rather than a single-sensor detector.

That matters because multi-person environments are not solved by one clever model. They are solved by combining:

- coarse occupancy sensing,
- physiological anchoring,
- fine-grained behavior context,
- and multi-modal training support.

Together, these four pillars create a practical pathway for reliable target-person sensing in real homes and care settings.

