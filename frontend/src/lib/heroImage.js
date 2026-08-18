const listeners = new Set()

export function launchHero(data) {
  listeners.forEach(fn => fn(data))
}

export function onHero(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}