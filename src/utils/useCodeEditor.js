import { ref } from 'vue'
import iframeScript from '@/constants/iframeScript'

let instance

const getCodeEditor = () => {
  const html = ref(null)
  const css = ref(null)
  const js = ref(null)
  const consoles = ref([])

  const updateHtmlCode = (val) => {
    html.value = val
  }

  const updateCssCode = (val) => {
    css.value = val
  }

  const updateJsCode = (val) => {
    js.value = val
  }

  const addConsole = (val) => consoles.value.push(val)
  const clearConsole = () => (consoles.value = [])

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
