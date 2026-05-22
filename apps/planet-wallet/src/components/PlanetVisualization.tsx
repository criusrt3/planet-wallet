import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import {
  getPlanetBubbleTip,
  laneLabelToBubbleId,
  pickRandomPlanetTip,
  type PlanetBubbleId,
  type PlanetBubbleTip,
  type PlanetBubbleVariant,
} from '@/lib/planet-tips'
import { taskPath } from '@/lib/task-path'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'

const ORBIT_LANES = [
  { label: 'ETH', color: '#627EEA', radius: 58, duration: 16 },
  { label: '安全', color: 'var(--primary)', radius: 70, duration: 19 },
  { label: '任务', color: 'var(--brand-secondary)', radius: 82, duration: 22 },
  { label: '资产', color: 'var(--primary-hover)', radius: 94, duration: 26 },
] as const

const RING_RADII = [52, 64, 76, 88] as const

const BUBBLE_VARIANT_CLASS: Record<PlanetBubbleVariant, string> = {
  info: 'planet-tip-bubble--info',
  warning: 'planet-tip-bubble--warning',
  success: 'planet-tip-bubble--success',
}

const PINNED_AUTO_CLOSE_MS = 1500
const EPHEMERAL_AUTO_CLOSE_MS = 1500

interface PlanetVisualizationProps {
  pulse?: boolean
  interactive?: boolean
  title?: string
  subtitle?: string
}

