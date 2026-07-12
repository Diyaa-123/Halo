"""
SilentSense Backend Launcher
Run this script from the Silent Sense root directory:
    python backend/start.py
"""
import sys
import os

# Ensure the parent directory is on the Python path so 'backend' package resolves
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.ws_server import main

if __name__ == '__main__':
    main()
