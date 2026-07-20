import { ref } from 'vue'
import iframeScript from '@/constants/iframeScript'

let instance

const getCodeEditor = () => {
  const html = ref(null)
  const css = ref(null)
  const js = ref(null)
  const consoles = ref([])
  const srcdoc = ref('')

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

  const executeCode = () => {
    clearConsole()

    srcdoc.value = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${css.value}
          </style>
        </head>
        <body>
          ${html.value}
          <script>
            ${iframeScript}
          <\/script>
          <script>
            ${js.value}
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
    srcdoc,
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
