import os
import torch
import torch.nn as nn
from safetensors.torch import load_file
import numpy as np
import logging

logger = logging.getLogger("DensePose")

class DensePoseNet(nn.Module):
    """
    WiFi-DensePose Neural Network.
    Maps 56 subcarriers x 20 timeframes of CSI data to 17 body keypoints.
    """
    def __init__(self):
        super(DensePoseNet, self).__init__()
        
        # Conv1d(in_channels=56, out_channels=64, kernel_size=3, padding=1, dilation=1)
        self.c1 = nn.Conv1d(56, 64, kernel_size=3, padding=1, dilation=1)
        
        # Conv1d(in_channels=64, out_channels=128, kernel_size=3, padding=2, dilation=2)
        self.c2 = nn.Conv1d(64, 128, kernel_size=3, padding=2, dilation=2)
        
        # Conv1d(in_channels=128, out_channels=128, kernel_size=3, padding=4, dilation=4)
        self.c3 = nn.Conv1d(128, 128, kernel_size=3, padding=4, dilation=4)
        
        # Linear(128 -> 256)
        self.fc1 = nn.Linear(128, 256)
        
        # Linear(256 -> 34)
        self.fc2 = nn.Linear(256, 34)
        
        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        """
        Forward pass.
        Args:
            x: Tensor of shape [Batch, 56, 20]
        Returns:
            Tensor of shape [Batch, 34] containing (x,y) normalized keypoints in [0, 1]
        """
        h = self.relu(self.c1(x))
        h = self.relu(self.c2(h))
        h = self.relu(self.c3(h))
        
        # Global average pool over time dim (last dim) -> [B, 128]
        pooled = h.mean(dim=2)
        
        h1 = self.relu(self.fc1(pooled))
        h2 = self.fc2(h1)
        
        return self.sigmoid(h2)

class WiFiDensePoseInference:
    def __init__(self, model_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Initializing DensePose AI on device: {self.device}")
        
        self.model = DensePoseNet().to(self.device)
        self.load_weights(model_path)
        self.model.eval()

        self.confidence_score = 0.185  # Default published confidence

    def load_weights(self, path: str):
        if not os.path.exists(path):
            raise FileNotFoundError(f"DensePose model file not found at: {path}")
            
        logger.info(f"Loading weights from {path}")
        state_dict = load_file(path)
        
        # The safetensors file has a prefix 'enc.' for convs and 'head.' for linears
        # Map them to our model's parameter names
        mapped_dict = {}
        for k, v in state_dict.items():
            if k.startswith("enc."):
                mapped_dict[k.replace("enc.", "")] = v
            elif k.startswith("head."):
                mapped_dict[k.replace("head.", "")] = v
            else:
                mapped_dict[k] = v
                
        self.model.load_state_dict(mapped_dict)
        logger.info("Weights loaded successfully.")

    def infer(self, csi_window: np.ndarray) -> dict:
        """
        Perform inference on a CSI window.
        Args:
            csi_window: numpy array of shape (56, 20) or flat array of length 1120.
        Returns:
            Dict containing 'keypoints' (list of 34 floats) and 'confidence'.
        """
        # Ensure correct shape
        if csi_window.size != 56 * 20:
            logger.warning(f"Expected CSI window size 1120, got {csi_window.size}. Returning baseline.")
            return {"keypoints": [0.5] * 34, "confidence": 0.0}
            
        if csi_window.ndim == 1:
            csi_window = csi_window.reshape((56, 20))
            
        # Convert to tensor and add batch dim
        x = torch.tensor(csi_window, dtype=torch.float32).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            out = self.model(x)  # [1, 34]
            
        keypoints = out.squeeze(0).cpu().numpy().tolist()
        
        return {
            "keypoints": keypoints,
            "confidence": self.confidence_score
        }

if __name__ == "__main__":
    # Test execution
    logging.basicConfig(level=logging.INFO)
    import os
    model_file = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'models', 'pose_v1.safetensors')
    engine = WiFiDensePoseInference(model_file)
    
    # Dummy data test
    dummy_csi = np.zeros((56, 20))
    result = engine.infer(dummy_csi)
    print("Inference Result:", result)
