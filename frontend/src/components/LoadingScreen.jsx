import { useState, useEffect } from 'react'
import { Dumbbell } from 'lucide-react'

const MESSAGES = [
  { text: "Your personal trainer is working out for you", sub: "while you chill :)" },
  { text: "Crunching the numbers", sub: "so you can crunch your abs" },
  { text: "Searching the best exercises", sub: "from our database of thousands" },
  { text: "Crafting your perfect meal plan", sub: "calories in, gains out" },
  { text: "Fine-tuning your workout splits", sub: "every rep counts" },
  { text: "Balancing your macros", sub: "protein, carbs, fats — sorted" },
  { text: "Warming up the AI brain", sub: "it's leg day for the algorithm" },
  { text: "Picking the right weights for you", sub: "no ego lifting here" },
  { text: "Almost there", sub: "good things take a little time" },
]

export default function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length)
    }, 4000)
    return () => clearInterval(msgTimer)
  }, [])

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 500)
    return () => clearInterval(dotTimer)
  }, [])

  const msg = MESSAGES[msgIndex]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 32px',
    }}>
      {/* Animated logo */}
      <div style={{
        width: 96, height: 96, borderRadius: 24,
        background: 'linear-gradient(135deg, var(--green-primary), var(--green-dark))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 48,
        boxShadow: '0 8px 40px var(--green-glow-strong)',
        animation: 'breathe 2s ease-in-out infinite',
      }}>
        <Dumbbell size={48} color="#0a1929" strokeWidth={2.5} className="spin-slow" />
      </div>

      {/* Message */}
      <div style={{ textAlign: 'center', minHeight: 80 }} key={msgIndex} className="fade-in">
        <h2 style={{
          fontSize: 22, fontWeight: 700, lineHeight: 1.4,
          marginBottom: 8, letterSpacing: -0.3,
        }}>
          {msg.text}{dots}
        </h2>
        <p style={{
          fontSize: 15, color: 'var(--green-primary)',
          fontWeight: 500, fontStyle: 'italic',
        }}>
          {msg.sub}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%', maxWidth: 280, marginTop: 48,
      }}>
        <div style={{
          height: 4, borderRadius: 2,
          background: 'var(--bg-card)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: 'linear-gradient(90deg, var(--green-primary), var(--green-dark))',
            animation: 'shimmer 2s ease-in-out infinite',
          }} />
        </div>
        <p style={{
          fontSize: 12, color: 'var(--text-muted)',
          textAlign: 'center', marginTop: 12,
        }}>
          This usually takes 3–4 minutes
        </p>
      </div>

      <style>{`
        .spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes shimmer {
          0% { width: 5%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 5%; margin-left: 95%; }
        }
      `}</style>
    </div>
  )
}
