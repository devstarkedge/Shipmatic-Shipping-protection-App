import React, { useState, useEffect, useCallback } from "react";
import { ColorPicker, Text, Popover } from "@shopify/polaris";

function hsvToHex({ hue, saturation, brightness }) {
  saturation = saturation || 0;
  brightness = brightness || 0;
  const c = brightness * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = brightness - c;
  let r = 0,
    g = 0,
    b = 0;

  if (hue >= 0 && hue < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (hue >= 60 && hue < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (hue >= 120 && hue < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (hue >= 180 && hue < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (hue >= 240 && hue < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (hue >= 300 && hue < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToHsv(hex) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("");
  }
  const bigint = parseInt(hex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    v = max;

  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = (60 * ((g - b) / d) + 360) % 360;
        break;
      case g:
        h = (60 * ((b - r) / d) + 120) % 360;
        break;
      case b:
        h = (60 * ((r - g) / d) + 240) % 360;
        break;
      default:
        h = 0;
    }
  }

  return { hue: h, saturation: s, brightness: v };
}

export default function ColorPickerWithHexInput({ label, colorState, onChange }) {
  const [hex, setHex] = useState(colorState);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setHex(colorState);
  }, [colorState]);

  const toggleActive = useCallback(() => setActive((active) => !active), []);

  const handleColorChange = (newColor) => {
    const newHex = hsvToHex(newColor);
    setHex(newHex);
    onChange(newHex);
  };

  const handleHexChange = (value) => {
    setHex(value);
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(value)) {
      onChange(value);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column",  }}>
      <Text as="p" variant="bodysm" fontWeight="regular"  >
        {label}
      </Text>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#f4f6f8",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          padding: "4px 4px",
          cursor: "pointer",
          width: "100%",
          boxSizing: "border-box",
          marginTop: 8
        }}
        onClick={toggleActive}
        aria-label={`Toggle color picker for ${label}`}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            backgroundColor: hex,
            border: "1px solid #ccc",
            marginRight: 8,
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
          maxLength={7}
          style={{
            border: "none",
            backgroundColor: "transparent",
            outline: "none",
            fontSize: 14,
            width: "100%",
            color: "#111",
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <Popover active={active} activator={<div />} onClose={toggleActive} sectioned>
        <ColorPicker color={hexToHsv(hex)} onChange={handleColorChange} />
      </Popover>
    </div>
  );
}
