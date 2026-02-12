---
title: Building an Animated Logo with Clipper2 and WebAssembly
description: How I built a real-time SVG path offset animation using Rust, WebAssembly, Clipper2, and GSAP for my portfolio's logo
date: 2026-02-11
imageUrl: /images/animation-clipper2-header.png
tags:
  - rust
  - webassembly
  - gsap
  - animation
  - svg
published: "true"
---
# Building an Animated Logo with Clipper2 and WebAssembly

Most logo animations rely on simple transforms — scale, rotate, fade. I wanted something different for my portfolio: a tree that *grows* by having its SVG path geometry inflate in real-time. Not just a scale animation because that takes the whole finished shape into account. A morph didn't work either because the line offsets end up looking super janky. I needed something that felt organic.

This post covers the journey of building that animation, from the initial concept through the technical challenges of compiling Rust to WebAssembly and integrating it with GSAP's animation timeline.

---

## Animation Evolution

<div style="display:grid; grid-template-columns: 30vw 30vw 30vw; row-gap:0; column-gap:1rem;">
    <p style="margin:0"><b>1.</b> Scale from 0 to 1 on both the X and Y axes</p>
    <p style="margin:0"><b>2.</b> Morph between pre-made growth stages and then drawing the branches</p>
    <p style="margin:0"><b>3.</b> Inflate the tree organically using a custom made Clipper2 plugin</p>
    <img src="../images/logo-scale.gif" style="margin:0"/>
    <img src="../images/logo-morph.gif" style="margin:0"/>
    <img src="../images/logo-grow.gif" style="margin:0"/>
</div>

---

## The Concept

My portfolio logo features a olive tree growing out of a git main branch. The animation I envisioned was:

1. The branches draw in with clip-path reveals, because they are fast and technical they can just form.
2. The tree starts to grow out of the main branch. This would ideally grow in a more organic fasion.
3. Leaves and olives pop in with scale animations on the tree.
4. A white shadow fades in at the end to outline the entire logo.

The tricky part is step 2. SVG doesn't have a native "inflate/deflate" operation. CSS `scale` would just make the tree bigger — it wouldn't change the path geometry. What I needed was **polygon offsetting**: taking every edge of the path and moving it inward (deflate) or outward (inflate) by a fixed distance.

---

## Why Clipper2?

