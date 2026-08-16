import { useLang } from '../context/LangContext'
import Reveal from '../components/Reveal'

export default function Privacy() {
  const { t } = useLang()

  const sections = [
    { h: t('privacy.h1'), p: t('privacy.p1') },
    { h: t('privacy.h2'), p: t('privacy.p2') },
    { h: t('privacy.h3'), p: t('privacy.p3') },
    { h: t('privacy.h4'), p: t('privacy.p4') },
  ]

  return (
    <section className="bg-paper text-ink">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <Reveal>
          <span className="chip">{t('privacy.title')}</span>
          <h1 className="font-display mt-5 text-4xl uppercase leading-tight sm:text-6xl">
            {t('privacy.title')}
          </h1>
          <p className="mt-4 text-sm text-ink/50">{t('privacy.updated')}</p>
          <p className="mt-6 text-lg leading-relaxed text-ink/80">{t('privacy.intro')}</p>
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