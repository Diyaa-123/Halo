import unittest
import numpy as np
from server.multi_person_tracker import MultiPersonTracker

class TestMultiPersonTracker(unittest.TestCase):
    
    def setUp(self):
        self.tracker = MultiPersonTracker(max_occupants=3)
        
    def test_music_1d_separation(self):
        # Create a synthetic CSI matrix with 2 sources at specific angles
        num_antennas = 4
        num_subcarriers = 30
        
        # Angles in radians
        angle1 = np.pi / 6  # 30 degrees
        angle2 = -np.pi / 4 # -45 degrees
        
        d = 0.5
        a1 = np.exp(-1j * 2 * np.pi * d * np.arange(num_antennas) * np.sin(angle1))
        a2 = np.exp(-1j * 2 * np.pi * d * np.arange(num_antennas) * np.sin(angle2))
        
        csi_matrix = np.zeros((num_antennas, num_subcarriers), dtype=complex)
        
        # Add signals with random phase per subcarrier
        for sc in range(num_subcarriers):
            s1 = np.exp(1j * np.random.uniform(0, 2*np.pi))
            s2 = np.exp(1j * np.random.uniform(0, 2*np.pi))
            csi_matrix[:, sc] = a1 * s1 + a2 * s2
            
        # Add some noise
        noise = (np.random.randn(num_antennas, num_subcarriers) + 1j * np.random.randn(num_antennas, num_subcarriers)) * 0.1
        csi_matrix += noise
        
        positions = self.tracker.estimate_positions_music(csi_matrix, num_antennas, num_subcarriers)
        
        # Should detect 2 sources
        self.assertEqual(len(positions), 2)
        
    def test_vital_sign_separation(self):
        # Create a synthetic phase signal with 2 breathing rates
        fs = 40.0
        t = np.arange(0, 20.0, 1.0/fs) # 20 seconds
        
        # Br1: 15 BrPM (0.25 Hz)
        # Br2: 24 BrPM (0.4 Hz)
        # Hr1: 72 BPM (1.2 Hz)
        # Hr2: 90 BPM (1.5 Hz)
        
        br1 = 0.5 * np.sin(2 * np.pi * 0.25 * t)
        br2 = 0.3 * np.sin(2 * np.pi * 0.40 * t)
        hr1 = 0.1 * np.sin(2 * np.pi * 1.20 * t)
        hr2 = 0.08 * np.sin(2 * np.pi * 1.50 * t)
        
        mixed_signal = br1 + br2 + hr1 + hr2 + np.random.normal(0, 0.05, len(t))
        
        vitals = self.tracker.separate_vital_signs(mixed_signal, fs, max_persons=2)
        
        self.assertEqual(len(vitals), 2)
        
        extracted_brs = sorted([v[0] for v in vitals])
        extracted_hrs = sorted([v[1] for v in vitals])
        
        # Should be close to 15 and 24 BrPM
        self.assertAlmostEqual(extracted_brs[0], 15.0, delta=1.5)
        self.assertAlmostEqual(extracted_brs[1], 24.0, delta=1.5)
        
        # Should be close to 72 and 90 BPM
        self.assertAlmostEqual(extracted_hrs[0], 72.0, delta=3.0)
        self.assertAlmostEqual(extracted_hrs[1], 90.0, delta=3.0)

if __name__ == '__main__':
    unittest.main()
