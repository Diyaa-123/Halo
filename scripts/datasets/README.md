# ML Datasets

This folder is the designated location for your raw and preprocessed datasets, specifically meant for machine learning model training in Silent Sense (e.g., Gait Analysis, Vital Sign Classification).

## Folder Structure Guidelines

To maintain organization, please place your datasets in specific subdirectories based on their domain:

- `/gait_analysis/` - Place CSVs, CSI matrices, or video clips for gait models here. (Used by `train_gait_cnn.py` and `preprocess_gait.py`).
- `/vitals/` - Place captured CSI amplitude/phase logs for breathing or heart rate training.
- `/occupancy/` - Place spatial mapping logs or point clouds for the multi-person occupancy tracking.

## Usage in Scripts
When writing your scripts (e.g., `preprocess_gait.py`), reference this directory relatively:
```python
import os

DATASET_DIR = os.path.join(os.path.dirname(__file__), 'datasets', 'gait_analysis')
# Load your data here...
```
