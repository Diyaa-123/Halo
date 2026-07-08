"""
SilentSense Backend Launcher
Run this script from the Silent Sense root directory:
    python server/start.py
"""
import sys
import os

# Ensure the parent directory is on the Python path so 'server' package resolves
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.ws_server import main

if __name__ == '__main__':
    main()
