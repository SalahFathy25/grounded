import { useLang } from '../context/LangContext'
import Reveal from '../components/Reveal'

export default function Terms() {
  const { t } = useLang()

  const sections = [
    { h: t('terms.h1'), p: t('terms.p1') },
    { h: t('terms.h2'), p: t('terms.p2') },
    { h: t('terms.h3'), p: t('terms.p3') },
    { h: t('terms.h4'), p: t('terms.p4') },
  ]

  return (
    <section className="bg-paper text-ink">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <Reveal>
          <span className="chip">{t('terms.title')}</span>
          <h1 className="font-display mt-5 text-4xl uppercase leading-tight sm:text-6xl">
            {t('terms.title')}
          </h1>
          <p className="mt-4 text-sm text-ink/50">{t('terms.updated')}</p>
          <p className="mt-6 text-lg leading-relaxed text-ink/80">{t('terms.intro')}</p>
        </Reveal>

        <div className="mt-12 space-y-9">
          {sections.map((s, i) => (
            <Reveal key={s.h} delay={i * 80}>
              <h2 className="font-display text-xl uppercase sm:text-2xl">{s.h}</h2>
              <p className="mt-2 leading-relaxed text-ink/75">{s.p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}