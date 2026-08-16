import { Shield, Timer, Wallet } from 'lucide-react'
import { useLang } from '../context/LangContext'
import { useContent, pick } from '../context/ContentContext'
import Reveal from '../components/Reveal'

const VALUE_ICONS = [Wallet, Shield, Timer]

export default function About() {
  const { t } = useLang()
  const { content } = useContent()
  const { lang } = useLang()

  const values = content.values.map((v, i) => ({
    icon: VALUE_ICONS[i % VALUE_ICONS.length],
    title: pick(v.title, lang),
    desc: pick(v.desc, lang),
  }))

  return (
    <section className="bg-paper text-ink">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <Reveal>
          <span className="chip">{t('about.pageTag')}</span>
          <h1 className="font-display mt-5 text-4xl uppercase leading-tight sm:text-6xl">
            {t('about.pageTitle')}
          </h1>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink/80">
            <p>{t('about.pageText1')}</p>
            <p className="border-s-4 border-gold ps-4 text-ink/70">{t('about.pageText2')}</p>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-16">
            <h2 className="font-display text-2xl uppercase sm:text-3xl">{t('about.valuesTag')}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {values.map(v => (
                <div key={v.title} className="card p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-gold/10 text-gold-bright">
                    <v.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-bold">{v.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}