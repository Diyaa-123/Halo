"""
preprocess_gait.py — Experiment-1 Edition (Fixed: No Data Leakage)
=====================================================================
Handles the Experiment-1 Nexmon CSI dataset:

Dataset layout:
  datasets/Experiment-1/Experiment-1/Experiment-1/Train/
    Data3_Train/room/Red/{EMPTY,SIT,STAND,WALK}/*.pcap   (50 files/class)
    Data8_Train/room/Red/{EMPTY,SIT,STAND,WALK}/*.pcap  (1800 files/class)
    Template_Train/room/Red/...                           (0 files — skipped)

Nexmon packet format (Experiment-1, 802.11n):
  Ethernet(14) + IP(20) + UDP(8) = 42 bytes L2/L3/L4 headers
  Nexmon header : 18 bytes starting with magic 0x11111111
  CSI data      : 512 bytes = 128 complex int16 pairs (I/Q per subcarrier)
  Down-sampled  : 128 → 56 subcarriers (mean-pool groups of ~2)

Packet rate    : ~300 packets per file
Classes        : empty, sit, stand, walk  (4 classes)

Data Leakage Fix (v2)
---------------------
Previous version used validation_split=0.15 inside model.fit(), which randomly
picks 15% of the already-windowed rows. Because adjacent windows share 75 out of
100 frames (75% overlap), train and val windows were nearly identical copies —
giving artificially inflated 99%+ validation accuracy.

Fix: Split files into 70% train / 15% val / 15% test BEFORE windowing. Windows
from val/test files can NEVER overlap with windows from train files.
"""

import os
import json
import struct
import numpy as np
from scipy.signal import butter, sosfilt
from sklearn.model_selection import train_test_split
from collections import Counter

# ── Configuration ─────────────────────────────────────────────────────────────
TARGET_N_SC   = 56       # Must match ESP32 live inference (ws_server.py uses 56)
RAW_N_SC      = 128      # Experiment-1 Nexmon 802.11n: 128 complex pairs = 512 bytes
NEXMON_HDR_SZ = 18       # Bytes before CSI data in the UDP payload (after ETH+IP+UDP)
ETH_IP_UDP_SZ = 42       # Ethernet(14) + IP(20) + UDP(8)
CSI_BYTES     = RAW_N_SC * 4   # 128 complex int16 pairs = 512 bytes
NEXMON_MAGIC  = 0x11111111

FS            = 58.0     # ~300 packets / 5.1 s ≈ 58 Hz  (measured from files)
WINDOW_SIZE   = 100      # Frames per training window
STRIDE        = 75       # Window stride  (overlap = 25 frames)


# ── Nexmon .pcap Parser ───────────────────────────────────────────────────────
def parse_nexmon_pcap(filepath):
    """
    Parse a Nexmon CSI .pcap file and return amplitude vectors.

    Returns
    -------
    np.ndarray, shape (n_frames, TARGET_N_SC)  or  empty array on failure
    """
    frames = []

    try:
        with open(filepath, 'rb') as f:
            # ── Global header (24 bytes) ──
            global_hdr = f.read(24)
            if len(global_hdr) < 24:
                return np.array(frames, dtype=np.float32)

            pcap_magic = struct.unpack('<I', global_hdr[:4])[0]
            if pcap_magic in (0xa1b2c3d4, 0xa1b23c4d):
                endian = '<'
            elif pcap_magic in (0xd4c3b2a1, 0x4d3cb2a1):
                endian = '>'
            else:
                return np.array(frames, dtype=np.float32)

            pkt_hdr_dtype = np.dtype(f'{endian}u4')

            # ── Packet loop ──
            while True:
                raw_pkt_hdr = f.read(16)
                if len(raw_pkt_hdr) < 16:
                    break

                # numpy uint32 avoids Python int overflow (the CSIKit bug)
                hdr      = np.frombuffer(raw_pkt_hdr, dtype=pkt_hdr_dtype)
                incl_len = int(hdr[2])

                if incl_len == 0 or incl_len > 65535:
                    break

                payload = f.read(incl_len)
                if len(payload) < incl_len:
                    break

                amp = _extract_amplitude(payload)
                if amp is not None:
                    frames.append(amp)

    except Exception:
        pass

    return np.array(frames, dtype=np.float32)


