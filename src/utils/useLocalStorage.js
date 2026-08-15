import { ref } from 'vue'

let instance

let CODE_STORAGE_KEY = 'saved_code'
let MODE_STORAGE_KEY = 'editor_mode'

const getLocalStorage = () => {
  const html = ref('')
  const css = ref('')
  const js = ref('')
  const mode = ref('all')

  const getSavedCode = () => {
    const data = localStorage.getItem(CODE_STORAGE_KEY)
    if (data) {
      const parsedData = JSON.parse(data)
      html.value = parsedData.html
      css.value = parsedData.css
      js.value = parsedData.js
    }
  }

  const getEditorMode = () => {
    const data = localStorage.getItem(MODE_STORAGE_KEY)
    if (data) {
      mode.value = data
    }
  }

  const saveCode = (code) => {
    localStorage.setItem(CODE_STORAGE_KEY, JSON.stringify(code))
  }

  const saveEditorMode = (editorMode) => {
    localStorage.setItem(MODE_STORAGE_KEY, editorMode)
  }

  getSavedCode()
  getEditorMode()

  return {
    savedHtml: html,
    savedCss: css,
    savedJs: js,
    editorMode: mode,
    saveCode,
    saveEditorMode,
  }
}

export const useLocalStorage = () => {
  if (!instance) {
    instance = getLocalStorage()
  }

  return instance
}
