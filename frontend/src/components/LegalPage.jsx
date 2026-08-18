import { useLang } from '../context/LangContext'
import Reveal from './Reveal'

const CORNERS = [
  ['start-3 top-3', 'border-s-2 border-t-2'],
  ['end-3 top-3', 'border-e-2 border-t-2'],
  ['start-3 bottom-3', 'border-s-2 border-b-2'],
  ['end-3 bottom-3', 'border-e-2 border-b-2'],
]

export default function LegalPage({ ns }) {
  const { t } = useLang()

  const sections = [1, 2, 3, 4].map(i => ({ h: t(`${ns}.h${i}`), p: t(`${ns}.p${i}`) }))

  return (
    <section className="bg-paper text-ink">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-line bg-paper p-6 sm:p-10">
            {CORNERS.map(([pos, sides]) => (
              <span key={pos} className={`pointer-events-none absolute grid size-4 place-items-center ${pos}`} aria-hidden="true">
                <span className={`block size-2.5 border-ink/25 ${sides}`} style={{ borderStyle: 'solid' }} />
              </span>
            ))}
            <p className="font-display text-xs uppercase tracking-[0.35em] text-muted">
              {t(`${ns}.title`)} <span className="text-gold">·</span> {t('legal.docs')}
            </p>
            <h1 className="font-display mt-4 text-4xl uppercase leading-none tracking-tight sm:text-6xl">
              {t(`${ns}.title`)}
            </h1>
            <div className="mt-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted">
              <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
              {t(`${ns}.updated`)}
            </div>
            <p className="mt-6 max-w-xl leading-relaxed text-ink-soft">{t(`${ns}.intro`)}</p>
            <div className="mt-8 h-px w-full bg-gradient-to-r from-line via-gold/40 to-line" aria-hidden="true" />
          </div>
        </Reveal>

        <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-paper">
          {sections.map((s, i) => (
            <Reveal key={s.h} delay={i * 70}>
              <article className={`group flex gap-5 p-5 transition-colors duration-300 hover:bg-ink/[0.03] sm:gap-7 sm:p-7 ${i > 0 ? 'border-t border-line' : ''}`}>
                <span
                  className="font-display text-3xl leading-none text-gold/70 transition-colors duration-300 group-hover:text-gold sm:text-4xl"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-lg uppercase tracking-tight transition-transform duration-300 group-hover:translate-x-1 sm:text-2xl">{s.h}</h2>
                  <p className="mt-2 leading-relaxed text-ink-soft">{s.p}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <p className="mt-10 text-center font-display text-xs uppercase tracking-[0.45em] text-muted" aria-hidden="true">
            GROUNDED <span className="text-gold">·</span> EST. 2026
          </p>
        </Reveal>
      </div>
    </section>
  )
}