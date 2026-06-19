/**
 * Subtle UI sound effects — creates a premium, tactile feel.
 * Uses Web Audio API for zero-dependency, low-latency sounds.
 * All sounds are optional and gracefully degrade if audio context fails.
 */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try { audioCtx = new AudioContext() } catch { return null }
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.05) {
  const ctx = getCtx()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

function playNoise(duration: number, volume = 0.02) {
  const ctx = getCtx()
  if (!ctx) return

  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5
  }

  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  source.buffer = buffer
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  source.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}

export const sounds = {
  /** Soft click — button press, nav item select */
  click: () => playTone(800, 0.08, 'sine', 0.03),

  /** Subtle pop — modal open, toast appear */
  pop: () => playTone(600, 0.12, 'sine', 0.04),

  /** Success chime — task complete, idea generated */
  success: () => {
    playTone(523, 0.15, 'sine', 0.04)
    setTimeout(() => playTone(659, 0.15, 'sine', 0.04), 100)
    setTimeout(() => playTone(784, 0.2, 'sine', 0.04), 200)
  },

  /** Error buzz — validation fail, API error */
  error: () => playTone(200, 0.2, 'square', 0.03),

  /** Soft whoosh — page transition, swipe */
  whoosh: () => playNoise(0.15, 0.015),

  /** Notification ding — new message, alert */
  notification: () => {
    playTone(880, 0.1, 'sine', 0.03)
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.03), 80)
  },

  /** Hover tick — subtle feedback on hover */
  hover: () => playTone(1200, 0.04, 'sine', 0.015),

  /** Delete swoosh — item removed */
  delete: () => playTone(400, 0.15, 'sawtooth', 0.02),

  /** Celebration — confetti, milestone complete */
  celebrate: () => {
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.04), i * 120)
    })
  },

  /** Typing tick — AI is responding */
  typeTick: () => playTone(1000, 0.02, 'sine', 0.01),
}

// Sound preference — stored in localStorage
let soundEnabled = true

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled
  try { localStorage.setItem('onefoundr_sounds', enabled ? '1' : '0') } catch {}
}

export function getSoundEnabled(): boolean {
  try { return localStorage.getItem('onefoundr_sounds') !== '0' } catch { return true }
}

/** Play a sound if enabled. Safe to call anywhere. */
export function playSound(sound: keyof typeof sounds) {
  if (!soundEnabled) return
  try { sounds[sound]() } catch { /* audio context blocked */ }
}
