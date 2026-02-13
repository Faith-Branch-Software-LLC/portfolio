"use client"

import { useRef } from 'react'
import gsap from 'gsap'
import { TransitionRouter } from 'next-transition-router'
import { generateVerticalSpikePath } from '@/lib/utils'

const THEME_COLORS = ['#D7263D', '#1B998B', '#2E294E', '#F46036', '#C5D86D']
const LAYER_COUNT = 3
const STAGGER = 0.15

function pickColors(count: number): string[] {
  const shuffled = [...THEME_COLORS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
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

  return (
    <TransitionRouter
      auto={false}
      leave={(next) => {
        const colors = pickColors(LAYER_COUNT)
        const layers = layerRefs.current.filter(Boolean) as HTMLDivElement[]

        // Block clicks on the page beneath
        if (blockerRef.current) blockerRef.current.style.pointerEvents = 'auto'
        
        layers.forEach((el, i) => {
          el.style.backgroundColor = colors[i]
          el.style.clipPath = generateVerticalSpikePath(15, 5, 1.5)
          // Later layers on top so each one visibly sweeps over the previous
          el.style.zIndex = `${9997 + i}`
        })
        
        const tl = gsap.timeline({ onComplete: next })
        tl.set(spinnerRef.current, {opacity: 0})
        layers.forEach((el, i) => {
          tl.fromTo(el, { xPercent: -100 }, {
            xPercent: 0, duration: 0.4, ease: "power2.inOut",
          }, i * STAGGER)
        })
        tl.to(spinnerRef.current, {opacity: 1}, (LAYER_COUNT+3) * STAGGER)
        
        return () => tl.kill()
      }}
      enter={(next) => {
        const layers = layerRefs.current.filter(Boolean) as HTMLDivElement[]
        
        layers.forEach((el, i) => {
          // Earlier layers on top so each one peels off revealing the next
          el.style.zIndex = `${9999 - i}`
        })
        
        const tl = gsap.timeline({
          onComplete: () => {
            // Re-enable clicks after transition
            if (blockerRef.current) blockerRef.current.style.pointerEvents = 'none'
            next()
          }
        })
        tl.to(spinnerRef.current, {opacity: 0}, 0)
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
      {/* Invisible blocker + loading spinner */}
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
            bottom: 32,
            right: 32,
            width: 50,
            height: 50,
            border: '5px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            opacity: 0
          }}
        />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </TransitionRouter>
  )
}
