"""
train_gait_sklearn.py -- Sklearn-based Gait Classifier (v2)
============================================================
Uses scikit-learn (works without TensorFlow/GPU/DLLs) to train a
high-accuracy activity recognition model on the preprocessed CSI data.

Improvements over v1:
  - GradientBoostingClassifier (better than RF on small datasets)
  - Added per-subcarrier FFT spectrum features (top-10 freq bins x 56 SC)
  - Model is saved FIRST before any plotting, so crashes never lose it
  - Fixed Unicode chars that crashed on Windows cp1252 terminals
"""

import numpy as np
import json
import os
import pickle
from collections import Counter
from scipy import stats as scipy_stats

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# ── Feature Extraction ────────────────────────────────────────────────────────
FFT_BINS = 10  # Top frequency bins per subcarrier


def extract_features(X):
    """
    Extract handcrafted temporal + spectral features from (N, T, 56) windows.

    Feature groups:
      - Per-SC time-domain stats: 10 x 56 = 560
      - Per-SC FFT spectrum (top FFT_BINS bins): FFT_BINS x 56 = 560
      - Global window stats + temporal: 12
    Total: 1132 features
    """
    N, T, SC = X.shape
    features = []

    for i in range(N):
        w = X[i]  # (T, 56)
        f = []

        # -- Per-subcarrier time-domain statistics (10 x 56 = 560) --
        f.extend(w.mean(axis=0).tolist())
        f.extend(w.std(axis=0).tolist())
        f.extend(w.min(axis=0).tolist())
        f.extend(w.max(axis=0).tolist())
        f.extend(np.median(w, axis=0).tolist())
        f.extend(scipy_stats.skew(w, axis=0).tolist())
        f.extend(scipy_stats.kurtosis(w, axis=0).tolist())
        f.extend((w ** 2).mean(axis=0).tolist())
        f.extend((w.max(axis=0) - w.min(axis=0)).tolist())
        zcr = ((np.diff(np.sign(w), axis=0) != 0).sum(axis=0) / T).tolist()
        f.extend(zcr)

        # -- Per-subcarrier FFT spectrum features (FFT_BINS x 56 = 560) --
        # Normalised power spectral density for bins 1..FFT_BINS (skip DC)
        fft_all = np.abs(np.fft.rfft(w - w.mean(axis=0), axis=0))  # (rfft_len, 56)
        psd = fft_all[1:FFT_BINS+1, :]  # (FFT_BINS, 56)
        psd_norm = psd / (psd.sum(axis=0, keepdims=True) + 1e-8)
        f.extend(psd_norm.T.flatten().tolist())  # (56 x FFT_BINS) = 560

        # -- Global / temporal statistics (12 features) --
        flat = w.flatten()
        f.append(float(flat.mean()))
        f.append(float(flat.std()))
        f.append(float(np.median(flat)))
        f.append(float(scipy_stats.skew(flat)))
        f.append(float(scipy_stats.kurtosis(flat)))
        f.append(float((flat ** 2).mean()))
        f.append(float(flat.max() - flat.min()))

        mean_ts = w.mean(axis=1)  # mean amplitude over SCs at each time step
        # Lag-1 autocorrelation (captures periodicity of walking)
        ac = float(np.corrcoef(mean_ts[:-1], mean_ts[1:])[0, 1]) if mean_ts.std() > 1e-8 else 0.0
        f.append(ac)
        # Peak spectral energy and dominant frequency bin (global motion rhythm)
        g_fft = np.abs(np.fft.rfft(mean_ts - mean_ts.mean()))
        f.append(float(g_fft[1:].max()))
        f.append(float(g_fft[1:].argmax()))
        # Rate of change: mean absolute first-order difference
        f.append(float(np.abs(np.diff(mean_ts)).mean()))
        # Variance of variance across subcarriers (spread of signal activity)
        f.append(float(w.var(axis=0).var()))

        features.append(f)

    return np.array(features, dtype=np.float32)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    processed_dir = os.path.join(os.path.dirname(script_dir), 'processed')
    model_dir     = script_dir
    os.makedirs(model_dir, exist_ok=True)

    # ── Load preprocessed data ──
    print('Loading preprocessed data...')
    X_train_raw = np.load(f'{processed_dir}/X_train.npy')
    y_train     = np.load(f'{processed_dir}/y_train.npy')
    X_test_raw  = np.load(f'{processed_dir}/X_test.npy')
    y_test      = np.load(f'{processed_dir}/y_test.npy')

    with open(f'{processed_dir}/label_map.json') as f:
        class_to_id = json.load(f)
    labels    = [k for k, _ in sorted(class_to_id.items(), key=lambda kv: kv[1])]
    n_classes = len(labels)

    print(f'X_train: {X_train_raw.shape}  n_classes: {n_classes}  labels: {labels}')
    print(f'Train dist: {dict(Counter(y_train.tolist()))}')
    print(f'Test  dist: {dict(Counter(y_test.tolist()))}')

    # ── Feature extraction ──
    print('\nExtracting features from train windows...')
    X_train = extract_features(X_train_raw)
    print(f'Train feature matrix: {X_train.shape}')

    print('Extracting features from test windows...')
    X_test = extract_features(X_test_raw)
    print(f'Test  feature matrix: {X_test.shape}')

    # Replace any NaN/Inf
    X_train = np.nan_to_num(X_train, nan=0.0, posinf=0.0, neginf=0.0)
    X_test  = np.nan_to_num(X_test,  nan=0.0, posinf=0.0, neginf=0.0)

    # -- Train RandomForest (better regularised than GB for small CSI datasets) --
    print('\nTraining RandomForestClassifier (500 trees, balanced class weights)...')
    rf = RandomForestClassifier(
        n_estimators=500,
        max_depth=None,
        min_samples_split=3,
        min_samples_leaf=2,
        max_features='sqrt',
        class_weight='balanced',
        n_jobs=-1,
        random_state=42,
        verbose=0
    )

    # Pipeline: scale -> classify
    pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('clf',    rf),
    ])

    pipe.fit(X_train, y_train)

    # ── Evaluate ──
    print('\nEvaluating on test set...')
    y_pred = pipe.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)
    print(f'Test Accuracy: {acc:.4f}  ({acc*100:.1f}%)')

    print('\nClassification Report:')
    print(classification_report(y_test, y_pred, target_names=labels))

    cm = confusion_matrix(y_test, y_pred)
    print('\nConfusion Matrix:')
    header = f"{'':>10} | " + ' | '.join([f'Pred:{lbl[:6]:>6}' for lbl in labels])
    print(header)
    print('-' * len(header))
    for i, tl in enumerate(labels):
        row = f'True:{tl[:6]:<5} | ' + ' | '.join([f'{cm[i,j]:>12}' for j in range(n_classes)])
        print(row)

    # -- Feature importances --
    importances = pipe.named_steps['clf'].feature_importances_
    print('\nTop 10 most important features (out of %d):' % len(importances))
    top10 = np.argsort(importances)[::-1][:10]
    for rank, idx in enumerate(top10):
        print('  %d. Feature %d: importance=%.4f' % (rank+1, idx, importances[idx]))

    # -- SAVE MODEL FIRST (before any plots that might crash) --
    model_data = {
        'pipeline':    pipe,
        'labels':      labels,
        'class_to_id': class_to_id,
        'n_features':  X_train.shape[1],
        'accuracy':    float(acc),
    }
    pkl_path = '%s/gait_model.pkl' % model_dir
    with open(pkl_path, 'wb') as f:
        pickle.dump(model_data, f, protocol=4)
    print('Model saved -> %s' % pkl_path)

    # Also save label map for ws_server.py compatibility
    with open('%s/label_map.json' % processed_dir, 'w') as f:
        json.dump(class_to_id, f)

    # -- Confusion matrix plot --
    fig, ax = plt.subplots(figsize=(8, 6))
    im = ax.imshow(cm, cmap='Blues')
    fig.colorbar(im)
    ax.set_xticks(range(n_classes)); ax.set_xticklabels(labels, rotation=45, ha='right')
    ax.set_yticks(range(n_classes)); ax.set_yticklabels(labels)
    ax.set_xlabel('Predicted'); ax.set_ylabel('True')
    ax.set_title('Gait GB Classifier -- Accuracy: %.1f%%' % (acc*100))
    for i in range(n_classes):
        for j in range(n_classes):
            ax.text(j, i, str(cm[i, j]), ha='center', va='center',
                    color='white' if cm[i, j] > cm.max() / 2 else 'black', fontsize=10)
    plt.tight_layout()
    plt.savefig('%s/gait_confusion_matrix.png' % model_dir, dpi=150)
    plt.close()
    print('Confusion matrix -> %s/gait_confusion_matrix.png' % model_dir)

    print('\nDone. Final accuracy: %.1f%%' % (acc*100))


if __name__ == '__main__':
    main()
