import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      const isAr = typeof document !== 'undefined' && document.documentElement.lang === 'ar'
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper p-6 text-center">
          <p className="text-5xl" aria-hidden="true">⚠️</p>
          <h1 className="text-2xl font-bold text-ink">
            {isAr ? 'حصل خطأ غير متوقع' : 'Something went wrong'}
          </h1>
          <p className="max-w-md text-sm text-muted">{String(this.state.error?.message || '')}</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null })
              window.location.href = '/'
            }}
            className="btn btn-primary"
          >
            {isAr ? 'أعد تحميل الصفحة' : 'Reload page'}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
