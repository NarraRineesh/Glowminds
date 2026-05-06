import { motion } from 'framer-motion'
import SectionHeader from '@/components/dashboard/SectionHeader'
import '@/styles/cards.css'
import '@/styles/dashboard.css'

const BADGES = [
  { id: 'b1', icon: '📝', name: 'First Application', desc: 'Track your very first application', xp: 25, unlocked: true, tier: 'bronze' },
  { id: 'b2', icon: '🔥', name: 'Week Warrior', desc: '7-day login streak', xp: 50, unlocked: true, tier: 'bronze' },
  { id: 'b3', icon: '👑', name: 'Profile Master', desc: 'Reach 100% profile completion', xp: 100, unlocked: true, tier: 'silver' },
  { id: 'b4', icon: '🎯', name: 'Job Hunter', desc: 'Apply to 25+ matched roles', xp: 100, unlocked: false, tier: 'silver' },
  { id: 'b5', icon: '💼', name: 'Interview Pro', desc: 'Complete 10 mock interviews', xp: 150, unlocked: false, tier: 'silver' },
  { id: 'b6', icon: '🏆', name: 'Offer Champion', desc: 'Receive your first offer', xp: 250, unlocked: false, tier: 'gold' },
  { id: 'b7', icon: '🧠', name: 'Quiz Master', desc: '30-day quiz streak', xp: 200, unlocked: false, tier: 'gold' },
  { id: 'b8', icon: '✉️', name: 'Cover Crafter', desc: 'Generate 10 cover letters', xp: 75, unlocked: false, tier: 'bronze' },
  { id: 'b9', icon: '🔗', name: 'LinkedIn Legend', desc: 'Hit 90+ LinkedIn audit score', xp: 125, unlocked: false, tier: 'silver' },
  { id: 'b10', icon: '💰', name: 'Negotiator', desc: 'Use the salary insights tool 5x', xp: 50, unlocked: false, tier: 'bronze' },
  { id: 'b11', icon: '🚀', name: 'Power User', desc: 'Use 5 tools in a single day', xp: 100, unlocked: false, tier: 'silver' },
  { id: 'b12', icon: '⭐', name: 'Resume Star', desc: 'Resume score above 90', xp: 150, unlocked: false, tier: 'gold' },
]

const TIER_STYLE = {
  bronze: { ring: '#cd7f32', glow: 'rgba(205,127,50,.18)' },
  silver: { ring: '#c0c0c0', glow: 'rgba(192,192,192,.18)' },
  gold: { ring: 'var(--color-gold)', glow: 'rgba(210,153,34,.22)' },
}

export default function BadgesSection() {
  const unlocked = BADGES.filter((b) => b.unlocked)
  const totalXP = unlocked.reduce((s, b) => s + b.xp, 0)
  const pct = Math.round((unlocked.length / BADGES.length) * 100)

  return (
    <>
      <SectionHeader
        badge="Achievements"
        badgeBg="var(--color-gold2)"
        badgeColor="var(--color-gold)"
        title="Earn badges, level up your career"
        accent="level up"
        subtitle="Each badge unlocks XP and shows up on your profile. Some are progressive — keep using Glowminds daily to climb the tiers."
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="kpi k3">
          <div className="kpi-ic">🏆</div>
          <div className="kpi-lbl">Unlocked</div>
          <div className="kpi-val">{unlocked.length}<span className="text-[var(--color-muted)] text-[1rem]">/{BADGES.length}</span></div>
          <div className="kpi-sub">{pct}% complete</div>
        </div>
        <div className="kpi k1">
          <div className="kpi-ic">⚡</div>
          <div className="kpi-lbl">XP from badges</div>
          <div className="kpi-val">{totalXP}</div>
          <div className="kpi-sub">Lifetime</div>
        </div>
        <div className="kpi k4">
          <div className="kpi-ic">🎯</div>
          <div className="kpi-lbl">Next badge</div>
          <div className="kpi-val text-[1.2rem] sm:!text-[1.35rem]">{BADGES.find((b) => !b.unlocked)?.name || 'Done!'}</div>
          <div className="kpi-sub">+{BADGES.find((b) => !b.unlocked)?.xp || 0} XP</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {BADGES.map((b, idx) => {
          const tier = TIER_STYLE[b.tier]
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: idx * 0.03 }}
              whileHover={b.unlocked ? { y: -3 } : {}}
              className={`relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-4 text-center transition-colors ${
                b.unlocked
                  ? 'cursor-pointer border-[var(--color-bdr)] bg-[var(--color-surf)] hover:border-[var(--color-bdr2)]'
                  : 'border-[var(--color-bdr)] bg-[var(--color-bg3)] opacity-60'
              }`}
              title={b.unlocked ? `${b.name} — +${b.xp} XP` : 'Locked'}
            >
              {b.unlocked && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${tier.glow}, transparent 60%)`,
                  }}
                />
              )}

              <div
                className="relative flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                style={{
                  background: b.unlocked ? 'var(--color-surf)' : 'var(--color-bg3)',
                  boxShadow: b.unlocked ? `0 0 0 3px ${tier.ring}55, 0 0 18px ${tier.glow}` : 'none',
                }}
              >
                {b.unlocked ? b.icon : '🔒'}
              </div>

              <div className="relative text-[0.84rem] font-bold leading-tight text-[var(--color-txt)]">
                {b.unlocked ? b.name : '???'}
              </div>
              <div className="relative text-[0.7rem] leading-snug text-[var(--color-txt2)]">
                {b.unlocked ? b.desc : 'Keep going to unlock'}
              </div>
              <div
                className="relative mt-auto rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
                style={{
                  color: b.unlocked ? tier.ring : 'var(--color-muted)',
                  background: b.unlocked ? `${tier.glow}` : 'var(--color-surf2)',
                }}
              >
                {b.tier} · +{b.xp} XP
              </div>
            </motion.div>
          )
        })}
      </div>
    </>
  )
}
