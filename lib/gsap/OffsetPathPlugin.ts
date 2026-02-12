import { gsap } from "gsap";
import type { OffsetPathOptions } from "@/types/gsap-offset";

// WASM module type (dynamically imported)
type ClipperOffsetModule = typeof import("@/public/wasm/clipper_offset");

// Module state
let wasmModule: ClipperOffsetModule | null = null;
let wasmInitialized = false;
let wasmInitPromise: Promise<void> | null = null;

/**
 * Initialize the WASM module
 * Can be called multiple times safely (idempotent)
 */
export async function initWasm(): Promise<void> {
  if (wasmInitialized) return;
  if (wasmInitPromise) return wasmInitPromise;

  wasmInitPromise = (async () => {
    try {
      // Dynamic import of WASM module
      const module = await import("@/public/wasm/clipper_offset.js");

      // Initialize WASM with the .wasm file
      await module.default("/wasm/clipper_offset_bg.wasm");

      wasmModule = module;
      wasmInitialized = true;
      console.log("[OffsetPathPlugin] WASM module loaded successfully");
    } catch (error) {
      console.error("[OffsetPathPlugin] Failed to load WASM:", error);
      throw error;
    }
  })();

  return wasmInitPromise;
}

/**
 * GSAP OffsetPath Plugin
 * Animates SVG path offsetting using Clipper2 WASM
 */
export const OffsetPathPlugin: gsap.Plugin = {
  name: "offsetPath",
  version: "1.0.0",

  init(target: any, value: OffsetPathOptions | number, tween: any) {
    // Validate target is SVGPathElement
    if (!(target instanceof SVGPathElement)) {
      console.warn(
        "[OffsetPathPlugin] Target must be SVGPathElement, got:",
        target
      );
      return false;
    }

    // Store original path data
    const originalPath = target.getAttribute("d");
    if (!originalPath) {
      console.warn(
        "[OffsetPathPlugin] Path element has no 'd' attribute"
      );
      return false;
    }

    // Parse options
    let options: OffsetPathOptions;
    if (typeof value === "number") {
      options = { offset: value };
    } else {
      options = { ...value };
    }

    // Store plugin state
    (this as any)._target = target;
    (this as any)._originalPath = originalPath;
    (this as any)._options = {
      joinType: options.joinType ?? 2, // Round (default)
      endType: options.endType ?? 0,   // Polygon (default)
      miterLimit: options.miterLimit ?? 2.0,
      arcTolerance: options.arcTolerance ?? 0.25,
      originX: options.originX ?? 0.5,
      originY: options.originY ?? 0.5,
    };

    // Read current offset from TARGET element (shared across tween instances)
    // This allows chaining: gsap.set(el, {offsetPath: -50}) → gsap.to(el, {offsetPath: 0})
    (this as any)._startOffset = (target as any).__gsapOffsetPath ?? 0;
    (this as any)._endOffset = options.offset;

    return true;
  },

  render(progress: number, data: any) {
    // Compute interpolated offset manually (bypasses unreliable this.add())
    const offsetAmount = data._startOffset + (data._endOffset - data._startOffset) * progress;

    // Always track current offset on target for tween chaining
    (data._target as any).__gsapOffsetPath = offsetAmount;

    // Check if WASM is initialized
    if (!wasmInitialized || !wasmModule) {
      if (progress === 0 || Math.abs(progress) < 0.001) {
        console.warn(
          "[OffsetPathPlugin] WASM not initialized, animation will not render. " +
          "Ensure initWasm() completes before starting animations."
        );
      }
      return;
    }

    try {
      // Log first render for debugging
      if (progress === 0 || Math.abs(progress) < 0.001) {
        console.log(`[OffsetPathPlugin] Starting offset animation: ${offsetAmount.toFixed(2)} (${data._startOffset} → ${data._endOffset})`);
      }

      // Skip if offset is effectively zero (return to original path)
      if (Math.abs(offsetAmount) < 0.001) {
        data._target.style.visibility = "visible";
        data._target.setAttribute("d", data._originalPath);
        return;
      }

      // Call WASM function
      const result = wasmModule.offset_svg_path(
        data._originalPath,
        offsetAmount,
        data._options.joinType,
        data._options.endType,
        data._options.miterLimit,
        data._options.arcTolerance,
        data._options.originX,
        data._options.originY
      );

      // Empty result means path deflated to nothing — hide the element
      if (!result || result.trim() === "") {
        data._target.style.visibility = "hidden";
        return;
      }

      // Show element and update path
      data._target.style.visibility = "visible";
      data._target.setAttribute("d", result);
    } catch (error) {
      console.error("[OffsetPathPlugin] Error during render:", error);
      data._target.style.visibility = "hidden";
    }
  },

  kill(property?: string) {
    // Restore original path when animation is killed
    const data = this as any;
    if (data._target && data._originalPath) {
      data._target.setAttribute("d", data._originalPath);
    }
  },
};

// Auto-initialize WASM on module load (client-side only)
if (typeof window !== "undefined") {
  initWasm().catch((error) => {
    console.warn(
      "[OffsetPathPlugin] WASM initialization failed, plugin will be disabled:",
      error
    );
  });

  // Register plugin with GSAP
  gsap.registerPlugin(OffsetPathPlugin);
}
