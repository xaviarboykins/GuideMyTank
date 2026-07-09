"use client";

import { useState } from "react";

type PriceFilterSliderProps = {
  defaultValue: number;
  max: number;
  min?: number;
  step?: number;
};

export function PriceFilterSlider({
  defaultValue,
  max,
  min = 10,
  step = 10,
}: PriceFilterSliderProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <label className="block">
      <span className="text-xs font-bold uppercase">Price</span>
      <span className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>$0</span>
        <span>Up to ${value}</span>
      </span>
      <input
        type="range"
        name="priceMax"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        className="mt-2 w-full accent-sky-700"
      />
    </label>
  );
}