export function PlanetVisualization({
  pulse,
  interactive = false,
  title,
  subtitle,
}: PlanetVisualizationProps) {
  const { completedTasks, shieldLevel } = useWallet()
  const stageRef = useRef<HTMLElement>(null)
  const ephemeralTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pinnedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeBubble, setActiveBubble] = useState<PlanetBubbleId | null>(null)
  const [ephemeralTip, setEphemeralTip] = useState<PlanetBubbleTip | null>(null)

  const showFooter = Boolean(title || subtitle)

  const clearEphemeral = useCallback(() => {
    if (ephemeralTimerRef.current) {
      clearTimeout(ephemeralTimerRef.current)
      ephemeralTimerRef.current = null
    }
    setEphemeralTip(null)
  }, [])

  const clearPinnedTimer = useCallback(() => {
    if (pinnedTimerRef.current) {
      clearTimeout(pinnedTimerRef.current)
      pinnedTimerRef.current = null
    }
  }, [])

  const closePinnedBubble = useCallback(() => {
    clearPinnedTimer()
    setActiveBubble(null)
  }, [clearPinnedTimer])

  const showRandomTip = useCallback(() => {
    clearEphemeral()
    const tip = pickRandomPlanetTip({ completedTasks, shieldLevel })
    setEphemeralTip(tip)
    ephemeralTimerRef.current = setTimeout(() => {
      setEphemeralTip(null)
      ephemeralTimerRef.current = null
    }, EPHEMERAL_AUTO_CLOSE_MS)
  }, [completedTasks, shieldLevel, clearEphemeral])

  const openBubble = useCallback(
    (id: PlanetBubbleId) => {
      clearEphemeral()
      setActiveBubble((prev) => (prev === id ? null : id))
    },
    [clearEphemeral],
  )

  useEffect(() => {
    return () => {
      clearEphemeral()
      clearPinnedTimer()
    }
  }, [clearEphemeral, clearPinnedTimer])

  useEffect(() => {
    if (!interactive || !activeBubble || ephemeralTip) {
      clearPinnedTimer()
      return
    }
    clearPinnedTimer()
    pinnedTimerRef.current = setTimeout(() => {
      setActiveBubble(null)
      pinnedTimerRef.current = null
    }, PINNED_AUTO_CLOSE_MS)
    return () => clearPinnedTimer()
  }, [activeBubble, ephemeralTip, interactive, clearPinnedTimer])

  useEffect(() => {
    if (!interactive || (!activeBubble && !ephemeralTip)) return
    function onPointerDown(e: PointerEvent) {
      const el = stageRef.current
      if (el && !el.contains(e.target as Node)) {
        closePinnedBubble()
        clearEphemeral()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [interactive, activeBubble, ephemeralTip, clearEphemeral, closePinnedBubble])

  const pinnedTip =
    interactive && activeBubble
      ? getPlanetBubbleTip(activeBubble, { completedTasks, shieldLevel })
      : null

  const displayTip = ephemeralTip ?? pinnedTip
  const isEphemeral = Boolean(ephemeralTip)

  function handleCanvasBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive) return
    const target = e.target as HTMLElement
    if (target.closest('button, .planet-tip-bubble, a')) return
    showRandomTip()
  }

  return (
    <section
      ref={stageRef}
      className={`planet-orbit-stage ${interactive ? 'planet-orbit-stage--interactive' : ''}`}
      aria-label={title ? `${title} 的星球钱包` : '星球钱包可视化'}
    >
      {interactive && displayTip ? (
        <div
          className={`planet-tip-bubble ${BUBBLE_VARIANT_CLASS[displayTip.variant]} ${isEphemeral ? 'planet-tip-bubble--ephemeral' : ''}`}
          role="status"
          aria-live="polite"
        >
          <div className="planet-tip-bubble__head">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-secondary" aria-hidden />
            <p className="planet-tip-bubble__title">{displayTip.title}</p>
            {!isEphemeral ? (
              <button
                type="button"
                className="planet-tip-bubble__close"
                aria-label="关闭提示"
                onClick={closePinnedBubble}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <p className="planet-tip-bubble__body">{displayTip.body}</p>
          {isEphemeral ? (
            <div className="planet-tip-bubble__progress" aria-hidden>
              <div
                className="planet-tip-bubble__progress-bar"
                style={{ animationDuration: `${EPHEMERAL_AUTO_CLOSE_MS}ms` }}
              />
            </div>
          ) : null}
          {!isEphemeral && displayTip.ctaLabel && (displayTip.href || displayTip.taskId) ? (
            <Button variant="outline" size="sm" className="mt-2 h-8 w-full text-xs" asChild>
              <Link
                to={displayTip.href ?? taskPath(displayTip.taskId!)}
                onClick={closePinnedBubble}
              >
                {displayTip.ctaLabel}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      <div
        className={`planet-orbit-canvas ${displayTip ? 'planet-orbit-canvas--dimmed' : ''}`}
        onClick={interactive ? handleCanvasBackdropClick : undefined}
      >
        <div className="planet-orbit-stars pointer-events-none" aria-hidden />
        <div className="planet-orbit-nebula pointer-events-none" aria-hidden />

        {RING_RADII.map((r) => (
          <div
            key={r}
            className="planet-orbit-ring pointer-events-none absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: r * 2,
              height: r * 2,
              marginLeft: -r,
              marginTop: -r,
            }}
          />
        ))}

        <div className="planet-scene-glow pointer-events-none absolute inset-6 rounded-full" />

        {ORBIT_LANES.map((lane, i) => {
          const bubbleId = laneLabelToBubbleId(lane.label)
          const isActive = activeBubble === bubbleId && !isEphemeral

          return (
            <div
              key={lane.label}
              className={`absolute left-1/2 top-1/2 size-0 ${interactive ? 'planet-orbit-lane--interactive' : ''}`}
              style={{
                ['--orbit-r' as string]: `${lane.radius}px`,
                animation: `orbit ${lane.duration}s linear infinite`,
                animationDelay: `${-i * 2.5}s`,
              }}
            >
              <button
                type="button"
                className={`planet-satellite absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white ${
                  interactive
                    ? 'z-[12] cursor-pointer transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                    : ''
                } ${isActive ? 'planet-satellite--active' : ''}`}
                style={{
                  width: lane.label === 'ETH' ? '2rem' : '1.75rem',
                  height: lane.label === 'ETH' ? '2rem' : '1.75rem',
                  background: lane.color,
                  boxShadow: `0 0 16px color-mix(in srgb, ${lane.color} 55%, transparent)`,
                }}
                aria-label={
                  interactive ? `查看${lane.label}相关安全提示` : undefined
                }
                onClick={
                  interactive && bubbleId
                    ? (e) => {
                        e.stopPropagation()
                        openBubble(bubbleId)
                      }
                    : undefined
                }
              >
                {lane.label}
              </button>
            </div>
          )
        })}

        {interactive ? (
          <button
            type="button"
            className={`planet-core planet-core-surface absolute left-1/2 top-1/2 z-10 flex size-[5.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${pulse ? 'planet-core-pulse' : ''} ${activeBubble === 'core' && !isEphemeral ? 'planet-core--active' : ''}`}
            aria-label="查看护盾与任务安全提示"
            onClick={(e) => {
              e.stopPropagation()
              openBubble('core')
            }}
          >
            <div className="planet-core-halo pointer-events-none absolute inset-[-6px] rounded-full" aria-hidden />
            <span className="relative text-[1.75rem] drop-shadow-sm" aria-hidden>
              🪐
            </span>
          </button>
        ) : (
          <div
            className={`planet-core planet-core-surface absolute left-1/2 top-1/2 z-10 flex size-[5.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${pulse ? 'planet-core-pulse' : ''}`}
          >
            <div className="planet-core-halo pointer-events-none absolute inset-[-6px] rounded-full" aria-hidden />
            <span className="relative text-[1.75rem] drop-shadow-sm" aria-hidden>
              🪐
            </span>
          </div>
        )}
      </div>

      {interactive ? (
        <p className="planet-orbit-hint">点击星球触发安全锦囊</p>
      ) : null}

      {showFooter ? (
        <div className="planet-orbit-footer">
          {title ? <p className="planet-orbit-footer__title">{title}</p> : null}
          {subtitle ? (
            <p className="planet-orbit-footer__subtitle">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
