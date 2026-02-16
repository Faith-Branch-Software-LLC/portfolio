"use client"

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { TransitionRouter } from 'next-transition-router'
import { generateVerticalSpikePath } from '@/lib/utils'
import { useLayout } from '@/lib/context/layoutContext'
import dynamic from 'next/dynamic'
const SpinnerAnimation = dynamic(() => import('@/components/ui/SpinnerAnimation'), { ssr: false })

const THEME_COLORS = ['#D7263D', '#1B998B', '#2E294E', '#F46036', '#C5D86D']
const LAYER_COUNT = 3
const STAGGER = 0.15

function pickColors(count: number): string[] {
  const shuffled = [...THEME_COLORS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: '-10vw',
  width: '120vw',
  height: '100vh',
  zIndex: 9999,
  pointerEvents: 'none',
}

export default function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const blockerRef = useRef<HTMLDivElement>(null)
  const spinnerRef = useRef<HTMLDivElement>(null)
  const [spinnerColor, setSpinnerColor] = useState('#ffffff')
  const { resetLayout } = useLayout()

  return (
    <TransitionRouter
      auto={false}
      leave={(next) => {
        resetLayout()
        const colors = pickColors(LAYER_COUNT)
        const layers = layerRefs.current.filter(Boolean) as HTMLDivElement[]

        if (blockerRef.current) blockerRef.current.style.pointerEvents = 'auto'

        // Pick spinner color that contrasts with the topmost layer
        setSpinnerColor(getContrastColor(colors[LAYER_COUNT - 1]))

        layers.forEach((el, i) => {
          el.style.backgroundColor = colors[i]
          el.style.clipPath = generateVerticalSpikePath(15, 5, 1.5)
          el.style.zIndex = `${9997 + i}`
        })

        const tl = gsap.timeline({ onComplete: next })
        layers.forEach((el, i) => {
          tl.fromTo(el, { xPercent: -100 }, {
            xPercent: 0, duration: 0.4, ease: "power2.inOut",
          }, i * STAGGER)
        })

        // After layers sweep in, fade in spinner
        tl.to(spinnerRef.current, { opacity: 1, duration: 0.3 }, (LAYER_COUNT + 1) * STAGGER)

        return () => { tl.kill() }
      }}
      enter={(next) => {
        const layers = layerRefs.current.filter(Boolean) as HTMLDivElement[]

        // Fade out spinner
        if (spinnerRef.current) gsap.to(spinnerRef.current, { opacity: 0, duration: 0.2 })

        layers.forEach((el, i) => {
          el.style.zIndex = `${9999 - i}`
        })

        const tl = gsap.timeline({
          onComplete: () => {
            if (blockerRef.current) blockerRef.current.style.pointerEvents = 'none'
            next()
          }
        })
        layers.forEach((el, i) => {
          tl.fromTo(el, { xPercent: 0 }, {
            xPercent: 100, duration: 0.4, ease: "power2.inOut",
          }, i * STAGGER)
        })

        return () => tl.kill()
      }}
    >
      {children}
      {Array.from({ length: LAYER_COUNT }, (_, i) => (
        <div
          key={i}
          ref={(el) => { layerRefs.current[i] = el }}
          style={{ ...overlayStyle, zIndex: 9999 - i }}
        />
      ))}
      <div
        ref={blockerRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          pointerEvents: 'none',
        }}
      >
        <div
          ref={spinnerRef}
          style={{
            position: 'absolute',
            bottom: 100,
            right: 100,
            opacity: 0,
          }}
        >
          <SpinnerAnimation color={spinnerColor} size={150} />
        </div>
      </div>
    </TransitionRouter>
  )
}
