import { useEffect, useState } from 'react'
import {
  ArrowDownUp, Blocks, FileQuestion, LayoutDashboard, ListChecks, Megaphone, MessageSquareQuote,
  Palette, RockingChair, RotateCcw, Save, ScrollText, Server, Sparkles, Trash2, Wand2,
} from 'lucide-react'
import { contentApi } from '../../lib/api'
import { DEFAULT_CONTENT } from '../../lib/mockServer'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'

const TABS = [
  { id: 'hero', icon: Sparkles },
  { id: 'sections', icon: LayoutDashboard },
  { id: 'about', icon: Megaphone },
  { id: 'faq', icon: FileQuestion },
  { id: 'testimonials', icon: MessageSquareQuote },
  { id: 'extras', icon: ListChecks },
  { id: 'footer', icon: ScrollText },
]

const CHIP_ICONS = [
  { value: 'truck', label: 'Truck · شحن' },
  { value: 'phone', label: 'Phone · تليفون' },
  { value: 'shield', label: 'Shield · أمان' },
  { value: 'headset', label: 'Headset · دعم' },
]

function Field({ label, value, onChange, type = 'text', ...rest }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="input" {...rest} />
    </div>
  )
}

function PairLabel({ loc }) {
  return (
    <span className={`mb-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${loc === 'ar' ? 'bg-gold-tint text-gold-deep rtl' : 'bg-ink/5 text-muted'}`}>
      {loc === 'ar' ? 'عربي' : 'EN'}
    </span>
  )
}

