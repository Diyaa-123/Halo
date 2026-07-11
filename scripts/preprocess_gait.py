import os
import numpy as np
from CSIKit.reader import get_reader
from CSIKit.util import csitools
from scipy.signal import butter, sosfilt
from sklearn.model_selection import train_test_split
from collections import Counter
import sys

def bandpass_filter(data, lowcut=0.5, highcut=5.0, fs=100.0, order=5):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    sos = butter(order, [low, high], btype='band', output='sos')
    return sosfilt(sos, data, axis=0)

def main():
    dataset_dir = "datasets/gait analysis dataset/Experiment-2/realdata/csidata"
    if not os.path.exists(dataset_dir):
        print(f"Dataset dir {dataset_dir} not found.")
        return
        
    out_dir = "scripts/processed"
    os.makedirs(out_dir, exist_ok=True)
    
    classes = {}
    for root, dirs, files in os.walk(dataset_dir):
        class_name = os.path.basename(root).upper()
        pcap_files = [f for f in files if f.endswith('.pcap')]
        if pcap_files:
            if class_name not in classes:
                classes[class_name] = []
            classes[class_name].extend([os.path.join(root, f) for f in pcap_files])

    # Convert class names to IDs
    class_names = sorted(list(classes.keys()))
    class_to_id = {name: i for i, name in enumerate(class_names)}
    
    # Save label mapping
    import json
    with open(os.path.join(out_dir, 'label_map.json'), 'w') as f:
        json.dump(class_to_id, f)

    all_files = []
    all_labels = []
    
    for cls_name, files in classes.items():
        all_files.extend(files)
        all_labels.extend([class_to_id[cls_name]] * len(files))

    # Perform file-level train-test split
    train_files, test_files, train_labels, test_labels = train_test_split(
        all_files, all_labels, test_size=0.2, stratify=all_labels, random_state=42
    )
    
    print(f"Total files: {len(all_files)}")
    print(f"Train files: {len(train_files)}, Test files: {len(test_files)}")

    def process_files(file_list, label_list, window_size=200, overlap=100):
        X, y = [], []
        for file_path, label in zip(file_list, label_list):
            try:
                reader = get_reader(file_path)
                csi_data = reader.read_file(file_path, scaled=True)
                csi_matrix, no_frames, no_subcarriers = csitools.get_CSI(csi_data)
                
                # csi_matrix shape: (frames, subcarriers, antennas) or (frames, subcarriers)
                # Ensure it is 2D: (frames, subcarriers)
                if len(csi_matrix.shape) > 2:
                    # Just take the first antenna/tx-rx pair
                    csi_matrix = csi_matrix[:, :, 0]
                
                # Apply Bandpass filter
                filtered_csi = bandpass_filter(np.abs(csi_matrix))
                
                # Sliding window
                for start in range(0, len(filtered_csi) - window_size + 1, window_size - overlap):
                    window = filtered_csi[start:start+window_size, :]
                    X.append(window)
                    y.append(label)
                    
            except Exception as e:
                print(f"Failed to process {file_path}: {e}")
                
        return np.array(X), np.array(y)

    print("Processing train files...")
    X_train, y_train = process_files(train_files, train_labels)
    
    print("Processing test files...")
    X_test, y_test = process_files(test_files, test_labels)

    if len(X_train) == 0:
        print("Error: No data extracted. Aborting.")
        return

    # Calculate global mean and std for normalization, ignoring NaNs
    train_mean = np.nanmean(X_train, axis=(0, 1))
    train_std = np.nanstd(X_train, axis=(0, 1))
    
    # Save scaler params
    np.savez(os.path.join(out_dir, 'gait_scaler_params.npz'), mean=train_mean, std=train_std)

    # Normalize
    X_train = (X_train - train_mean) / (train_std + 1e-8)
    X_test = (X_test - train_mean) / (train_std + 1e-8)
    
    # Clean up any remaining NaNs or Infs
    X_train = np.nan_to_num(X_train, nan=0.0, posinf=0.0, neginf=0.0)
    X_test = np.nan_to_num(X_test, nan=0.0, posinf=0.0, neginf=0.0)

    print(f"Train data shape: {X_train.shape}")
    print(f"Test data shape: {X_test.shape}")
    
    np.save(os.path.join(out_dir, 'X_train.npy'), X_train)
    np.save(os.path.join(out_dir, 'y_train.npy'), y_train)
    np.save(os.path.join(out_dir, 'X_test.npy'), X_test)
    np.save(os.path.join(out_dir, 'y_test.npy'), y_test)
    print("Preprocessing complete.")

if __name__ == "__main__":
    main()
