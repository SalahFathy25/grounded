export default function AuthShell({ title, sub, children, footer }) {
  return (
    <div className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden bg-paper px-4 py-14">
      <div className="pointer-events-none absolute -top-24 start-[12%] size-80 rounded-full bg-amber-300/25 blur-[110px] animate-orb" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 end-[8%] size-96 rounded-full bg-gold/20 blur-[130px] animate-orb" style={{ animationDelay: '-7s' }} aria-hidden="true" />
      <div className="pointer-events-none absolute top-1/3 end-[22%] size-48 rounded-full bg-amber-200/20 blur-[90px] animate-orb" style={{ animationDelay: '-3.5s' }} aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(10,10,11,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(10,10,11,0.04)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,black,transparent)]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="card animate-rise border-line bg-paper/80 p-7 shadow-pop backdrop-blur-xl sm:p-9">
          <div className="flex animate-rise items-center gap-3.5">
            <img src="/logo.jpg" alt="" className="h-12 w-auto max-w-[5.5rem] rounded-xl object-contain ring-1 ring-line" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mt-0.5 text-sm text-muted">{sub}</p>
            </div>
          </div>

          <div className="mt-8 animate-rise" style={{ animationDelay: '160ms' }}>
            {children}
          </div>

          {footer && (
            <p className="mt-6 animate-rise text-center text-sm text-muted" style={{ animationDelay: '280ms' }}>
              {footer}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}