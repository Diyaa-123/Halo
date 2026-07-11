import os
import sys

def verify():
    try:
        from CSIKit.reader import get_reader
        from CSIKit.util import csitools
        print("CSIKit imported successfully")
    except ImportError as e:
        print(f"FAILED: CSIKit import failed: {e}")
        return

    # Try to find a pcap file
    possible_paths = [
        "datasets/gait analysis dataset/Experiment-2/realdata/csidata",
        "dataset/gait"
    ]
    
    pcap_file = None
    for path in possible_paths:
        if os.path.exists(path):
            # Find the first pcap file recursively or in subdirectories
            for root, dirs, files in os.walk(path):
                pcap_files = [f for f in files if f.endswith('.pcap')]
                if pcap_files:
                    pcap_file = os.path.join(root, pcap_files[0])
                    break
        if pcap_file:
            break
            
    if not pcap_file:
        print("FAILED: No .pcap files found in dataset directories")
        return
        
    print(f"Attempting to parse: {pcap_file}")
    try:
        reader = get_reader(pcap_file)
        csi_data = reader.read_file(pcap_file, scaled=True)
        csi_matrix, no_frames, no_subcarriers = csitools.get_CSI(csi_data)
        print("PARSE SUCCESSFUL")
        print(f"Matrix shape: {csi_matrix.shape}")
        print(f"Number of frames: {no_frames}")
        print(f"Number of subcarriers: {no_subcarriers}")
        print("TASK 0 COMPLETE")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"FAILED: CSIKit failed to parse file: {e}")

if __name__ == "__main__":
    verify()
