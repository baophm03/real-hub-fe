"use client";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  valueFrom: number;
  valueTo: number;
  onChange: (from: number, to: number) => void;
}

/**
 * Dual-thumb range slider (2 native input[type=range] chồng lên nhau).
 * `valueTo === max` được hiểu là "không giới hạn trên" khi chưa chạm.
 */
export function PriceRangeSlider({
  min,
  max,
  step = 1,
  valueFrom,
  valueTo,
  onChange,
}: PriceRangeSliderProps) {
  const fromPct = ((valueFrom - min) / (max - min)) * 100;
  const toPct = ((valueTo - min) / (max - min)) * 100;

  return (
    <div className="relative h-6 w-full select-none">
      {/* Track */}
      <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-surface-muted" />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#072707]"
        style={{ left: `${fromPct}%`, width: `${Math.max(0, toPct - fromPct)}%` }}
      />

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueFrom}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(Math.min(v, valueTo), valueTo);
        }}
        className="price-range-thumb pointer-events-none absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent"
        aria-label="Giá từ"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueTo}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(valueFrom, Math.max(v, valueFrom));
        }}
        className="price-range-thumb pointer-events-none absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent"
        aria-label="Giá đến"
      />
    </div>
  );
}
