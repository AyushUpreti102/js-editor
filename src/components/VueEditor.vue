<template>
  <div class="editor-layout">
    <EditorHeader @on-execute="runCode" @update-mode="setMode" />

    <main class="workspace" :class="`mode-${currentMode}`">
      <!-- HTML -->
      <section class="panel html-panel" v-show="showHtmlCss">
        <div class="panel-header">HTML</div>
        <CodeEditor
          v-model:value="htmlCode"
          language="html"
          theme="vs-dark"
          :options="editorOptions"
        />
      </section>

      <!-- CSS -->
      <section class="panel css-panel" v-show="showHtmlCss">
        <div class="panel-header">CSS</div>
        <CodeEditor
          v-model:value="cssCode"
          language="css"
          theme="vs-dark"
          :options="editorOptions"
        />
      </section>

      <!-- JavaScript -->
      <section class="panel js-panel" v-show="showJs">
        <div class="panel-header">JavaScript</div>
        <CodeEditor
          v-model:value="jsCode"
          language="javascript"
          theme="vs-dark"
          :options="editorOptions"
        />
      </section>

      <!-- Preview -->
      <section class="panel preview-panel" v-show="showPreview">
        <div class="panel-header">Preview</div>

        <div class="preview-container">
          <iframe ref="previewIframe" frameborder="0"></iframe>
        </div>
      </section>

      <!-- Console -->
      <section class="panel console-panel" v-show="showJs">
        <div class="panel-header">
          <span>Console</span>
          <button class="clear-btn" @click="clearConsole">Clear</button>
        </div>

        <EditorConsole />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CodeEditor } from 'monaco-editor-vue3'
import { useCodeEditor } from '../utils/useCodeEditor'
import EditorHeader from './EditorHeader.vue'
import EditorConsole from './EditorConsole.vue'

const editorOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true,
}

// Mode Management
const currentMode = ref('all')

const previewIframe = ref(null)

const {
  js,
  css,
  html,
  executeCode,
  updateHtmlCode,
  updateCssCode,
  updateJsCode,
  addConsole,
  clearConsole,
} = useCodeEditor()

const htmlCode = computed({
  get() {
    return html.value
  },
  set(val) {
    updateHtmlCode(val)
  },
})

const cssCode = computed({
  get() {
    return css.value
  },
  set(val) {
    updateCssCode(val)
  },
})

const jsCode = computed({
  get() {
    return js.value
  },
  set(val) {
    updateJsCode(val)
  },
})

const showHtmlCss = computed(() => currentMode.value === 'all' || currentMode.value === 'html-css')
const showJs = computed(() => currentMode.value === 'all' || currentMode.value === 'js')
const showPreview = computed(() => currentMode.value !== 'js')

const setMode = (mode) => {
  currentMode.value = mode
}

const runCode = () => {
  executeCode(previewIframe)
}

const updateConsole = (event) => {
  if (event.data && event.data.type === 'IFRAME_CONSOLE') {
    const { method, arguments: args } = event.data
    addConsole({ method, args })
  }
}

onMounted(() => {
  window.addEventListener('message', updateConsole)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', updateConsole)
})
</script>

<style scoped>
.editor-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
}

.workspace {
  flex: 1;
  display: grid;
  gap: 8px;
  padding: 8px;
  overflow: hidden;
}

/* --- GRID LAYOUT BY MODE --- */

/* 1. Mode: All */
.workspace.mode-all {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 35% 35% 30%;
}
.mode-all .html-panel {
  grid-column: 1;
  grid-row: 1;
}
.mode-all .css-panel {
  grid-column: 2;
  grid-row: 1;
}
.mode-all .js-panel {
  grid-column: 1;
  grid-row: 2 / 4;
}
.mode-all .preview-panel {
  grid-column: 2;
  grid-row: 2;
}
.mode-all .console-panel {
  grid-column: 2;
  grid-row: 3;
}

/* 2. Mode: HTML & CSS */
.workspace.mode-html-css {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 50% 50%;
}
.mode-html-css .html-panel {
  grid-column: 1;
  grid-row: 1 / 3;
}
.mode-html-css .css-panel {
  grid-column: 2;
  grid-row: 1;
}
.mode-html-css .preview-panel {
  grid-column: 2;
  grid-row: 2;
}

/* 3. Mode: JavaScript */
.workspace.mode-js {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 100%;
}
.mode-js .js-panel {
  grid-column: 1;
  grid-row: 1;
}
.mode-js .preview-panel {
  grid-column: 2;
  grid-row: 1;
}
.mode-js .console-panel {
  grid-column: 2;
  grid-row: 1;
}

/* --- PANEL STYLES --- */
.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #252526;
  border: 1px solid #3b3b3b;
  border-radius: 8px;
  min-height: 0;
}

.panel-header {
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #2d2d30;
  border-bottom: 1px solid #3b3b3b;
  font-weight: 600;
  color: #cccccc;
}

.panel > :last-child {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.preview-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #777;
  font-size: 18px;
  border: 2px dashed #555;
  background-color: white;
}

.preview-container iframe {
  height: 100%;
  width: 100%;
  background-color: white;
}

.clear-btn {
  background: transparent;
  color: #aaa;
  border: none;
  cursor: pointer;
  transition: 0.2s;
}

.clear-btn:hover {
  color: white;
}
</style>
