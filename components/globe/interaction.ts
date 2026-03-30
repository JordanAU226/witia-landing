import * as THREE from 'three'

export interface InteractionController {
  update(): void
  dispose(): void
}

export function createInteractionController(
  group: THREE.Group,
  canvas: HTMLCanvasElement,
): InteractionController {
  // State
  let isHovering = false
  let isDragging = false

  // Rotation velocities (applied per frame)
  let velX = 0
  let velY = 0

  // Target yaw drift speed
  const DRIFT_IDLE  = 0.00040
  const DRIFT_HOVER = 0.00018

  // Smoothed drag delta
  let smoothDX = 0
  let smoothDY = 0

  // Last pointer coords
  let lastX = 0
  let lastY = 0

  // ── Pointer events ────────────────────────────────────────────────────────

  function onPointerEnter() {
    isHovering = true
  }

  function onPointerLeave() {
    isHovering = false
    isDragging = false
    smoothDX = 0
    smoothDY = 0
  }

  function onPointerDown(e: PointerEvent) {
    isDragging = true
    lastX = e.clientX
    lastY = e.clientY
    canvas.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY

    smoothDX += (dx - smoothDX) * 0.35
    smoothDY += (dy - smoothDY) * 0.35

    velY = smoothDX * 0.0025
    velX = smoothDY * 0.0025
  }

  function onPointerUp() {
    isDragging = false
  }

  // ── Touch events ──────────────────────────────────────────────────────────

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      isDragging = true
      lastX = e.touches[0].clientX
      lastY = e.touches[0].clientY
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!isDragging || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - lastX
    const dy = e.touches[0].clientY - lastY
    lastX = e.touches[0].clientX
    lastY = e.touches[0].clientY

    smoothDX += (dx - smoothDX) * 0.35
    smoothDY += (dy - smoothDY) * 0.35

    velY = smoothDX * 0.0025
    velX = smoothDY * 0.0025
  }

  function onTouchEnd() {
    isDragging = false
  }

  canvas.addEventListener('pointerenter', onPointerEnter)
  canvas.addEventListener('pointerleave', onPointerLeave)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('touchstart', onTouchStart, { passive: true })
  canvas.addEventListener('touchmove', onTouchMove, { passive: true })
  canvas.addEventListener('touchend', onTouchEnd)

  // ── Update (called each frame) ────────────────────────────────────────────

  function update() {
    if (isDragging) {
      // Drag: apply velocity with friction
      group.rotation.y += velY
      group.rotation.x += velX
      // Clamp vertical tilt
      group.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, group.rotation.x))
      // Friction decay
      velX *= 0.88
      velY *= 0.88
    } else {
      // Auto-drift
      const drift = isHovering ? DRIFT_HOVER : DRIFT_IDLE
      // Lerp current yaw rate toward drift
      velY += (drift - velY) * 0.04
      velX += (0 - velX) * 0.05
      group.rotation.y += velY
      group.rotation.x += velX
      group.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, group.rotation.x))
    }
  }

  function dispose() {
    canvas.removeEventListener('pointerenter', onPointerEnter)
    canvas.removeEventListener('pointerleave', onPointerLeave)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)
  }

  return { update, dispose }
}
