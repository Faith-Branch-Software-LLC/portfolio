"use client"

import { useRef, useEffect, useCallback } from "react"
import { Link } from "next-transition-router"
import { usePathname } from "next/navigation"
import gsap from "gsap"

interface ScrapNavLinkProps {
  href: string
  children: React.ReactNode
}

export function ScrapNavLink({ href, children }: ScrapNavLinkProps) {
  const pathname = usePathname()
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)

  const paperRef = useRef<HTMLSpanElement>(null)
  const tapeRef = useRef<HTMLSpanElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  // Set initial transform state via GSAP so it owns all transforms
  useEffect(() => {
    const paper = paperRef.current
    const tape = tapeRef.current
    if (!paper || !tape) return

    gsap.set(tape, {
      x: "-50%",
      rotation: -12,
      scaleY: isActive ? 1 : 0,
      opacity: isActive ? 1 : 0,
      transformOrigin: "bottom center",
    })
    gsap.set(paper, {
      rotation: isActive ? -1.5 : -1,
      boxShadow: isActive
        ? "5px 5px 0 0 rgba(0,0,0,0.32)"
        : "2px 2px 0 0 rgba(0,0,0,0.18)",
    })
  }, [isActive])

  const handleMouseEnter = useCallback(() => {
    if (isActive) return
    tlRef.current?.kill()
    tlRef.current = gsap.timeline()
    tlRef.current
      .to(tapeRef.current, {
        scaleY: 1,
        opacity: 1,
        duration: 0.32,
        ease: "back.out(2)",
      }, 0)
      .to(paperRef.current, {
        rotation: -2,
        y: -1,
        boxShadow: "4px 4px 0 0 rgba(0,0,0,0.28)",
        duration: 0.26,
        ease: "back.out(2)",
      }, 0)
  }, [isActive])

  const handleMouseLeave = useCallback(() => {
    if (isActive) return
    tlRef.current?.kill()
    tlRef.current = gsap.timeline()
    tlRef.current
      .to(tapeRef.current, {
        scaleY: 0,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
      }, 0)
      .to(paperRef.current, {
        rotation: -1,
        y: 0,
        boxShadow: "2px 2px 0 0 rgba(0,0,0,0.18)",
        duration: 0.22,
        ease: "power2.in",
      }, 0)
  }, [isActive])

  return (
    <Link href={href}>
      <span
        ref={paperRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "relative",
          display: "inline-block",
          padding: isActive ? "10px 24px" : "8px 20px",
          background: "#f3ead4",
          color: "#1a1410",
          fontFamily: "'Gelasio', serif",
          fontWeight: isActive ? 700 : 500,
          fontSize: 18,
          lineHeight: 1.3,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Orange tape — peels in on hover, always shown when active */}
        <span
          ref={tapeRef}
          aria-hidden
          style={{
            position: "absolute",
            top: -7,
            left: "50%",
            width: 56,
            height: 13,
            background: "rgba(244,96,54,0.85)",
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.22) 0 3px, transparent 3px 7px)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
            pointerEvents: "none",
          }}
        />
        {/* Teal corner tape — active page only */}
        {isActive && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              bottom: -6,
              right: -10,
              width: 28,
              height: 9,
              background: "rgba(27,153,139,0.85)",
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.22) 0 3px, transparent 3px 6px)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
              transform: "rotate(14deg)",
              pointerEvents: "none",
            }}
          />
        )}
        {children}
      </span>
    </Link>
  )
}
