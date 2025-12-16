import { useEffect, useState, useMemo } from "react";

// Detect Safari browser (not Chrome on iOS which also says Safari)
const isSafari = () => {
  const ua = navigator.userAgent;
  const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua);
  return isSafariBrowser;
};

// The app uses zoom: 0.75 on #root, but Safari doesn't support CSS zoom
// So we need to know the intended scale factor
const INTENDED_ZOOM = 0.75;

export function useZoomScale(defaultValue = 1) {
  const [scale, setScale] = useState(defaultValue);

  const safariDetected = useMemo(() => isSafari(), []);

  useEffect(() => {
    const el = document.getElementById("root");
    if (!el) return;

    // For Safari, we use transform: scale() instead of zoom
    // So we need to return the intended zoom value directly
    if (safariDetected) {
      setScale(INTENDED_ZOOM);
      return;
    }

    // For Chrome/Edge/etc., read the zoom from computed styles
    const z = getComputedStyle(el).zoom;
    const parsed = z ? Number(z) : defaultValue;
    setScale(Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue);
  }, [safariDetected, defaultValue]);

  return scale;
}