def _extract_amplitude(payload):
    """
    Extract and down-sample CSI amplitude from one Ethernet frame.

    Experiment-1 UDP payload layout:
      [ETH_IP_UDP_SZ=42 bytes] + [Nexmon 18-byte header] + [512 bytes CSI]
    CSI = 128 × (int16 I, int16 Q)
    Down-sampled to TARGET_N_SC=56 by mean-pooling.
    """
    offset = ETH_IP_UDP_SZ + NEXMON_HDR_SZ
    needed = offset + CSI_BYTES

    if len(payload) < needed:
        return None

    # Verify Nexmon magic
    nexmon_magic = struct.unpack('<I', payload[ETH_IP_UDP_SZ:ETH_IP_UDP_SZ + 4])[0]
    if nexmon_magic != NEXMON_MAGIC:
        return None

    # Parse 128 complex int16 pairs
    csi_raw   = np.frombuffer(payload[offset:offset + CSI_BYTES], dtype=np.int16).astype(np.float32)
    I_vals    = csi_raw[0::2]   # shape: (128,)
    Q_vals    = csi_raw[1::2]   # shape: (128,)
    amplitude = np.sqrt(I_vals ** 2 + Q_vals ** 2)  # shape: (128,)

    # Down-sample 128 → 56 via mean-pooling
    # Use the first 112 subcarriers (112 = 56 × 2), average each pair
    amp56 = amplitude[:112].reshape(TARGET_N_SC, 2).mean(axis=1)  # shape: (56,)

    return amp56


# ── Signal Processing ─────────────────────────────────────────────────────────
def bandpass_filter(data, lowcut=0.5, highcut=15.0, fs=FS, order=4):
    """
    Bandpass filter.
    fs≈58 Hz.  highcut capped at 0.95 × Nyquist (≈27.5 Hz).
    """
    nyq  = 0.5 * fs
    low  = lowcut / nyq
    high = min(highcut / nyq, 0.95)
    sos  = butter(order, [low, high], btype='band', output='sos')
    return sosfilt(sos, data, axis=0)


