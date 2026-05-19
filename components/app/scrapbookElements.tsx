import { CSSProperties, ReactNode } from "react";
import { Link } from "next-transition-router";

const C = {
  red: "#D7263D",
  teal: "#1B998B",
  purple: "#2E294E",
  orange: "#F46036",
  olive: "#C5D86D",
};

export { C as ScrapColors };

export enum TapeColor {
  Purple = "rgba(46,41,78,0.8)",
  Teal   = "rgba(27,153,139,0.8)",
  Red    = "rgba(215,38,61,0.85)",
  Orange = "rgba(244,96,54,0.8)",
}

interface PaperProps {
  rot?: number;
  color?: string;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Paper({ rot = 0, color = "#f3ead4", children, style, className }: PaperProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        background: color,
        padding: "36px 42px 40px",
        transform: `rotate(${rot}deg)`,
        boxShadow: "8px 8px 0 0 rgba(0,0,0,0.25)",
        color: "#1a1410",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface TapeProps {
  rot?: number;
  color?: string;
  width?: number;
  top?: number;
  left?: string;
}

export function Tape({ rot = -8, color = "rgba(244,96,54,0.7)", width = 90, top = -14, left = "50%" }: TapeProps) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        height: 22,
        background: color,
        transform: `translateX(-50%) rotate(${rot}deg)`,
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 4px, transparent 4px 9px)",
        pointerEvents: "none",
      }}
    />
  );
}

interface HandProps {
  children: ReactNode;
  color?: string;
  size?: number;
  rot?: number;
  style?: CSSProperties;
  className?: string;
  href?: string;
}

export function Hand({ children, color = C.red, size = 26, rot = -4, style, className, href }: HandProps) {
  const shared: CSSProperties = {
    fontFamily: "'Send Flowers', cursive",
    color,
    fontSize: size,
    display: "inline-block",
    transform: `rotate(${rot}deg)`,
    lineHeight: 1.2,
    ...style,
  };
  if (href) {
    return (
      <Link href={href} style={{ ...shared, textDecoration: "underline", textUnderlineOffset: 3 }} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <span style={shared} className={className}>
      {children}
    </span>
  );
}

export interface StickyNoteProps {
  rot?: number;
  paperColor?: string;
  tapeColor?: TapeColor;
  tapeRot?: number;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function StickyNote({
  rot = 0,
  paperColor = "#f3ead4",
  tapeColor = TapeColor.Purple,
  tapeRot,
  children,
  style,
  className,
}: StickyNoteProps) {
  const defaultTapeRot = rot < 0 ? -6 : 8;
  return (
    <Paper rot={rot} color={paperColor} style={style} className={className}>
      <Tape rot={tapeRot ?? defaultTapeRot} color={tapeColor} />
      {children}
    </Paper>
  );
}

interface HighlightProps {
  children: ReactNode;
  color?: string;
}

export function Highlight({ children, color = "rgba(197,216,109,0.65)" }: HighlightProps) {
  return (
    <span
      style={{
        background: `linear-gradient(transparent 55%, ${color} 55%, ${color} 88%, transparent 88%)`,
        padding: "0 2px",
      }}
    >
      {children}
    </span>
  );
}
