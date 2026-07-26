from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from statistics import mean, pstdev
from typing import Optional


@dataclass
class Segment:
    label: str
    category: str
    start: datetime
    end: datetime
    values: list[float]


def _parse_timestamp(text: str, base_date: Optional[date] = None) -> datetime:
    text = text.strip()
    if "T" in text or " " in text:
        dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.astimezone()
        return dt

    if base_date is None:
        raise ValueError("Time-only labels require a dated CSV log")

    parts = [int(p) for p in text.split(":")]
    if len(parts) == 2:
        parts.append(0)
    if len(parts) != 3:
        raise ValueError(f"Unsupported time format: {text}")
    return datetime.combine(base_date, datetime.min.time()).replace(hour=parts[0], minute=parts[1], second=parts[2]).astimezone()


def _parse_segment(segment_text: str, base_date: Optional[date]) -> tuple[str, datetime, datetime, str]:
    if "=" not in segment_text:
        raise ValueError("Segments must use start-end=label")
    range_text, label = segment_text.split("=", 1)
    if ".." in range_text:
        start_text, end_text = range_text.split("..", 1)
    else:
        start_text, end_text = range_text.rsplit("-", 1)
    start = _parse_timestamp(start_text, base_date)
    end = _parse_timestamp(end_text, base_date)
    if end < start:
        end = end + timedelta(days=1)

    lowered = label.lower()
    if any(token in lowered for token in ("outside", "boundary", "hallway", "street")):
        category = "outside"
    else:
        category = "inside"
    return label, start, end, category


def _load_rows(csv_path: Path) -> list[dict]:
    with csv_path.open("r", newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def _load_values(rows: list[dict], metric: str, start: datetime, end: datetime) -> list[float]:
    values: list[float] = []
    for row in rows:
        ts_raw = row.get("timestamp_iso") or row.get("timestamp") or ""
        try:
            ts = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
        except ValueError:
            continue
        if ts.tzinfo is None:
            ts = ts.astimezone()
        if start <= ts <= end:
            try:
                values.append(float(row[metric]))
            except (KeyError, TypeError, ValueError):
                continue
    return values


def _summarize(values: list[float]) -> dict:
    if not values:
        return {"n": 0, "mean": None, "min": None, "max": None, "std": None}
    return {
        "n": len(values),
        "mean": mean(values),
        "min": min(values),
        "max": max(values),
        "std": pstdev(values) if len(values) > 1 else 0.0,
    }


def _fmt(value: Optional[float]) -> str:
    return "--" if value is None else f"{value:.4f}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze presence calibration logs and suggest a threshold.")
    parser.add_argument("csv", type=Path, help="Calibration CSV log")
    parser.add_argument("--segment", action="append", default=[], help="Segment as start-end=label or start..end=label")
    parser.add_argument("--metric", default="smoothed_amplitude", help="CSV metric to analyze")
    args = parser.parse_args()

    rows = _load_rows(args.csv)
    if not rows:
        print("No rows found in CSV log.")
        return 1

    first_raw = rows[0].get("timestamp_iso") or rows[0].get("timestamp") or ""
    first_ts = datetime.fromisoformat(first_raw.replace("Z", "+00:00"))
    if first_ts.tzinfo is None:
        first_ts = first_ts.astimezone()
    base_date = first_ts.date()

    if not args.segment:
        print("No segments provided. Add one or more --segment start-end=label arguments.")
        return 1

    segments: list[Segment] = []
    for segment_text in args.segment:
        label, start, end, category = _parse_segment(segment_text, base_date)
        values = _load_values(rows, args.metric, start, end)
        segments.append(Segment(label=label, category=category, start=start, end=end, values=values))

    print(f"Metric: {args.metric}")
    print(f"{'category':<10} {'label':<28} {'n':>4} {'mean':>12} {'min':>12} {'max':>12} {'std':>12}")
    print("-" * 86)
    for segment in segments:
        stats = _summarize(segment.values)
        print(
            f"{segment.category:<10} {segment.label:<28} {stats['n']:>4} "
            f"{_fmt(stats['mean']):>12} {_fmt(stats['min']):>12} {_fmt(stats['max']):>12} {_fmt(stats['std']):>12}"
        )

    inside_segments = [s for s in segments if s.category == "inside" and s.values]
    outside_segments = [s for s in segments if s.category == "outside" and s.values]

    if not inside_segments or not outside_segments:
        print("\nNeed at least one inside segment and one outside/boundary segment to suggest a threshold.")
        return 1

    inside_lowest = min(min(s.values) for s in inside_segments)
    outside_highest = max(max(s.values) for s in outside_segments)
    threshold = (inside_lowest + outside_highest) / 2.0
    overlap = outside_highest >= inside_lowest

    print("\nThreshold analysis")
    print(f"  lowest inside reading:   {_fmt(inside_lowest)}")
    print(f"  highest outside reading: {_fmt(outside_highest)}")
    if overlap:
        print("  WARNING: ranges overlap, so there is no clean threshold.")
        print(f"  midpoint candidate:      {_fmt(threshold)} (manual review required)")
    else:
        print(f"  suggested threshold:     {_fmt(threshold)}")

    print("\nSuggested config:")
    print("{")
    print(f'  "threshold": {threshold:.6f},')
    print(f'  "calibrated_at": "{datetime.now().astimezone().isoformat(timespec="seconds")}",')
    print(f'  "metric": "{args.metric}",')
    print('  "window_seconds": 1.0,')
    print('  "isolation_forest": {')
    print(f'    "empty_room_variance_baseline": {_fmt(pstdev(outside_segments[0].values) if outside_segments[0].values else 0.05)},')
    print('    "anomaly_threshold_std": 0.40')
    print('  }')
    print("}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