# ── Dataset Discovery ─────────────────────────────────────────────────────────
def collect_files(dataset_dir):
    """
    Recursively discover all pcap files under the Experiment-1 Train folder.

    Folder structure:
      {DataX_Train}/room/Red/{CLASS_NAME}/*.pcap

    CLASS_NAME is lowercased to become the label (e.g. WALK → walk).

    Returns: dict {class_name: [filepath, ...]}
    """
    classes = {}

    train_dir = os.path.join(dataset_dir, 'Train')
    if not os.path.isdir(train_dir):
        print(f'ERROR: Train directory not found: {train_dir}')
        return classes

    for data_split in sorted(os.listdir(train_dir)):
        split_path = os.path.join(train_dir, data_split)
        if not os.path.isdir(split_path):
            continue
        class_root = os.path.join(split_path, 'room', 'Red')
        if not os.path.isdir(class_root):
            continue

        for cls_name_raw in sorted(os.listdir(class_root)):
            cls_path = os.path.join(class_root, cls_name_raw)
            if not os.path.isdir(cls_path):
                continue
            cls_name = cls_name_raw.lower()  # WALK → walk, SIT → sit, etc.
            pcap_files = sorted([
                os.path.join(cls_path, fn)
                for fn in os.listdir(cls_path)
                if fn.endswith('.pcap')
            ])
            if pcap_files:
                classes.setdefault(cls_name, []).extend(pcap_files)

    return classes


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    dataset_dir = os.path.join(
        os.path.dirname(__file__),
        'datasets',
        'Experiment-1', 'Experiment-1', 'Experiment-1',
    )

    if not os.path.exists(dataset_dir):
        print(f'ERROR: Dataset dir not found: {dataset_dir}')
        return

    out_dir = os.path.join(os.path.dirname(__file__), 'processed')
    os.makedirs(out_dir, exist_ok=True)

    # ── Discover classes ──
    classes = collect_files(dataset_dir)

    if not classes:
        print('No classes found.')
        return

    class_names = sorted(classes.keys())
    class_to_id = {name: i for i, name in enumerate(class_names)}
    print(f'Classes: {class_to_id}')
    for cls, files in sorted(classes.items()):
        print(f'  {cls}: {len(files)} pcap files')

    with open(os.path.join(out_dir, 'label_map.json'), 'w') as fj:
        json.dump(class_to_id, fj)

    # ── File-level 70/15/15 train/val/test split (NO DATA LEAKAGE) ──
    # IMPORTANT: Split is done on FILES, not on windows.
    # This guarantees that no window in val/test can share frames with any
    # window in train (since windowing happens per-file AFTER this split).
    all_files, all_labels = [], []
    for cls_name in class_names:
        for fp in classes[cls_name]:
            all_files.append(fp)
            all_labels.append(class_to_id[cls_name])

    # Step 1: carve out 15% for test
    train_val_files, test_files, train_val_labels, test_labels = train_test_split(
        all_files, all_labels,
        test_size=0.15, stratify=all_labels, random_state=42
    )
    # Step 2: split remaining 85% into 70% train / 15% val
    # val_size relative to train_val = 15/85 ≈ 0.176
    train_files, val_files, train_labels, val_labels = train_test_split(
        train_val_files, train_val_labels,
        test_size=0.176, stratify=train_val_labels, random_state=42
    )
    print(f'\nFiles: {len(all_files)} total | {len(train_files)} train '
          f'| {len(val_files)} val | {len(test_files)} test')
    print(f'(Approx split: train~=70% / val~=15% / test~=15%)')

    # ── Process splits ──
    def process_split(file_list, label_list, split_name):
        X, y = [], []
        n_ok = n_fail = 0

        for fp, lbl in zip(file_list, label_list):
            frames = parse_nexmon_pcap(fp)   # (n_frames, 56)

            if len(frames) < WINDOW_SIZE:
                n_fail += 1
                if n_fail <= 3:
                    print(f'  [SKIP] {os.path.basename(fp)}: only {len(frames)} frames')
                continue

            n_ok += 1

            # Static background removal (removes environmental multipath offset)
            frames = frames - np.mean(frames, axis=0)

            # Bandpass filter
            try:
                frames = bandpass_filter(frames, fs=FS)
            except Exception:
                pass

            # Sliding window
            for start in range(0, len(frames) - WINDOW_SIZE + 1, STRIDE):
                X.append(frames[start:start + WINDOW_SIZE])
                y.append(lbl)

        print(f'[{split_name}] parsed_ok={n_ok}, skipped={n_fail}, windows={len(X)}')
        if not X:
            return np.array([], dtype=np.float32), np.array([], dtype=np.int64)
        return np.array(X, dtype=np.float32), np.array(y, dtype=np.int64)

    print('\nProcessing train set...')
    X_train, y_train = process_split(train_files, train_labels, 'train')

    print('Processing val set...')
    X_val, y_val = process_split(val_files, val_labels, 'val')

    print('Processing test set...')
    X_test, y_test = process_split(test_files, test_labels, 'test')

    if len(X_train) == 0:
        print('\nERROR: No windows extracted. Check file format and WINDOW_SIZE.')
        return

    print(f'\nX_train: {X_train.shape}  X_val: {X_val.shape}  X_test: {X_test.shape}')
    print(f'Train class dist: {dict(Counter(y_train.tolist()))}')
    print(f'Val   class dist: {dict(Counter(y_val.tolist()))}')
    print(f'Test  class dist: {dict(Counter(y_test.tolist()))}')
    print(f'X_train stats: mean={X_train.mean():.2f}, std={X_train.std():.2f}')

    # ── Normalize (z-score per subcarrier, computed on train set ONLY) ──
    # NOTE: mean/std are computed ONLY from X_train to prevent leakage.
    # X_val and X_test are normalized using the train statistics.
    mean = np.nanmean(X_train, axis=(0, 1))   # shape: (56,)
    std  = np.nanstd(X_train, axis=(0, 1))    # shape: (56,)

    np.savez(os.path.join(out_dir, 'gait_scaler_params.npz'), mean=mean, std=std)

    X_train = np.nan_to_num((X_train - mean) / (std + 1e-8))
    X_val   = np.nan_to_num((X_val   - mean) / (std + 1e-8))
    X_test  = np.nan_to_num((X_test  - mean) / (std + 1e-8))

    # ── Save all three splits ──
    np.save(os.path.join(out_dir, 'X_train.npy'), X_train)
    np.save(os.path.join(out_dir, 'y_train.npy'), y_train)
    np.save(os.path.join(out_dir, 'X_val.npy'),   X_val)
    np.save(os.path.join(out_dir, 'y_val.npy'),   y_val)
    np.save(os.path.join(out_dir, 'X_test.npy'),  X_test)
    np.save(os.path.join(out_dir, 'y_test.npy'),  y_test)

    print('\nPreprocessing complete (data-leakage-free).')
    print(f'Saved to: {out_dir}')
    print(f'\nSummary:')
    print(f'  Classes       : {list(class_to_id.keys())}')
    print(f'  Train windows : {X_train.shape[0]}  shape={X_train.shape}')
    print(f'  Val   windows : {X_val.shape[0]}    shape={X_val.shape}')
    print(f'  Test  windows : {X_test.shape[0]}   shape={X_test.shape}')
    print(f'  Subcarriers   : {TARGET_N_SC}')
    print(f'  Window size   : {WINDOW_SIZE} frames')
    print(f'  Split strategy: 70% train / 15% val / 15% test (FILE-LEVEL)')


if __name__ == '__main__':
    main()
