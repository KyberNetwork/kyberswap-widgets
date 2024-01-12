import { useEffect } from "react";
import { Theme } from "../theme";
import "./widget.css";

export interface WidgetProps {
  theme?: Theme;
}

export default function Widget({ theme }: WidgetProps) {
  useEffect(() => {
    if (!theme) return;
    const r = document.querySelector<HTMLElement>(":root");
    Object.keys(theme).forEach((key) => {
      r?.style.setProperty(`--${key}`, theme[key as keyof Theme]);
    });
    // eslint-disable-next-line
  }, []);

  return <div className="ks-widget">Widget</div>;
}
