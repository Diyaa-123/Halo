from __future__ import annotations

import argparse
import csv
from datetime import datetime
from pathlib import Path
import socket
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.esp32_csi import AmplitudeSmoother, parse_esp32_csi_packet


def _default_output_path() -> Path:
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return ROOT / "backend" / "calibration_logs" / f"presence_calibration_{stamp}.csv"


def main() -> int:
    parser = argparse.ArgumentParser(description="Log ESP32 CSI amplitude values for presence calibration.")
    parser.add_argument("--bind", default="0.0.0.0", help="UDP bind address")
    parser.add_argument("--port", type=int, default=5005, help="UDP port to listen on")
    parser.add_argument("--output", type=Path, default=_default_output_path(), help="CSV output path")
    parser.add_argument("--smooth-window", type=float, default=1.0, help="Rolling smoothing window in seconds")
    parser.add_argument("--print-interval", type=float, default=1.0, help="Console print interval in seconds")
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((args.bind, args.port))
    sock.settimeout(1.0)

    smoother = AmplitudeSmoother(window_seconds=args.smooth_window)
    rows_written = 0
    packets_seen = 0
    last_print = 0.0

    print(f"Logging calibration data from udp://{args.bind}:{args.port}")
    print(f"Writing CSV to {args.output}")
    print("Press Ctrl+C to stop.")

    with args.output.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=[
                "timestamp_iso",
                "timestamp_unix",
                "source_addr",
                "sequence",
                "node_id",
                "n_antennas",
                "n_subcarriers",
                "frequency_mhz",
                "rssi_dbm",
                "noise_floor_dbm",
                "mean_amplitude",
                "rms_amplitude",
                "smoothed_amplitude",
                "amplitude_count",
            ],
        )
        writer.writeheader()
        fh.flush()

        try:
            while True:
                try:
                    raw, addr = sock.recvfrom(65535)
                except socket.timeout:
                    continue

                packets_seen += 1
                frame = parse_esp32_csi_packet(raw)
                if frame is None:
                    continue

                now = time.time()
                smoothed = smoother.update(frame.mean_amplitude, timestamp=now)
                row = {
                    "timestamp_iso": datetime.fromtimestamp(now).astimezone().isoformat(timespec="milliseconds"),
                    "timestamp_unix": f"{now:.6f}",
                    "source_addr": f"{addr[0]}:{addr[1]}",
                    "sequence": frame.sequence,
                    "node_id": frame.node_id,
                    "n_antennas": frame.n_antennas,
                    "n_subcarriers": frame.n_subcarriers,
                    "frequency_mhz": frame.frequency_mhz,
                    "rssi_dbm": frame.rssi_dbm,
                    "noise_floor_dbm": frame.noise_floor_dbm,
                    "mean_amplitude": f"{frame.mean_amplitude:.6f}",
                    "rms_amplitude": f"{frame.rms_amplitude:.6f}",
                    "smoothed_amplitude": "" if smoothed is None else f"{smoothed:.6f}",
                    "amplitude_count": int(frame.amplitudes.size),
                }
                writer.writerow(row)
                fh.flush()
                rows_written += 1

                if now - last_print >= args.print_interval:
                    last_print = now
                    print(
                        f"[{row['timestamp_iso']}] seq={frame.sequence} "
                        f"mean={row['mean_amplitude']} rms={row['rms_amplitude']} "
                        f"smooth={row['smoothed_amplitude'] or '--'} "
                        f"rssi={frame.rssi_dbm} noise={frame.noise_floor_dbm} "
                        f"count={frame.amplitudes.size}"
                    )
        except KeyboardInterrupt:
            print("\nStopping calibration logger...")
        finally:
            fh.flush()
            sock.close()
            print(f"Captured {rows_written} CSI frames from {packets_seen} UDP packets.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
