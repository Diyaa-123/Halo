export const MASTER_FOUR_PILLAR_ARCHITECTURE = {
  projectName: 'SilentSense',
  architectureName: 'Four-Pillar Multi-Person Sensing Master Architecture',
  intent:
    'A unified passive Wi-Fi sensing framework that solves the multi-person attribution problem by combining four complementary pillars: multi-modal Wi-Fi sensing, RSSI presence and people counting, VitalCSI respiration sensing, and WiEat fine-grained eating monitoring.',
  coreThesis:
    'When all systems fail to directly track a specific person in a crowded environment, the correct strategy is not to force one brittle classifier, but to build a layered attribution stack that fuses occupancy, identity confidence, physiology, and behavior context into one robust inference engine.',
  usp:
    'Target-person sensing in multi-occupant environments without wearables, cameras, or intrusive user action.',

  sourcePillars: [
    {
      pillarId: 'P1',
      name: 'Multi-Modal Wi-Fi Sensing',
      sourceFile: 'MultiModal_WiFi_Sensing_Architecture_Methodology.docx',
      roleInMasterSystem:
        'Provides the fusion, alignment, distillation, and cross-modal training backbone for the entire platform.',
      primaryPurpose:
        'Strengthen Wi-Fi sensing by combining CSI and RSSI with auxiliary modalities such as camera, radar, LiDAR, IMU, Bluetooth, ZigBee, or depth sensors during training, label generation, and representation learning.',
      keyMethodologies: [
        'Input fusion',
        'Feature fusion',
        'Cross-modal knowledge distillation',
        'Vision-based label generation',
        'Feature alignment with CLIP-style contrastive learning',
        'Hybrid fusion plus distillation pipelines',
      ],
      importantDetails: {
        csiModel: 'H = |H|e^(j angle H)',
        receivedSignalModel: 'Y = HX + N',
        staticDynamicSeparation:
          'CSI is decomposed into static and dynamic components so that human motion can be isolated while suppressing the static environment.',
        sharedEncoders:
          'Modality-specific encoders can be used for Wi-Fi, vision, radar, or other sensors before cross-modal attention or concatenation.',
      },
      architecturePatterns: [
        {
          name: 'Input Fusion',
          pipeline:
            'Sensor acquisition -> preprocessing -> concatenate modalities -> shared encoder (ViT or GNN) -> cross-modal attention -> task head',
        },
        {
          name: 'Feature Fusion',
          pipeline:
            'Wi-Fi encoder and auxiliary encoders operate independently -> feature extraction -> attention / transformer / concatenation -> fusion layer -> prediction',
        },
        {
          name: 'Knowledge Distillation',
          pipeline:
            'Teacher model from vision or radar -> soft targets -> student Wi-Fi model -> soft loss + hard loss',
        },
        {
          name: 'Vision-Based Label Generation',
          pipeline:
            'Synchronized camera and Wi-Fi collection -> YOLO / OpenPose / Mask R-CNN -> automatic labels -> CSI supervision',
        },
        {
          name: 'Feature Alignment',
          pipeline:
            'Wi-Fi embeddings and auxiliary embeddings are mapped into one shared latent space using contrastive learning and alignment losses',
        },
      ],
      representativeArchitectures: [
        'SCL: graph neural network with cross-modal attention',
        'MaskFi: vision transformer with masked pre-training',
        'HDANet: dual-attention fusion for crowd counting',
        'ViFi-ReID: CLIP-assisted person re-identification',
        'X-Fi: cross-modal transformer foundation model with missing-modality robustness',
        'Babel: prototype alignment with expandable modalities',
        'WiFitness / WiMix / Wivi-Uf: Wi-Fi plus vision HAR using attention-based fusion',
      ],
      mathComponents: [
        'Y = HX + N',
        'H = |H|e^(j angle H)',
        'Cross-attention = softmax(QK^T / sqrt(dk)) V',
        'Knowledge distillation losses include cross-entropy soft loss and embedding MSE loss',
        'CLIP-style contrastive alignment objective',
      ],
      strengths: [
        'Improves robustness under missing or noisy modalities',
        'Supports automatic label generation',
        'Improves cross-domain generalization',
        'Useful for multi-person scenes where raw Wi-Fi alone is ambiguous',
      ],
      limitations: [
        'Requires heterogeneous data synchronization',
        'Depends on external sensors during training if label generation is used',
        'Can be hardware diverse and therefore harder to standardize',
      ],
      adaptationToSilentSense:
        'Use camera or radar only as teacher and label generator during development, while deploying the student Wi-Fi stack on commodity hardware in production.',
    },
    {
      pillarId: 'P2',
      name: 'RSSI Presence and People Counting',
      sourceFile: 'RSSI_Presence_Counting_Architecture_Methodology.docx',
      roleInMasterSystem:
        'Acts as the low-cost occupancy and crowd-size gate that tells the system whether the room is occupied and how many people are likely present before higher-level attribution is attempted.',
      primaryPurpose:
        'Build practical device-free occupancy sensing using only RSSI from commodity Wi-Fi for binary presence detection and people counting.',
      keyMethodologies: [
        '20-second RSSI windowing',
        'Standard deviation based presence detection',
        'Product-based detector aggregation',
        'Correlated detector product analysis',
        'Isolation Forest anomaly detection',
        'tsfresh time-series feature extraction',
        'KNN, Decision Tree, and Random Forest classification',
      ],
      importantDetails: {
        hardware:
          '2.4 GHz Wi-Fi transmitter with multiple RSSI detectors, including 3-detector presence setups and 9-detector counting setups.',
        presenceConfigurations: [
          'M1: source inside the room',
          'M2: source outside the room',
        ],
        roomScale: '4 x 4.5 m room for the larger multi-detector experiment',
      },
      architecturePatterns: [
        {
          name: 'Presence Branch',
          pipeline:
            'Wi-Fi source -> RSSI detectors -> continuous acquisition -> 20-second windows -> feature extraction -> standard deviation analysis -> threshold decision or Isolation Forest',
        },
        {
          name: 'Counting Branch',
          pipeline:
            'RSSI windows -> tsfresh time-series features -> supervised classifier -> person count',
        },
      ],
      experimentalMethodology: [
        'Presence detection used 3 detectors with 20-minute recordings covering noise and 1 to 5 people.',
        'Experiments included both random walking and stationary behavior.',
        'The presence experiments were repeated on a second day.',
        'People counting used 9 detectors with 20-minute recordings for 1, 3, 5, 7, and 9 people.',
        'Each counting recording included 10 minutes stationary and 10 minutes moving.',
        'A noise recording was collected as reference.',
      ],
      keyObservations: [
        'RSSI standard deviation increases significantly when people are present.',
        'Mean RSSI is not a reliable indicator because reflections and absorption can either increase or decrease signal strength.',
        'Four methods were proposed for occupancy inference, with Isolation Forest giving a semi-supervised anomaly detection path.',
      ],
      results: [
        'Presence detection achieved nearly 100 percent accuracy when source and detectors were inside the room.',
        'Performance drops when the transmitter is outside the room.',
        'Random Forest achieved about 99 percent average accuracy for counting.',
        'Four detectors already gave about 98 percent accuracy; five detectors gave about 99 percent, showing diminishing returns beyond five sensors.',
      ],
      strengths: [
        'Commodity hardware',
        'No wearables',
        'Simple signal processing',
        'Excellent occupancy accuracy',
      ],
      limitations: [
        'Sensitive to sensor placement',
        'Daily calibration recommended',
        'Weaker performance when the transmitter is outside the monitored room',
        'More complex environments may need more detectors',
      ],
      adaptationToSilentSense:
        'Use RSSI as the first gate in the master stack: occupancy detection, crowd size estimate, sensor health check, and a pre-filter before identity-sensitive CSI models are activated.',
    },
    {
      pillarId: 'P3',
      name: 'VitalCSI Respiratory Sensing',
      sourceFile: 'VitalCSI_Detailed_Architecture_and_Methodology.docx',
      roleInMasterSystem:
        'Provides the physiological identity anchor by extracting respiration patterns that are difficult to spoof and highly useful for target-person attribution.',
      primaryPurpose:
        'Estimate respiratory rate contactlessly using commodity Wi-Fi CSI and fuse multiple estimates through signal quality aware filtering.',
      keyMethodologies: [
        'CSI magnitude acquisition',
        '30-second windows with 1-second overlap',
        'PCA reduction',
        'Component Quality Index',
        'High-pass and low-pass IIR filtering',
        'FFT respiratory rate estimation',
        'Breath counting with Box Slope Sum Function',
        'Signal Quality Index',
        'Multidimensional Kalman filter fusion',
      ],
      importantDetails: {
        hardware:
          'ASUS AC86U router, Raspberry Pi receiver with Nexmon CSI, Raspi-TX and Raspi-RX ping traffic generation, subject positioned between access point and receiver',
        samplingRate: 'Approximately 50 packets per second',
        availableSubcarriers: '256 OFDM subcarriers at 80 MHz bandwidth',
        workingRange: '6 to 33 breaths per minute',
      },
      architecturePatterns: [
        {
          name: 'Acquisition Pipeline',
          pipeline:
            'Wi-Fi AP and receiver -> CSI capture in monitor mode -> sliding window -> PCA -> CQI -> filtering -> FFT and breath counting -> SQI -> Kalman fusion',
        },
      ],
      methodologySteps: [
        'Capture CSI magnitude from every received packet.',
        'Use only magnitude because commodity phase measurements are noisy.',
        'Convert 256 correlated subcarriers into orthogonal principal components with PCA.',
        'Score every component with CQI using variance, spectral SNR, and spectral peak behavior.',
        'Retain the five highest CQI components.',
        'Apply high-pass and low-pass IIR filters to keep breathing frequencies around 5 to 35 breaths per minute.',
        'Estimate respiratory rate using both FFT spectral peaks and breath counting via BSSF.',
        'Compute SQI to estimate confidence for every component.',
        'Fuse all RR estimates using a multidimensional Kalman filter to produce one robust rate each second.',
      ],
      cqiFormulaDescription:
        'CQI is defined as a combination of variance, signal-to-noise ratio, and spectral peak quality.',
      wirelessPropagationModel: 'Y = Hx + n',
      experimentalMethodology: [
        '15 healthy volunteers participated.',
        'Experiments were run indoors at about 1 m from the Wi-Fi devices.',
        'Each recording lasted 20 minutes.',
        'Guided breathing ranged from 6 to 33 breaths per minute in 3-breath-per-minute increments every 2 minutes.',
        'Ground truth used a nasal airflow pressure sensor and pulse oximeter.',
      ],
      results: [
        'Mean absolute error was about 1.20 breaths per minute.',
        'R2 was about 0.93.',
        'The system showed strong agreement with the airflow reference.',
      ],
      strengths: [
        'Commodity hardware',
        'No wearables',
        'Adaptive PCA selection',
        'Multiple complementary respiratory estimators',
        'Kalman fusion improves robustness',
      ],
      limitations: [
        'More focused on respiratory monitoring than identity recognition by itself',
        'Commodity phase noise limits some CSI features',
      ],
      adaptationToSilentSense:
        'Use respiration as a stable physiological identity anchor inside the multi-person attribution stack so the target person can be recognized even when spatial overlap is high.',
    },
    {
      pillarId: 'P4',
      name: 'WiEat Fine-Grained Eating Monitoring',
      sourceFile: 'WiEat_Architecture_and_Methodology.docx',
      roleInMasterSystem:
        'Provides the fine-grained behavioral context layer, which is particularly useful when more than one person is present and the target individual must be inferred from eating micro-motions.',
      primaryPurpose:
        'Detect eating, classify utensil type, and infer chew and swallow behavior using Wi-Fi CSI without deep learning.',
      keyMethodologies: [
        'CSI amplitude and phase collection',
        'Calibration',
        'Outlier removal with IQR',
        'Band-pass filtering',
        'Spectrogram-based activity segmentation',
        'CPSD and CSTE boundary detection',
        'PCA plus K-Means activity separation',
        'Handcrafted time-frequency feature extraction',
        'Linear SVM utensil classification',
        'Probability-based soft decision fusion',
        'Minute motion reconstruction',
        'APSD-based chewing detection',
        'Threshold-based swallow detection',
      ],
      importantDetails: {
        subcarriers: '30 OFDM subcarriers',
        reconstructionWindow: '250 ms sliding window',
        chewingBand: '0.8 to 3 Hz',
      },
      architecturePatterns: [
        {
          name: 'Eating Monitoring Pipeline',
          pipeline:
            'CSI collection -> preprocessing -> spectrogram activity segmentation -> PCA and K-Means -> feature extraction -> SVM classification -> soft decision -> motion reconstruction -> chewing and swallowing detection',
        },
      ],
      methodologyDetails: [
        'Collect CSI amplitude and phase from 30 subcarriers.',
        'Remove outliers using IQR.',
        'Apply band-pass filtering to reduce ambient RF noise and multipath interference.',
        'Generate spectrograms and compute CPSD and CSTE to detect activity boundaries.',
        'Reduce dimensions using PCA and cluster eating versus non-eating using K-Means.',
        'Extract 14 handcrafted features from each subcarrier in the time and frequency domains.',
        'Train a linear SVM to classify Fork, Spoon, Knife plus Fork, or Hand.',
        'Fuse weighted probabilities from each subcarrier instead of majority voting, giving higher weight to more stable subcarriers.',
        'Use a 250 ms sliding window and stable subcarriers to reconstruct a representative CSI signal.',
        'Detect chewing using FFT and APSD, with the dominant peak in the 0.8 to 3 Hz range estimating chewing frequency.',
        'Detect swallowing using amplitude and peak-to-valley duration thresholds.',
      ],
      outputs: [
        'Eating versus non-eating detection',
        'Utensil identification',
        'Chew count',
        'Swallow count',
        'Dietary behavior inference',
      ],
      strengths: [
        'No deep learning required',
        'Interpretable pipeline',
        'Robust to noise',
        'Useful for subtle behavioral monitoring',
      ],
      limitations: [
        'Behavior-specific and not a general identity signal by itself',
        'Sensitive to signal quality and activity segmentation',
      ],
      adaptationToSilentSense:
        'Use eating patterns as another contextual cue for target attribution, meal regularity, and behavior drift inside the broader health monitoring stack.',
    },
  ],

  masterArchitecture: {
    name: 'Four-Pillar Unified Target-Attribution Pipeline',
    description:
      'The master architecture does not try to solve multi-person sensing with one model. It uses four cooperating layers that progressively narrow uncertainty: occupancy, physiological identity, behavioral context, and multi-modal training support.',
    highLevelFlow: [
      'Pillar 1 trains and aligns the representation space using auxiliary modalities and distillation.',
      'Pillar 2 estimates room occupancy and crowd size.',
      'Pillar 3 anchors the target with respiration and other stable physiological signatures.',
      'Pillar 4 captures fine-grained eating and motion context when the target is active near meals.',
      'A confidence fusion layer merges all evidence into one target-person attribution score.',
      'Task heads then emit respiration, fall risk, mobility drift, sleep state, eating activity, occupancy, and alert outputs.',
    ],
    coreDesignPrinciples: [
      'Do not depend on a single sensor modality for identity.',
      'Use cheap detectors for coarse gating and rich features for refinement.',
      'Keep the deployment stack passive and wearable-free.',
      'Use teacher models and synchronized auxiliary sensors during development only when they improve label quality.',
      'Prefer interpretable signal-processing blocks where possible, then add learned fusion where necessary.',
    ],
    masterModules: [
      {
        module: 'Occupancy Gate',
        sourcePillar: 'P2',
        purpose:
          'Detect whether the space is empty, occupied, or crowded before attempting identity-level inference.',
        inputs: ['RSSI streams', 'windowed statistics', 'detector geometry'],
        outputs: ['presence score', 'people count estimate', 'sensor reliability flag'],
      },
      {
        module: 'Physiology Anchor',
        sourcePillar: 'P3',
        purpose:
          'Lock onto a person-specific biological rhythm that is stable enough to separate the target from surrounding movement.',
        inputs: ['CSI magnitude windows', 'PCA components', 'CQI and SQI'],
        outputs: ['respiration rate', 'confidence score', 'breathing quality score'],
      },
      {
        module: 'Behavior Context Layer',
        sourcePillar: 'P4',
        purpose:
          'Recognize eating and chewing or swallowing behavior that provides context for target attribution and longitudinal health patterns.',
        inputs: ['CSI spectrograms', 'PCA clusters', 'handcrafted features'],
        outputs: ['eating state', 'utensil class', 'chew count', 'swallow count'],
      },
      {
        module: 'Multi-Modal Training Backbone',
        sourcePillar: 'P1',
        purpose:
          'Improve robustness, alignment, and generalization through cross-modal pretraining, fusion, and teacher-student supervision.',
        inputs: ['Wi-Fi data', 'optional camera or radar teacher streams', 'automatic pseudo-labels'],
        outputs: ['aligned embedding space', 'student robustness gains', 'missing-modality tolerance'],
      },
    ],
    targetAttributionStrategy: {
      step1:
        'Use RSSI to determine whether one person, multiple people, or no one is present.',
      step2:
        'When occupancy is non-trivial, use CSI-based physiological anchoring to identify the most likely target person.',
      step3:
        'Use behavioral context such as eating, sleep, gait drift, or inactivity to refine target confidence.',
      step4:
        'Use cross-modal training and distillation to stabilize the model when ground truth labels are sparse.',
      step5:
        'Fuse all evidence into a Bayesian-like confidence score that can drive alerts, dashboards, and downstream analytics.',
    },
    confidenceFusionInputs: [
      'RSSI presence probability',
      'Estimated crowd size',
      'Respiration confidence',
      'Eating or activity context confidence',
      'Temporal continuity score',
      'Cross-modal agreement score',
      'Sensor health and calibration score',
    ],
    outputs: [
      'Target-person attribution score',
      'Room occupancy state',
      'Respiration estimate',
      'Eating state estimate',
      'Behavioral risk indicators',
      'Downstream alert triggers',
    ],
  },

  detailedMethodologyPlan: {
    phase0:
      'Define target deployment setting, sensor geometry, and the exact person-of-interest attribution objective.',
    phase1: {
      title: 'Infrastructure and Calibration',
      goals: [
        'Place Wi-Fi transmitter, receivers, and optional teacher sensors.',
        'Calibrate RSSI stability and CSI capture quality.',
        'Define room dimensions, blind spots, and detector locations.',
        'Choose whether the AP is inside or outside the monitored room based on the use case.',
      ],
      outputs: ['hardware map', 'sensor calibration record', 'collection protocol'],
    },
    phase2: {
      title: 'Data Acquisition',
      goals: [
        'Collect synchronized RSSI, CSI, and optional teacher modality data.',
        'Capture noise-only baselines.',
        'Record multiple occupancy levels and motion states.',
        'Capture respiration, eating, and other targeted behavior sessions.',
      ],
      outputs: ['raw multimodal dataset', 'time-synced streams', 'ground-truth annotations'],
    },
    phase3: {
      title: 'Signal Conditioning',
      goals: [
        'Apply windowing to RSSI and CSI.',
        'Remove outliers and transient packet errors.',
        'Filter for physiological or behavioral frequency bands.',
        'Standardize per-sensor amplitudes and align timestamps.',
      ],
      outputs: ['cleaned windows', 'normalized features', 'synchronized modality frames'],
    },
    phase4: {
      title: 'Pillar-Specific Modeling',
      goals: [
        'Train RSSI presence and counting models.',
        'Train VitalCSI respiration extraction and fusion.',
        'Train WiEat eating and swallow models.',
        'Train multi-modal teacher-student or feature-fusion support models.',
      ],
      outputs: ['pillar models', 'task-specific metrics', 'feature banks'],
    },
    phase5: {
      title: 'Attribution Fusion',
      goals: [
        'Combine occupancy, physiology, and behavior confidence signals.',
        'Use cross-modal alignment to reduce ambiguous cases.',
        'Handle missing-modality situations gracefully.',
        'Produce a final person-specific confidence score.',
      ],
      outputs: ['fusion engine', 'confidence policy', 'decision thresholds'],
    },
    phase6: {
      title: 'Evaluation and Stress Testing',
      goals: [
        'Measure accuracy, recall, precision, MAE, F1, and calibration.',
        'Test under multiple occupants, moving occupants, and noisy environments.',
        'Compare inside-room and outside-room transmitter placement.',
        'Evaluate sensor-count sensitivity and diminishing returns.',
      ],
      outputs: ['benchmark report', 'failure-mode analysis', 'robustness matrix'],
    },
    phase7: {
      title: 'Deployment and Monitoring',
      goals: [
        'Run low-cost RSSI gating continuously.',
        'Activate CSI analysis when occupancy warrants it.',
        'Persist confidence histories for temporal smoothing.',
        'Emit alerts into the SilentSense dashboard and digital twin pipeline.',
      ],
      outputs: ['live inference stack', 'dashboard events', 'audit trail'],
    },
  },

  combinedMethodologyByProblem: {
    multiPersonAttribution:
      'Occupancy gating from RSSI -> physiological anchoring from VitalCSI -> context confirmation from WiEat -> multi-modal refinement from Pillar 1.',
    occupancyDetection:
      'RSSI standard deviation, detector product statistics, correlated detector behavior, and anomaly detection.',
    respirationMonitoring:
      'CSI magnitude acquisition, PCA, CQI, filtering, FFT, BSSF breath counting, SQI, and Kalman fusion.',
    eatingMonitoring:
      'CSI preprocessing, CPSD/CSTE segmentation, PCA plus K-Means, SVM utensil classification, soft decision, APSD chewing, swallow thresholding.',
    trainingAcceleration:
      'Use teacher sensors only for label generation and representation alignment; then deploy the Wi-Fi student model alone.',
  },

  mathAndSignalModeling: {
    wirelessModel: 'Y = HX + N',
    csiRepresentation: 'H = |H|e^(j angle H)',
    attentionEquation: 'softmax(QK^T / sqrt(dk)) V',
    occupancyRationale:
      'Human bodies perturb Wi-Fi propagation through reflection, absorption, scattering, and shadowing, which appear strongly in RSSI variance and CSI dynamics.',
    respirationRationale:
      'Periodic chest motion modulates the multipath profile in a quasi-periodic way that can be extracted from CSI magnitude sequences.',
    eatingRationale:
      'Chewing and swallowing create short, rhythmic micro-motions that affect CSI amplitude and spectral energy in recognizable bands.',
  },

  deploymentBlueprint: {
    edgeLayer:
      'ESP32, commodity router, or Raspberry Pi class receivers collect Wi-Fi data passively.',
    signalLayer:
      'Windowing, filtering, PCA, CQI, and RSSI statistics run as the first processing stage.',
    intelligenceLayer:
      'Model heads perform presence detection, respiration estimation, eating classification, and fused target attribution.',
    orchestrationLayer:
      'A confidence manager resolves contradictions and emits a single target-person belief state.',
    applicationLayer:
      'Dashboards, alerts, sleep monitoring, fall detection, gait analysis, eating analytics, and digital twin reasoning.',
  },

  risksAndMitigations: [
    {
      risk: 'Sensor placement sensitivity',
      mitigation: 'Use calibration routines, redundant detectors, and confidence weighting.',
    },
    {
      risk: 'Multi-person ambiguity',
      mitigation: 'Rely on layered evidence instead of one classifier and keep a temporal belief state.',
    },
    {
      risk: 'Missing modalities during deployment',
      mitigation: 'Train with distillation and alignment so the Wi-Fi student can survive when teachers are absent.',
    },
    {
      risk: 'Room-to-room domain shift',
      mitigation: 'Use cross-domain adaptation, alignment losses, and per-room calibration.',
    },
    {
      risk: 'Noisy phase or unstable CSI',
      mitigation: 'Prefer magnitude when needed, use PCA, and fuse several complementary estimators.',
    },
  ],

  implementationNotes: {
    recommendedDevelopmentOrder: [
      'Build RSSI occupancy first.',
      'Add respiration extraction next.',
      'Add eating and activity context after the core physiological layer is stable.',
      'Introduce multi-modal teacher supervision only if additional training data is available.',
      'Finish with confidence fusion and dashboard integration.',
    ],
    priorityForSilentSense:
      'The main product advantage is not raw detection alone. It is the ability to keep tracking the right person when the environment becomes crowded, messy, or ambiguous.',
    runtimePolicy:
      'Default to passive, privacy-preserving inference. Only use auxiliary modalities for training, calibration, or label generation when necessary.',
  },

  paperSummaries: [
    {
      file: 'MultiModal_WiFi_Sensing_Architecture_Methodology.docx',
      summary:
        'Defines the broader multi-modal design space: fusion, distillation, automatic label generation, and shared latent alignment.',
    },
    {
      file: 'RSSI_Presence_Counting_Architecture_Methodology.docx',
      summary:
        'Defines the occupancy layer through RSSI windowing, detector statistics, anomaly detection, and supervised counting.',
    },
    {
      file: 'VitalCSI_Detailed_Architecture_and_Methodology.docx',
      summary:
        'Defines the respiration and physiological anchoring layer through CSI, PCA, CQI, FFT, breath counting, and Kalman fusion.',
    },
    {
      file: 'WiEat_Architecture_and_Methodology.docx',
      summary:
        'Defines the fine-grained eating behavior layer through CSI preprocessing, segmentation, utensil classification, chewing, and swallowing analysis.',
    },
  ],
};

export const MASTER_FOUR_PILLAR_METHODOLOGY_PLAN = MASTER_FOUR_PILLAR_ARCHITECTURE.detailedMethodologyPlan;

export const MASTER_FOUR_PILLAR_PILLARS = MASTER_FOUR_PILLAR_ARCHITECTURE.sourcePillars;

export default MASTER_FOUR_PILLAR_ARCHITECTURE;