function Pair({ pair, setPair, labelEn, labelAr, textarea = false }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <PairLabel loc="en" />
        {textarea
          ? <textarea value={pair.en} onChange={e => setPair('en', e.target.value)} rows="3" className="input resize-y" aria-label={labelEn} />
          : <input value={pair.en} onChange={e => setPair('en', e.target.value)} className="input" aria-label={labelEn} />}
      </div>
      <div>
        <PairLabel loc="ar" />
        {textarea
          ? <textarea value={pair.ar} onChange={e => setPair('ar', e.target.value)} rows="3" className="input resize-y" dir="rtl" aria-label={labelAr} />
          : <input value={pair.ar} onChange={e => setPair('ar', e.target.value)} className="input" dir="rtl" aria-label={labelAr} />}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm font-medium">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="size-4 accent-[color:var(--gold-deep)]"
      />
      {label}
    </label>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="card">
      <div className="mb-4 flex items-center gap-2.5 border-b border-line pb-4">
        <span className="grid size-9 place-items-center rounded-lg bg-gold-tint text-gold-deep" aria-hidden="true">
          <Icon className="size-4" />
        </span>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function ListItem({ title, onRemove, children }) {
  return (
    <div className="rounded-xl border border-line bg-paper/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink-soft">{title}</p>
        {onRemove && (
          <button type="button" onClick={onRemove} className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger/10" aria-label="Remove">
            <Trash2 className="size-3.5" aria-hidden="true" /> x
          </button>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function ImgField({ label, value, onChange, aspect = '4/3' }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <Field label={label} value={value} onChange={onChange} dir="ltr" placeholder="https://…" />
      {value && (
        <div className="w-40">
          <img src={value} alt="" loading="lazy" className="h-24 w-full rounded-lg object-cover ring-1 ring-black/10" />
        </div>
      )}
    </div>
  )
}

export default function AdminCustomize() {
  const { t } = useLang()
  const toast = useToast()
  const [tab, setTab] = useState('hero')
  const [draft, setDraft] = useState(() => structuredClone(DEFAULT_CONTENT))
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const set = (path, value) => setDraft(prev => {
    const next = { ...prev }
    const keys = path.split('.')
    let node = next
    for (let i = 0; i < keys.length - 1; i++) {
      node = node[keys[i]] = Array.isArray(node[keys[i]]) ? [...node[keys[i]]] : { ...node[keys[i]] }
    }
    node[keys[keys.length - 1]] = value
    return next
  })

  const setPair = (pathBase) => (loc, val) => set(`${pathBase}.${loc}`, val)

  const save = async (payload = draft) => {
    setBusy(true)
    try {
      const updated = await contentApi.update(payload)
      setDraft(structuredClone(updated))
      toast(t('admin.customize.saved'), 'success')
    } catch {
      toast(t('admin.customize.saveError'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    if (!window.confirm(t('admin.customize.restoreConfirm'))) return
    await save(structuredClone(JSON.parse(JSON.stringify(DEFAULT_CONTENT))))
  }

  const loadAndSync = async () => {
    try {
      const c = await contentApi.get()
      setDraft(structuredClone(c))
    } catch { /* keep defaults */ }
    setLoaded(true)
  }

  useEffect(() => { loadAndSync() }, [])

  const CHIP_TAB_ICONS = { about: Megaphone, sizeGuide: RockingChair }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.customize.title')}</h1>
          <p className="mt-0.5 text-sm text-muted">{t('admin.customize.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={reset} className="btn btn-ghost btn-sm">
            <RotateCcw className="size-4" aria-hidden="true" /> {t('admin.customize.restore')}
          </button>
          <button type="button" onClick={() => save()} disabled={busy || !loaded} className="btn btn-primary btn-sm">
            <Save className="size-4" aria-hidden="true" />
            {busy ? t('admin.customize.saving') : t('admin.customize.save')}
          </button>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs font-semibold text-gold-deep">
        <Wand2 className="size-4" aria-hidden="true" /> {t('admin.customize.tabHint')}
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Customize tabs">
        {TABS.map(x => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === x.id ? 'bg-ink text-paper' : 'bg-paper text-ink-soft ring-1 ring-line hover:bg-ink/5'
            }`}
          >
            <x.icon className="size-4" aria-hidden="true" /> {t(`admin.customize.tab.${x.id}`)}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {tab === 'hero' && (
          <>
            <Section icon={Sparkles} title={t('admin.customize.tab.hero')}>
              <Field label={t('admin.customize.heroBadge')} value={draft.hero.badge.en} onChange={v => set('hero.badge.en', v)} />
              <Pair
                pair={draft.hero.title1}
                setPair={setPair('hero.title1')}
                labelEn={t('admin.customize.heroLine1')}
                labelAr={t('admin.customize.heroLine1')}
              />
              <Pair
                pair={draft.hero.title2}
                setPair={setPair('hero.title2')}
                labelEn={t('admin.customize.heroLine2')}
                labelAr={t('admin.customize.heroLine2')}
              />
              <Pair
                pair={draft.hero.sub}
                setPair={setPair('hero.sub')}
                labelEn={t('admin.customize.heroSub')}
                labelAr={t('admin.customize.heroSub')}
                textarea
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Pair
                  pair={draft.hero.cta}
                  setPair={setPair('hero.cta')}
                  labelEn={t('admin.customize.heroCta')}
                  labelAr={t('admin.customize.heroCta')}
                />
                <Pair
                  pair={draft.hero.browse}
                  setPair={setPair('hero.browse')}
                  labelEn={t('admin.customize.heroBrowse')}
                  labelAr={t('admin.customize.heroBrowse')}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('admin.customize.heroRating')} value={draft.hero.rating} onChange={v => set('hero.rating', v)} />
                <Pair
                  pair={draft.hero.reviews}
                  setPair={setPair('hero.reviews')}
                  labelEn={t('admin.customize.heroReviews')}
                  labelAr={t('admin.customize.heroReviews')}
                />
              </div>
              <ImgField label={t('admin.customize.heroImage')} value={draft.hero.image} onChange={v => set('hero.image', v)} />
            </Section>

            <Section icon={Blocks} title={t('admin.customize.heroChips')}>
              {draft.hero.chips.map((c, i) => (
                <ListItem key={i} title={`# ${i + 1}`}>
                  <select
                    value={c.icon}
                    onChange={e => set(`hero.chips.${i}.icon`, e.target.value)}
                    className="input"
                    aria-label="Icon"
                  >
                    {CHIP_ICONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <Pair
                    pair={c.label}
                    setPair={(loc, val) => set(`hero.chips.${i}.label.${loc}`, val)}
                    labelEn={t('admin.customize.chipLabel')}
                    labelAr={t('admin.customize.chipLabel')}
                  />
                </ListItem>
              ))}
            </Section>
          </>
        )}

        {tab === 'sections' && (
          Object.keys(draft.sections).map(key => {
            const hg = draft.headings[key]
            const Icon = CHIP_TAB_ICONS[key] || ArrowDownUp
            return (
              <Section key={key} icon={Icon} title={key.toUpperCase()}>
                <Toggle
                  checked={draft.sections[key]}
                  onChange={v => set(`sections.${key}`, v)}
                  label={t('admin.customize.toggleOn')}
                />
                {hg?.tag && (
                  <Pair pair={hg.tag} setPair={setPair(`headings.${key}.tag`)} labelEn={t('admin.customize.sectionTag')} labelAr={t('admin.customize.sectionTag')} />
                )}
                {hg?.title && (
                  <Pair pair={hg.title} setPair={setPair(`headings.${key}.title`)} labelEn={t('admin.customize.sectionTitle')} labelAr={t('admin.customize.sectionTitle')} />
                )}
                {hg?.title2 && (
                  <Pair pair={hg.title2} setPair={setPair(`headings.${key}.title2`)} labelEn={t('admin.customize.heroLine2')} labelAr={t('admin.customize.heroLine2')} />
                )}
                {hg?.sub && (
                  <Pair pair={hg.sub} setPair={setPair(`headings.${key}.sub`)} labelEn="Sub" labelAr="الوصف الفرعي" textarea />
                )}
              </Section>
            )
          })
        )}

        {tab === 'about' && (
          <>
            <Section icon={Megaphone} title={t('admin.customize.tab.about')}>
              <Pair pair={draft.about.text} setPair={setPair('about.text')} labelEn={t('admin.customize.aboutText')} labelAr={t('admin.customize.aboutText')} textarea />
              <Pair pair={draft.about.cta} setPair={setPair('about.cta')} labelEn={t('admin.customize.aboutCta')} labelAr={t('admin.customize.aboutCta')} />
              <ImgField label={t('admin.customize.aboutImage')} value={draft.about.image} onChange={v => set('about.image', v)} aspect="3/4" />
            </Section>
            <Section icon={Palette} title={t('admin.customize.values')}>
              {draft.values.map((v, i) => (
                <ListItem key={i} title={`# ${i + 1}`}>
                  <Pair pair={v.title} setPair={(loc, val) => set(`values.${i}.title.${loc}`, val)} labelEn={t('admin.customize.valueTitle')} labelAr={t('admin.customize.valueTitle')} />
                  <Pair pair={v.desc} setPair={(loc, val) => set(`values.${i}.desc.${loc}`, val)} labelEn={t('admin.customize.valueDesc')} labelAr={t('admin.customize.valueDesc')} textarea />
                </ListItem>
              ))}
            </Section>
          </>
        )}

        {tab === 'faq' && (
          <Section icon={FileQuestion} title={t('admin.customize.tab.faq')}>
            {draft.faqs.map((f, i) => (
              <ListItem key={i} title={`# ${i + 1}`} onRemove={() => set('faqs', draft.faqs.filter((_, j) => j !== i))}>
                <Pair pair={f.q} setPair={(loc, val) => set(`faqs.${i}.q.${loc}`, val)} labelEn={t('admin.customize.faqQuestion')} labelAr={t('admin.customize.faqQuestion')} />
                <Pair pair={f.a} setPair={(loc, val) => set(`faqs.${i}.a.${loc}`, val)} labelEn={t('admin.customize.faqAnswer')} labelAr={t('admin.customize.faqAnswer')} textarea />
              </ListItem>
            ))}
            <button type="button" onClick={() => set('faqs', [...draft.faqs, { q: { en: '', ar: '' }, a: { en: '', ar: '' } }])} className="btn btn-outline btn-sm">
              + {t('admin.customize.add')}
            </button>
          </Section>
        )}

        {tab === 'testimonials' && (
          <Section icon={MessageSquareQuote} title={t('admin.customize.tab.testimonials')}>
            {draft.testimonials.map((x, i) => (
              <ListItem key={i} title={x.name || `# ${i + 1}`} onRemove={() => set('testimonials', draft.testimonials.filter((_, j) => j !== i))}>
                <Field label={t('admin.customize.testiName')} value={x.name} onChange={v => set(`testimonials.${i}.name`, v)} />
                <Pair pair={x.city} setPair={(loc, val) => set(`testimonials.${i}.city.${loc}`, val)} labelEn={t('admin.customize.testiCity')} labelAr={t('admin.customize.testiCity')} />
                <Pair pair={x.quote} setPair={(loc, val) => set(`testimonials.${i}.quote.${loc}`, val)} labelEn={t('admin.customize.testiQuote')} labelAr={t('admin.customize.testiQuote')} textarea />
                <ImgField label={t('admin.customize.testiAvatar')} value={x.avatar} onChange={v => set(`testimonials.${i}.avatar`, v)} />
              </ListItem>
            ))}
            <button type="button" onClick={() => set('testimonials', [...draft.testimonials, { name: '', city: { en: '', ar: '' }, quote: { en: '', ar: '' }, avatar: '' }])} className="btn btn-outline btn-sm">
              + {t('admin.customize.add')}
            </button>
          </Section>
        )}

        {tab === 'extras' && (
          <>
            <Section icon={RockingChair} title={t('admin.customize.sizeRows')}>
              <div className="space-y-4">
                {draft.sizeRows.map((r, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border border-line bg-paper/50 p-4 sm:grid-cols-4">
                    <Field label={t('admin.customize.sizeLabel')} value={r.size} onChange={v => set(`sizeRows.${i}.size`, v)} />
                    <Field label={t('admin.customize.chest')} type="number" value={r.chest} onChange={v => set(`sizeRows.${i}.chest`, Number(v) || 0)} />
                    <Field label={t('admin.customize.length')} type="number" value={r.length} onChange={v => set(`sizeRows.${i}.length`, Number(v) || 0)} />
                    <Pair pair={r.fit} setPair={(loc, val) => set(`sizeRows.${i}.fit.${loc}`, val)} labelEn={t('admin.customize.fit')} labelAr={t('admin.customize.fit')} />
                  </div>
                ))}
              </div>
            </Section>
            <Section icon={Server} title={t('admin.customize.stats')}>
              <div className="space-y-4">
                {draft.stats.map((s, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border border-line bg-paper/50 p-4 sm:grid-cols-3">
                    <Field label={t('admin.customize.statValue')} value={s.value} onChange={v => set(`stats.${i}.value`, v)} />
                    <Pair pair={s.label} setPair={(loc, val) => set(`stats.${i}.label.${loc}`, val)} labelEn={t('admin.customize.statLabel')} labelAr={t('admin.customize.statLabel')} />
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {tab === 'footer' && (
          <Section icon={ScrollText} title={t('admin.customize.tab.footer')}>
            <Pair pair={draft.footer.tagline} setPair={setPair('footer.tagline')} labelEn={t('admin.customize.footerTagline')} labelAr={t('admin.customize.footerTagline')} textarea />
            <Pair pair={draft.footer.city} setPair={setPair('footer.city')} labelEn={t('admin.customize.footerCity')} labelAr={t('admin.customize.footerCity')} />
          </Section>
        )}
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={() => save()} disabled={busy || !loaded} className="btn btn-primary">
          <Save className="size-4" aria-hidden="true" />
          {busy ? t('admin.customize.saving') : t('admin.customize.save')}
        </button>
      </div>
    </div>
  )
}