import { shallowRef, ref } from 'vue'
import { defineStore } from 'pinia'
import * as monaco from 'monaco-editor'
import { getLanguageFromName } from '@/utils/fileUtils'

// Monaco Editor Workers
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// Configure Monaco worker environment
if (typeof window !== 'undefined' && !window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'json') return new jsonWorker()
      if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
      if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
      if (label === 'typescript' || label === 'javascript') return new tsWorker()
      return new editorWorker()
    },
  }
}

// Define custom dark editor theme
monaco.editor.defineTheme('editor-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editorLineNumber.foreground': '#6e7681',
    'editorLineNumber.activeForeground': '#ffffff',
    'editor.lineHighlightBackground': '#2a2d2e40',
    'editorCursor.foreground': '#ffffff',
    'editorWhitespace.foreground': '#3e3e42',
    'editorIndentGuide.background': '#2d2d2d',
    'editorIndentGuide.activeBackground': '#4e4e4e',
  },
})

/**
 * Pinia store managing the Monaco Code Editor instance,
 * multi-model files, active documents, and editor lifecycle.
 */
export const useEditorStore = defineStore('editor', () => {
  const editor = shallowRef(null)
  const modelsMap = {}
  const activeModelKey = ref('index.html')

  // Dynamic status bar states
  const cursorPosition = ref({ lineNumber: 1, column: 1 })
  const selectionLength = ref(0)
  const indentation = ref('Spaces: 2')
  const eol = ref('LF')
  const errorsCount = ref(0)
  const warningsCount = ref(0)

  const defaultEditorOptions = {
    theme: 'editor-dark',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    minimap: { enabled: true },
    automaticLayout: true,
    lineNumbers: 'on',
    roundedSelection: true,
    scrollBeyondLastLine: false,
    renderWhitespace: 'selection',
    cursorBlinking: 'smooth',
    smoothScrolling: true,
    tabSize: 2,
  }

  /**
   * Initialize Monaco editor instance and register all file models
   * @param {HTMLElement|string} container - Mount target element or element id
   * @param {Record<string, { id: string, name: string, content: string }>} fileContentMap - Virtual files
   * @param {string} defaultFileName - Key of the initial file to display
   * @param {Function} [onContentChange] - Callback when active document content changes
   * @param {Object} [customOptions] - Custom Monaco editor overrides
   */
  const initEditor = (
    container,
    fileContentMap = {},
    defaultFileName = 'index.html',
    onContentChange = null,
    customOptions = {},
  ) => {
    // 1. Create and register Monaco models for all workspace files
    Object.entries(fileContentMap).forEach(([fileName, item]) => {
      const content = typeof item === 'string' ? item : (item?.content ?? '')
      const name = item?.name || fileName
      const uri = monaco.Uri.parse(`file:///${name}`)
      const language = getLanguageFromName(name)

      // Dispose existing model if already present with same URI
      const existingModel = monaco.editor.getModel(uri)
      if (existingModel) {
        existingModel.dispose()
      }

      // Create model
      const model = monaco.editor.createModel(content, language, uri)

      if (onContentChange) {
        model.onDidChangeContent(() => {
          onContentChange(fileName, model.getValue(), model)
        })
      }

      modelsMap[fileName] = model
      if (name !== fileName) {
        modelsMap[name] = model
      }
    })

    // 2. Locate container element
    const containerEl =
      typeof container === 'string'
        ? document.getElementById(container)
        : container || document.getElementById('container')

    if (!containerEl) {
      return
    }

    if (editor.value) {
      editor.value.dispose()
    }

    // 3. Mount Monaco Editor with initial active file
    const initialModel =
      modelsMap[defaultFileName] ||
      modelsMap['index.html'] ||
      modelsMap['index-html'] ||
      Object.values(modelsMap)[0] ||
      null

    activeModelKey.value = defaultFileName

    editor.value = monaco.editor.create(containerEl, {
      ...defaultEditorOptions,
      ...customOptions,
      model: initialModel,
    })

    // Real-time status bar listeners
    editor.value.onDidChangeCursorPosition((e) => {
      cursorPosition.value = {
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      }
    })

    editor.value.onDidChangeCursorSelection((e) => {
      const sel = e.selection
      if (sel && !sel.isEmpty()) {
        const model = editor.value.getModel()
        if (model) {
          selectionLength.value = model.getValueInRange(sel).length
        }
      } else {
        selectionLength.value = 0
      }
    })

    editor.value.onDidChangeModel(() => {
      updateModelMetadata()
    })

    updateModelMetadata()
  }

  /**
   * Updates reactive metadata (EOL, indentation, position, diagnostics) for active model
   */
  const updateModelMetadata = () => {
    if (!editor.value) return
    const model = editor.value.getModel()
    if (!model) return

    eol.value = model.getEOL() === '\r\n' ? 'CRLF' : 'LF'

    const opts = model.getOptions()
    indentation.value = opts.insertSpaces ? `Spaces: ${opts.tabSize}` : `Tab Size: ${opts.tabSize}`

    const pos = editor.value.getPosition()
    if (pos) {
      cursorPosition.value = { lineNumber: pos.lineNumber, column: pos.column }
    }

    selectionLength.value = 0
    updateDiagnostics()
  }

  /**
   * Reads Monaco markers (errors and warnings) for active model
   */
  const updateDiagnostics = () => {
    if (!editor.value) return
    const model = editor.value.getModel()
    if (!model) {
      errorsCount.value = 0
      warningsCount.value = 0
      return
    }
    const markers = monaco.editor.getModelMarkers({ resource: model.uri })
    errorsCount.value = markers.filter((m) => m.severity === monaco.MarkerSeverity.Error).length
    warningsCount.value = markers.filter((m) => m.severity === monaco.MarkerSeverity.Warning).length
  }

  // Global listener for syntax diagnostics/markers
  monaco.editor.onDidChangeMarkers(() => {
    updateDiagnostics()
  })

  /**
   * Triggers Monaco Go to Line dialog
   */
  const promptGoToLine = () => {
    if (!editor.value) return
    editor.value.focus()
    editor.value.getAction('editor.action.gotoLine')?.run()
  }

  /**
   * Toggles Line Sequence between LF and CRLF
   */
  const toggleEol = () => {
    if (!editor.value) return
    const model = editor.value.getModel()
    if (!model) return
    const next =
      model.getEOL() === '\r\n'
        ? monaco.editor.EndOfLineSequence.LF
        : monaco.editor.EndOfLineSequence.CRLF
    model.setEOL(next)
    eol.value = model.getEOL() === '\r\n' ? 'CRLF' : 'LF'
  }

  /**
   * Cycles indentation between Spaces: 2, Spaces: 4, and Tab Size: 4
   */
  const toggleIndentation = () => {
    if (!editor.value) return
    const model = editor.value.getModel()
    if (!model) return
    const opts = model.getOptions()
    let newSpaces
    let newTabSize
    if (opts.insertSpaces && opts.tabSize === 2) {
      newSpaces = true
      newTabSize = 4
    } else if (opts.insertSpaces && opts.tabSize === 4) {
      newSpaces = false
      newTabSize = 4
    } else {
      newSpaces = true
      newTabSize = 2
    }
    model.updateOptions({ insertSpaces: newSpaces, tabSize: newTabSize })
    indentation.value = newSpaces ? `Spaces: ${newTabSize}` : `Tab Size: ${newTabSize}`
  }

  /**
   * Sets syntax highlighting language mode on the active model
   * @param {string} newLang
   */
  const changeLanguage = (newLang) => {
    if (!editor.value) return
    const model = editor.value.getModel()
    if (!model) return
    monaco.editor.setModelLanguage(model, newLang.toLowerCase())
  }

  /**
   * Retrieves the current editor text value
   * @returns {string}
   */
  const getValue = () => {
    return editor.value ? editor.value.getValue() : ''
  }

  /**
   * Switches the active document model in the editor
   * @param {string} fileKey - Key or filename of the target document
   */
  const setActiveModel = (fileKey) => {
    activeModelKey.value = fileKey
    const targetModel = modelsMap[fileKey]
    if (editor.value && targetModel) {
      if (editor.value.getModel() !== targetModel) {
        editor.value.setModel(targetModel)
        updateModelMetadata()
      }
    }
  }

  /**
   * Switches to document and highlights range/jumps cursor to position
   * @param {string} fileKey
   * @param {number} lineNumber
   * @param {number} column
   * @param {number} [matchLength]
   */
  const jumpToPosition = (fileKey, lineNumber, column, matchLength = 0) => {
    setActiveModel(fileKey)
    if (editor.value) {
      editor.value.focus()
      editor.value.revealLineInCenter(lineNumber)
      editor.value.setPosition({ lineNumber, column })
      if (matchLength > 0) {
        editor.value.setSelection({
          startLineNumber: lineNumber,
          startColumn: column,
          endLineNumber: lineNumber,
          endColumn: column + matchLength,
        })
      }
    }
  }

  /**
   * Creates or updates a Monaco model for a virtual file
   * @param {string} fileKey
   * @param {string} actualName
   * @param {string} [content]
   * @param {Function} [onContentChange]
   * @returns {monaco.editor.ITextModel}
   */
  const createOrUpdateModel = (fileKey, actualName, content = '', onContentChange = null) => {
    const uri = monaco.Uri.parse(`file:///${actualName}`)
    const language = getLanguageFromName(actualName)

    let model = modelsMap[fileKey] || monaco.editor.getModel(uri)
    if (!model) {
      model = monaco.editor.createModel(content, language, uri)
      if (onContentChange) {
        model.onDidChangeContent(() => {
          onContentChange(fileKey, model.getValue(), model)
        })
      }
    } else {
      if (model.getValue() !== content) {
        model.setValue(content)
      }
    }

    modelsMap[fileKey] = model
    if (actualName !== fileKey) {
      modelsMap[actualName] = model
    }
    return model
  }

  /**
   * Disposes and deletes a model from memory
   * @param {string} fileKey
   */
  const removeModel = (fileKey) => {
    const model = modelsMap[fileKey]
    if (model) {
      model.dispose()
    }
    delete modelsMap[fileKey]
  }

  /**
   * Renames a model key and re-registers URI
   * @param {string} oldKey
   * @param {string} newKey
   * @param {string} newName
   * @param {Function} [onContentChange]
   * @returns {monaco.editor.ITextModel}
   */
  const renameModel = (oldKey, newKey, newName, onContentChange = null) => {
    const oldModel = modelsMap[oldKey]
    const content = oldModel ? oldModel.getValue() : ''
    if (oldModel) {
      oldModel.dispose()
      delete modelsMap[oldKey]
    }
    return createOrUpdateModel(newKey, newName, content, onContentChange)
  }

  /**
   * Disposes editor instance and all active models
   */
  const disposeEditor = () => {
    if (editor.value) {
      editor.value.dispose()
      editor.value = null
    }
    Object.values(modelsMap).forEach((model) => model.dispose())
    for (const key in modelsMap) {
      delete modelsMap[key]
    }
  }

  /*
   * NEXT PHASE:
   * 1. In-browser bundler & transpiler: Integrate esbuild-wasm or Rollup to bundle ES modules in-memory.
   * 2. Code formatting: Integrate Prettier worker to enable 'Format Document' (Cmd+Shift+I / Alt+Shift+F).
   * 3. Custom language diagnostics: Provide real-time linting markers and syntax validation.
   * 4. Multi-tab split view: Enable side-by-side editor instances for diff and comparison.
   * 5. Theme customization: Add light and high-contrast themes switchable from Settings.
   */

  /**
   * Executes a built-in Monaco Editor action by its identifier
   * @param {string} actionId
   */
  const executeAction = (actionId) => {
    if (!editor.value) return
    editor.value.focus()
    const action = editor.value.getAction(actionId)
    if (action) {
      action.run()
    } else {
      editor.value.trigger('menu', actionId, null)
    }
  }

  /**
   * Triggers undo in active editor
   */
  const undo = () => {
    if (!editor.value) return
    editor.value.focus()
    editor.value.trigger('menu', 'undo', null)
  }

  /**
   * Triggers redo in active editor
   */
  const redo = () => {
    if (!editor.value) return
    editor.value.focus()
    editor.value.trigger('menu', 'redo', null)
  }

  /**
   * Cuts selected text to clipboard
   */
  const cut = async () => {
    if (!editor.value) return
    editor.value.focus()
    const selection = editor.value.getSelection()
    const model = editor.value.getModel()
    if (selection && model && !selection.isEmpty()) {
      const text = model.getValueInRange(selection)
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        document.execCommand('cut')
        return
      }
      editor.value.executeEdits('menu-cut', [
        { range: selection, text: '', forceMoveMarkers: true },
      ])
    }
  }

  /**
   * Copies selected text to clipboard
   */
  const copy = async () => {
    if (!editor.value) return
    editor.value.focus()
    const selection = editor.value.getSelection()
    const model = editor.value.getModel()
    if (selection && model && !selection.isEmpty()) {
      const text = model.getValueInRange(selection)
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        document.execCommand('copy')
      }
    }
  }

  /**
   * Pastes text from clipboard into editor at cursor position
   */
  const paste = async () => {
    if (!editor.value) return
    editor.value.focus()
    try {
      const text = await navigator.clipboard.readText()
      const selection = editor.value.getSelection()
      if (selection) {
        editor.value.executeEdits('menu-paste', [
          { range: selection, text, forceMoveMarkers: true },
        ])
      }
    } catch {
      document.execCommand('paste')
    }
  }

  /**
   * Duplicates active selection or current line
   */
  const duplicateSelection = () => {
    if (!editor.value) return
    editor.value.focus()
    const selection = editor.value.getSelection()
    const model = editor.value.getModel()
    if (!selection || !model) return

    if (!selection.isEmpty()) {
      const text = model.getValueInRange(selection)
      editor.value.executeEdits('duplicate-selection', [
        {
          range: new monaco.Range(
            selection.endLineNumber,
            selection.endColumn,
            selection.endLineNumber,
            selection.endColumn,
          ),
          text,
          forceMoveMarkers: true,
        },
      ])
    } else {
      executeAction('editor.action.copyLinesDownAction')
    }
  }

  return {
    editor,
    modelsMap,
    activeModelKey,
    defaultEditorOptions,
    cursorPosition,
    selectionLength,
    indentation,
    eol,
    errorsCount,
    warningsCount,
    initEditor,
    getValue,
    setActiveModel,
    createOrUpdateModel,
    removeModel,
    renameModel,
    disposeEditor,
    promptGoToLine,
    toggleEol,
    toggleIndentation,
    changeLanguage,
    updateModelMetadata,
    jumpToPosition,
    executeAction,
    undo,
    redo,
    cut,
    copy,
    paste,
    duplicateSelection,
  }
})
