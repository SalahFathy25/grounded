export default function EmptyState({ icon: Icon = null, title, subtitle, action }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-line/40 px-6 py-16 text-center">
      {Icon && (
        <span className="grid size-14 place-items-center rounded-full bg-gold-tint" aria-hidden="true">
          <Icon className="size-6 text-gold" />
        </span>
      )}
      <div>
        <p className="text-lg font-bold">{title}</p>
        {subtitle && <p className="mt-1 max-w-sm text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}