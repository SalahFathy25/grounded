import { useState } from 'react'
import { Facebook, Instagram, Mail, MessageSquareText, Megaphone, Music2, Phone, Save, ShoppingBag, Smartphone, Truck } from 'lucide-react'
import { settingsApi } from '../../lib/api'
import { useSettings } from '../../context/SettingsContext'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'

function Field({ id, label, hint, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} {...props} className="input" />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
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
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export default function AdminSettings() {
  const { settings, setSettings } = useSettings()
  const { t } = useLang()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const set = key => e => setSettings({ ...settings, [key]: e.target.value })

  const save = async () => {
    setBusy(true)
    try {
      const updated = await settingsApi.update({
        store_name_en: settings.store_name_en,
        store_name_ar: settings.store_name_ar,
        tagline_en: settings.tagline_en,
        tagline_ar: settings.tagline_ar,
        announcement_en: settings.announcement_en,
        announcement_ar: settings.announcement_ar,
        announcement_enabled: settings.announcement_enabled,
        shipping_fee: Number(settings.shipping_fee) || 0,
        vodafone_number: settings.vodafone_number,
        instapay_number: settings.instapay_number,
        support_phone: settings.support_phone,
        support_email: settings.support_email,
        instagram_url: settings.instagram_url,
        facebook_url: settings.facebook_url,
        tiktok_url: settings.tiktok_url,
      })
      setSettings(updated)
      toast(t('admin.settings.saved'), 'success')
    } catch {
      toast(t('admin.settings.saveError'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.settings.title')}</h1>
          <p className="mt-0.5 text-sm text-muted">{t('admin.settings.subtitle')}</p>
        </div>
        <button type="button" onClick={save} disabled={busy} className="btn btn-primary btn-sm">
          <Save className="size-4" aria-hidden="true" />
          {busy ? t('admin.settings.saving') : t('admin.settings.save')}
        </button>
      </div>

      <Section icon={ShoppingBag} title={t('admin.settings.identity')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="s-name-en" label={t('admin.settings.storeNameEn')} value={settings.store_name_en} onChange={set('store_name_en')} placeholder="Grounded" />
          <Field id="s-name-ar" label={t('admin.settings.storeNameAr')} value={settings.store_name_ar} onChange={set('store_name_ar')} placeholder="غراوندد" dir="rtl" />
          <Field id="s-tag-en" label={t('admin.settings.taglineEn')} value={settings.tagline_en} onChange={set('tagline_en')} placeholder="Comfort that grounds you" />
          <Field id="s-tag-ar" label={t('admin.settings.taglineAr')} value={settings.tagline_ar} onChange={set('tagline_ar')} placeholder="راحة تمنحك الثبات" dir="rtl" />
        </div>
      </Section>

      <Section icon={Megaphone} title={t('admin.settings.announcement')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="s-ann-en" label={t('admin.settings.announcementEn')} value={settings.announcement_en} onChange={set('announcement_en')} placeholder="Free shipping over 2000 EGP" />
          <Field id="s-ann-ar" label={t('admin.settings.announcementAr')} value={settings.announcement_ar} onChange={set('announcement_ar')} placeholder="شحن مجاني للطلبات فوق 2000 ج.م" dir="rtl" />
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm font-medium">
          <input
            type="checkbox"
            checked={settings.announcement_enabled}
            onChange={e => setSettings({ ...settings, announcement_enabled: e.target.checked })}
            className="size-4 accent-[color:var(--gold-deep)]"
          />
          {t('admin.settings.announcementEnabled')}
        </label>
      </Section>

      <Section icon={Truck} title={t('admin.settings.shippingTitle')}>
        <div className="max-w-xs">
          <Field id="s-ship" label={t('admin.settings.shippingFee')} type="number" min="0" value={settings.shipping_fee} onChange={set('shipping_fee')} />
        </div>
      </Section>

      <Section icon={Smartphone} title={t('admin.settings.walletTitle')}>
        <p className="text-sm text-muted">{t('admin.settings.walletHint')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="s-vodafone" label={t('admin.settings.vodafoneNum')} dir="ltr" value={settings.vodafone_number} onChange={set('vodafone_number')} placeholder="+20 100 000 0000" />
          <Field id="s-instapay" label={t('admin.settings.instapayNum')} dir="ltr" value={settings.instapay_number} onChange={set('instapay_number')} placeholder="01000000000" />
        </div>
      </Section>

      <Section icon={Phone} title={t('admin.settings.contactTitle')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="s-phone" label={t('admin.settings.phone')} dir="ltr" value={settings.support_phone} onChange={set('support_phone')} />
          <Field id="s-email" label={t('admin.settings.email')} type="email" dir="ltr" value={settings.support_email} onChange={set('support_email')} />
        </div>
      </Section>

      <Section icon={MessageSquareText} title={t('admin.settings.socialsTitle')}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="s-ig" label={<span className="inline-flex items-center gap-1.5"><Instagram className="size-3.5" aria-hidden="true" /> Instagram</span>} dir="ltr" value={settings.instagram_url} onChange={set('instagram_url')} placeholder="https://instagram.com/..." />
          <Field id="s-fb" label={<span className="inline-flex items-center gap-1.5"><Facebook className="size-3.5" aria-hidden="true" /> Facebook</span>} dir="ltr" value={settings.facebook_url} onChange={set('facebook_url')} placeholder="https://facebook.com/..." />
          <Field id="s-tt" label={<span className="inline-flex items-center gap-1.5"><Music2 className="size-3.5" aria-hidden="true" /> TikTok</span>} dir="ltr" value={settings.tiktok_url} onChange={set('tiktok_url')} placeholder="https://tiktok.com/..." />
        </div>
      </Section>

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={busy} className="btn btn-primary">
          <Save className="size-4" aria-hidden="true" />
          {busy ? t('admin.settings.saving') : t('admin.settings.save')}
        </button>
      </div>
    </div>
  )
}