[Clipper2](https://github.com/AngusJohnson/Clipper2) is a well-known computational geometry library for polygon clipping and offsetting written in C++ by Angus Johnson. It handles complex paths with curves, self-intersections, and holes. Up to finding this library, I had tried many different svg animation techniques and libraries, unhappy with the result every time. Clipper2 gave me hope again.

I ended up discovering a [Rust port](https://github.com/larsbrubaker/clipper2-rust) that made it a natural fit for compiling to WebAssembly. This port was made by MatterHackers, and included a [web demo](https://larsbrubaker.github.io/clipper2-rust/#/offset) showing exactly what I wanted to happen with my tree.

The key operation is `ClipperOffset::execute(delta)`:
- **Negative delta** = deflate (shrink the path inward)
- **Zero delta** = original path
- **Positive delta** = inflate (expand the path outward)

By animating delta from a large negative value to zero, the tree appears to grow from nothing into its full shape.

---

## Architecture Overview

The system has four layers:

```
Clipper2 (polygon offsetting engine)
    ↓
clipper_offset.wasm (Rust → WebAssembly)
    ↓
OffsetPathPlugin.ts (GSAP plugin)
    ↓
AnimatedLogo.tsx (React component)
```

**React** manages the SVG elements and refs. **GSAP** handles the animation timeline and easing. The **custom GSAP plugin** bridges JavaScript and WebAssembly. **Rust/WASM** does the heavy computation — parsing SVG paths, flattening Bezier curves, running Clipper2, and converting results back to SVG.

---

## The WASM Module

The Rust module handles everything between receiving an SVG path string and returning an offset SVG path string.

### SVG Parsing

SVG paths use commands like `M` (move), `L` (line), `C` (cubic Bezier), and `Z` (close). The tree path is full of cubic Bezier curves:

```
M303.208,677.356 C269.132,594.216 272.255,473.455 333.363,407.127 ...
```

Clipper2 works with integer point arrays, not SVG strings. So the first step is parsing the SVG path into a list of points. I wrote a manual SVG parser that feeds commands into [lyon_path](https://crates.io/crates/lyon_path), which handles curve flattening — converting smooth Bezier curves into sequences of line segments.

### Coordinate Scaling

Clipper2 uses integer coordinates for precision. SVG uses floats. The module scales all coordinates by 1000x going in, and scales back going out:

```rust
let scale = 1000.0;
// SVG float → Clipper2 integer
(point.x as f64 * scale) as i64
// Clipper2 integer → SVG float
point.x as f64 / scale
```

### Winding Order

This was one of the trickier bugs. Clipper2 expects outer paths in counter-clockwise (CCW) winding order. SVG paths are typically clockwise (because SVG's Y-axis points down). The module detects winding direction using the [shoelace formula](https://en.wikipedia.org/wiki/Shoelace_formula) and reverses the path if needed:

```rust
let mut signed_area: f64 = 0.0;
for i in 0..path.len() {
    let j = (i + 1) % path.len();
    signed_area += (path[j].x - path[i].x) as f64
                 * (path[j].y + path[i].y) as f64;
}
if signed_area > 0.0 {
    path.reverse(); // CW → CCW
}
```

Without this fix, Clipper2 silently returned empty results because it interpreted the path as a hole rather than an outer boundary.

### Anchor-Pinned Offsetting

By default, Clipper2's offset shrinks a path toward its center. But I wanted the tree to grow *upward from its base* — the point where it connects to the horizontal bar.

The solution: after Clipper2 computes the offset, calculate bounding boxes of both the original and offset paths, then translate the offset path so a chosen anchor point stays fixed.

```rust
// Anchor at (100%, 10%) of bounding box = bottom-right near the bar
let anchor_x = orig_bbox.max_x;
let anchor_y = orig_bbox.min_y + height * 0.1;

// Same relative position in the offset path
let off_anchor_x = off_bbox.max_x;
let off_anchor_y = off_bbox.min_y + off_height * 0.1;

// Translate to pin the anchor
let dx = anchor_x - off_anchor_x;
let dy = anchor_y - off_anchor_y;
```

This makes the tree appear to grow out of the bar rather than materialize from thin air in the center of the SVG.

---

## The GSAP Plugin

[GSAP](https://gsap.com/) is the animation engine driving the entire logo sequence. To integrate path offsetting, I wrote a custom GSAP plugin called `OffsetPathPlugin`.

### Plugin Structure

```typescript
export const OffsetPathPlugin = {
  name: "offsetPath",

  init(target, value, tween) {
    // Store original path, parse options, read current offset
  },

  render(progress, data) {
    // Interpolate offset, call WASM, update SVG path
  },
};
```

The plugin intercepts `offsetPath` in GSAP's tween vars:

```typescript
// Deflate the tree to nothing
gsap.set(treePathRef, { offsetPath: { offset: -45, originX: 0.1, originY: 1.0 } });

// Animate it growing to full size
gsap.to(treePathRef, { offsetPath: { offset: 0, originX: 0.1, originY: 1.0 }, duration: 2 });
```

### Tween Chaining

One challenge was making `gsap.set()` chain properly with `gsap.to()`. Each tween creates a fresh plugin instance, so state can't live on `this`. The solution was tracking the current offset on the **target element** itself:

```typescript
// In render():
(data._target as any).__gsapOffsetPath = offsetAmount;

// In init():
(this as any)._startOffset = (target as any).__gsapOffsetPath ?? 0;
```

This way, when `gsap.set(el, { offsetPath: -45 })` runs, it stores -45 on the element. When the subsequent `.to(el, { offsetPath: 0 })` starts, it reads -45 as the starting value and animates to 0.

### Graceful Degradation

When the offset is very negative, Clipper2 deflates the path to nothing — there's no geometry left. Rather than throwing an error, the plugin hides the element with `visibility: hidden` and reveals it once the offset produces visible geometry:

```typescript
if (!result || result.trim() === "") {
    data._target.style.visibility = "hidden";
    return;
}
data._target.style.visibility = "visible";
data._target.setAttribute("d", result);
```

---

## Build Pipeline

The WASM module compiles with `wasm-pack` and integrates into the Next.js build:

```json
{
  "wasm:build": "cd wasm/clipper-offset && wasm-pack build --target web --out-dir pkg",
  "wasm:copy": "mkdir -p public/wasm && cp wasm/clipper-offset/pkg/*.wasm wasm/clipper-offset/pkg/*.js public/wasm/",
  "dev": "pnpm run wasm:build && pnpm run wasm:copy && next dev --turbopack"
}
```

The compiled `.wasm` file is ~165KB and loads asynchronously. The plugin initializes WASM before the animation starts, and if it fails to load, the animation simply skips the offset effect — no crash, no broken UI.

---

## Lessons Learned

**Clipper2 is picky about input.** Winding order, path closure, and coordinate precision all matter. Silent failures (empty results with no error) make debugging difficult. Adding extensive console logging from WASM was essential.

**GSAP's plugin API has subtleties.** The `this.add()` method for creating PropTweens didn't behave as expected with custom properties. Manual interpolation using the `progress` parameter was more reliable and easier to reason about.

**WebAssembly is fast enough for animation.** Running Clipper2 on every frame (60 FPS) with a 248-point path works smoothly. The entire offset computation takes less than a millisecond per frame.

**Bounding-box anchoring is simple but effective.** The translate-after-offset approach for pinning an anchor point is easy to implement and produces convincing "growing from a point" animations without modifying the offset algorithm itself.

---

## What's Next

The `OffsetPathPlugin` is a general-purpose GSAP plugin — it works with any SVG path element, not just this logo. Potential future uses include:

- Hover effects that inflate/deflate buttons or icons
- Loading animations with pulsing shapes
- Interactive visualizations where paths respond to user input
- Any animation where you want geometry to change, not just transforms

I would like to release this a full plugin for GSAP in the near future, but I will need to make sure I remove any extra bits from clipper2, before then.
