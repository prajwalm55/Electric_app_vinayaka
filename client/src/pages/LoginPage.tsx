import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/common/Logo'

export function LoginPage() {
  const { ready, isAuthenticated, login } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 relative overflow-hidden">
        <LoginBackground />
        <Logo size="lg" className="mx-auto drop-shadow-md" />
        <p className="relative z-10 text-white/80 text-sm">Loading...</p>
      </div>
    )
  }

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const success = await login(password)
    if (!success) setError('Invalid password. Try: veew2026')
    setLoading(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
      <LoginBackground />

      <div className="relative z-10 w-full max-w-[340px] flex flex-col items-center">
        <Logo size="lg" className="mx-auto mb-5 drop-shadow-md" />

        {/* Glassmorphism card — matches reference layout */}
        <div className="login-glass w-full rounded-[26px] border border-white/40 px-8 py-10">
          <h1 className="text-center text-white text-[30px] font-semibold tracking-wide mb-9 drop-shadow-sm">
            Login
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="relative block">
              <span className="sr-only">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
                className="login-field w-full h-[48px] rounded-full pl-5 pr-12 text-white placeholder:text-white/80 text-[15px] outline-none"
              />
              <Lock
                className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white pointer-events-none"
                strokeWidth={1.75}
              />
            </label>

            {error && (
              <p className="text-amber-100 text-xs text-center bg-black/25 rounded-full py-2 px-3 border border-white/10">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] rounded-full bg-white text-[#4b1d7c] text-[16px] font-semibold tracking-wide shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:bg-white/95 active:scale-[0.99] transition disabled:opacity-70"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function LoginBackground() {
  return (
    <div className="absolute inset-0" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #4e2678 0%, #6d3498 16%, #8f47b8 34%, #7a3aa8 52%, #4f2378 72%, #2a1045 100%)',
        }}
      />

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.r * 2,
              height: s.r * 2,
              opacity: s.o,
            }}
          />
        ))}
        {SPARKLES.map((s, i) => (
          <span
            key={`sp-${i}`}
            className="absolute text-white leading-none select-none"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              fontSize: s.sz,
              opacity: 0.9,
              textShadow: '0 0 8px rgba(255,255,255,0.85)',
              transform: 'translate(-50%, -50%)',
            }}
          >
            ✦
          </span>
        ))}
      </div>

      {/* Distant mountains */}
      <svg
        className="absolute bottom-[22%] left-0 w-full h-[38%]"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
      >
        <path
          fill="#7a3aab"
          opacity="0.7"
          d="M0 400V250L160 200 300 270 460 130 620 240 780 80 960 220 1120 150 1280 240 1440 190V400Z"
        />
        <path
          fill="#5c2888"
          opacity="0.85"
          d="M0 400V290L200 240 380 310 560 190 760 290 980 160 1180 280 1380 210 1440 260V400Z"
        />
      </svg>

      {/* Dense pine forest */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[42%]"
        viewBox="0 0 1440 420"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="pine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3c1762" />
            <stop offset="100%" stopColor="#16082a" />
          </linearGradient>
        </defs>
        {PINES.map((t, i) => (
          <g key={i} transform={`translate(${t.x},${t.y}) scale(${t.s})`}>
            <polygon fill="url(#pine)" points="50,240 0,240 50,40 100,240" />
            <polygon fill="url(#pine)" points="50,200 12,200 50,10 88,200" opacity="0.95" />
            <polygon fill="#2a1048" points="50,160 22,160 50,-10 78,160" />
            <rect x="46" y="230" width="8" height="40" fill="#12051f" />
          </g>
        ))}
        <path fill="#12051f" d="M0 340 Q240 300 480 330 T960 320 T1440 340 V420 H0Z" />
      </svg>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(18,5,40,0.4) 100%)',
        }}
      />
    </div>
  )
}

const STARS = [
  { x: 6, y: 8, r: 1.5, o: 0.85 },
  { x: 12, y: 18, r: 1.1, o: 0.65 },
  { x: 18, y: 5, r: 1.8, o: 0.95 },
  { x: 24, y: 22, r: 1, o: 0.55 },
  { x: 31, y: 11, r: 1.4, o: 0.8 },
  { x: 38, y: 19, r: 1.1, o: 0.6 },
  { x: 45, y: 6, r: 1.6, o: 0.9 },
  { x: 52, y: 15, r: 1, o: 0.7 },
  { x: 59, y: 9, r: 1.5, o: 0.85 },
  { x: 66, y: 20, r: 1.1, o: 0.6 },
  { x: 73, y: 4, r: 1.8, o: 0.95 },
  { x: 80, y: 14, r: 1.2, o: 0.75 },
  { x: 87, y: 8, r: 1.4, o: 0.85 },
  { x: 93, y: 17, r: 1, o: 0.55 },
  { x: 9, y: 28, r: 1, o: 0.45 },
  { x: 55, y: 25, r: 1.1, o: 0.5 },
  { x: 91, y: 26, r: 1, o: 0.45 },
  { x: 42, y: 28, r: 0.9, o: 0.4 },
]

const SPARKLES = [
  { x: 17, y: 10, sz: 14 },
  { x: 71, y: 6, sz: 16 },
  { x: 48, y: 3, sz: 12 },
  { x: 86, y: 12, sz: 13 },
]

const PINES = Array.from({ length: 28 }, (_, i) => ({
  x: -40 + i * 55 + (i % 3) * 8,
  y: 40 + (i % 4) * 28 + (i % 2) * 12,
  s: 0.85 + (i % 5) * 0.18,
}))
