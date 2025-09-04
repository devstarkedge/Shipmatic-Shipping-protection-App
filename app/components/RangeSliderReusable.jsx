import React from "react";
import { RangeSlider } from "@shopify/polaris";

export default function RangeSliderReusable({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  output = false,
  ...props
}) {
  return (
    <RangeSlider
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      output={output}
      {...props}
    />
  );
}
