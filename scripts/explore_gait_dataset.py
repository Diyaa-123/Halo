import os
import numpy as np
from CSIKit.reader import get_reader
from CSIKit.util import csitools
import sys

def explore():
    dataset_dir = "datasets/gait analysis dataset/Experiment-2/realdata/csidata"
    
    if not os.path.exists(dataset_dir):
        print(f"Error: {dataset_dir} does not exist.")
        return
        
    print(f"Exploring dataset at: {dataset_dir}")
    
    classes = {}
    
    for root, dirs, files in os.walk(dataset_dir):
        class_name = os.path.basename(root).upper()
        pcap_files = [f for f in files if f.endswith('.pcap')]
        
        if pcap_files:
            if class_name not in classes:
                classes[class_name] = []
            classes[class_name].extend([os.path.join(root, f) for f in pcap_files])
            
    print("\nDataset Summary:")
    print("-" * 30)
    for cls, files in classes.items():
        print(f"Class: {cls} - {len(files)} files")
        
    if classes:
        first_cls = list(classes.keys())[0]
        first_file = classes[first_cls][0]
        print(f"\nAnalyzing sample file: {first_file}")
        try:
            reader = get_reader(first_file)
            csi_data = reader.read_file(first_file, scaled=True)
            csi_matrix, no_frames, no_subcarriers = csitools.get_CSI(csi_data)
            print(f"Frames: {no_frames}, Subcarriers: {no_subcarriers}")
        except Exception as e:
            print(f"Failed to parse with CSIKit: {e}")

if __name__ == "__main__":
    explore()
