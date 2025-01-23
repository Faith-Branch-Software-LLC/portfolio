import confetti, { Options, Shape } from 'canvas-confetti'

/**
 * Creates a realistic confetti effect from toast position
 */
export function createConfetti() {
  const themeColors = ['#1B998B', '#F46036', '#C5D86D', '#2E294E']
  const count = 200
  const defaults: Options = {
    origin: { y: 1, x: 0.88 },
    colors: themeColors,
    disableForReducedMotion: true
  }

  function fire() {
    const fire = (particleRatio: number, opts: Options) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      })
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    })

    fire(0.2, {
      spread: 60,
    })

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    })

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    })

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    })
  }

  return { fire }
} 