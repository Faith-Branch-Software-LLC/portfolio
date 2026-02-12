// TypeScript definitions for GSAP OffsetPath Plugin

import type { JoinType, EndType } from '../wasm/clipper-offset/pkg/clipper_offset';

export interface OffsetPathOptions {
  offset: number;
  joinType?: JoinType;
  endType?: EndType;
  miterLimit?: number;
  arcTolerance?: number;
  originX?: number;  // 0.0-1.0, default 0.5 (center)
  originY?: number;  // 0.0-1.0, default 0.5 (center)
}

// Extend GSAP's TweenVars interface to include offsetPath property
declare module 'gsap' {
  interface TweenVars {
    offsetPath?: OffsetPathOptions | number;
  }
}
