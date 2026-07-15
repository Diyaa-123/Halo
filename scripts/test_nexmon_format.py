"""Quick script to analyze the Nexmon pcap format and verify CSI extraction."""
import struct, numpy as np, os

filepath = os.path.join(os.path.dirname(__file__),
    'datasets', 'Experiment-2', 'Experiment-2',
    'realdata', 'input_data', '30ms', 'csidata', 'fall', 'fall100.pcap')

with open(filepath, 'rb') as f:
    global_hdr = f.read(24)
    packets = []
    while True:
        pkt_hdr_raw = f.read(16)
        if len(pkt_hdr_raw) < 16:
            break
        hdr = np.frombuffer(pkt_hdr_raw, dtype='<u4')
        incl_len = int(hdr[2])
        if incl_len == 0 or incl_len > 65535:
            break
        payload = f.read(incl_len)
        if len(payload) < incl_len:
            break
        packets.append(payload)

print(f'Total packets: {len(packets)}')
print(f'Payload sizes: {sorted(set(len(p) for p in packets[:20]))}')

p0 = packets[0][42:]  # Skip Ethernet(14)+IP(20)+UDP(8)
print(f'Nexmon payload: {len(p0)} bytes')
magic = struct.unpack('<I', p0[:4])[0]
print(f'magic: {hex(magic)}')
print(f'Bytes 4-22 hex: {p0[4:22].hex()}')

# The UDP payload is 1042 bytes
# Nexmon header is 18 bytes: magic(4) + 14 bytes metadata
# CSI = 1042 - 18 = 1024 bytes = 256 complex int16 pairs
nexmon_hdr_size = 18
csi_bytes = p0[nexmon_hdr_size:]
print(f'CSI bytes: {len(csi_bytes)}')

csi = np.frombuffer(csi_bytes[:1024], dtype=np.int16).astype(np.float32)
I = csi[0::2]; Q = csi[1::2]
amp = np.sqrt(I**2 + Q**2)
print(f'256-subcarrier amplitude: min={amp.min():.1f}, max={amp.max():.1f}, mean={amp.mean():.1f}, std={amp.std():.1f}')

# Check a few different classes to verify signal difference
for cls in ['fall', 'sit', 'walk']:
    cls_dir = os.path.join(os.path.dirname(filepath).replace('fall', cls))
    # just manually fix path
    cls_path = os.path.join(os.path.dirname(__file__),
        'datasets', 'Experiment-2', 'Experiment-2',
        'realdata', 'input_data', '30ms', 'csidata', cls)
    files = [f for f in os.listdir(cls_path) if f.endswith('.pcap')][:3]
    means = []
    for fn in files:
        fp = os.path.join(cls_path, fn)
        try:
            with open(fp, 'rb') as f2:
                f2.read(24)
                hdr2 = np.frombuffer(f2.read(16), dtype='<u4')
                p2 = f2.read(int(hdr2[2]))
            csi2 = np.frombuffer(p2[42+18:42+18+1024], dtype=np.int16).astype(np.float32)
            amp2 = np.sqrt(csi2[0::2]**2 + csi2[1::2]**2)
            means.append(amp2.mean())
        except Exception as e:
            means.append(-1)
    print(f'Class {cls}: mean amplitudes of first 3 files: {[round(m,1) for m in means]}')
