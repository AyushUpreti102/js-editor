import { ref, watch } from 'vue'
import iframeScript from '@/constants/iframeScript'
import { useLocalStorage } from './useLocalStorage'
import { useDebounce } from './useDebounce'

let instance

const getCodeEditor = () => {
  const html = ref(null)
  const css = ref(null)
  const js = ref(null)
  const consoles = ref([])

  const { savedHtml, savedCss, savedJs, saveCode } = useLocalStorage()

  const updateHtmlCode = (val) => {
    html.value = val
  }

  const updateCssCode = (val) => {
    css.value = val
  }

  const updateJsCode = (val) => {
    js.value = val
  }

  const saveCodeToLocalStorage = (htmlCode, cssCode, jsCode) => {
    const safeHtml = htmlCode || ''
    const safeCss = cssCode || ''
    const safeJs = jsCode || ''

    saveCode({ html: safeHtml, css: safeCss, js: safeJs })
  }

  const debounceSave = useDebounce(saveCodeToLocalStorage)

  const addConsole = (val) => consoles.value.push(val)
  const clearConsole = () => (consoles.value = [])

  const loadSavedCode = () => {
    html.value = savedHtml.value || ''
    css.value = savedCss.value || ''
    js.value = savedJs.value || ''
  }

  const executeCode = (iframeRef) => {
    clearConsole()

    // Safety check to ensure the iframe exists in the DOM
    if (!iframeRef || !iframeRef.value) return

    // Prevent "null" or "undefined" from rendering as strings
    const safeHtml = html.value || ''
    const safeCss = css.value || ''
    const safeJs = js.value || ''

    iframeRef.value.srcdoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          ${safeCss}
        </style>
      </head>
      <body>
        ${safeHtml}
        <script>
          ${iframeScript || ''}
        <\/script>
        <script>
          ${safeJs}
        <\/script>
      </body>
    </html>
  `
  }

  loadSavedCode()

  watch(html, () => debounceSave(html.value, css.value, js.value))
  watch(css, () => debounceSave(html.value, css.value, js.value))
  watch(js, () => debounceSave(html.value, css.value, js.value))

  return {
    html,
    css,
    js,
    consoles,
    updateHtmlCode,
    updateCssCode,
    updateJsCode,
    executeCode,
    addConsole,
    clearConsole,
  }
}

export const useCodeEditor = () => {
  if (!instance) {
    instance = getCodeEditor()
  }

  return instance
}
