export const useDebounce = (cb, duration = 1000) => {
  let timeout

  return (...args) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      cb(...args)
    }, duration)
  }
}
