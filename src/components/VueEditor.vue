<template>
  <div class="editor-layout">
    <!-- Header -->
    <header class="header">
      <div class="logo">
        <span class="logo-icon">JS</span>
        <h2>JavaScript Playground</h2>
      </div>

      <button class="run-btn" @click="runCode">▶ Run</button>
    </header>

    <!-- Main -->
    <main class="main-content">
      <!-- Editor -->
      <section class="editor-panel">
        <div class="panel-header">
          <span>JavaScript</span>
        </div>

        <div class="editor-container">
          <CodeEditor
            v-model:value="code"
            language="javascript"
            theme="vs-dark"
            :options="editorOptions"
          />
        </div>
      </section>

      <!-- Console -->
      <aside class="console-panel">
        <div class="panel-header">
          <span>Console</span>

          <button class="clear-btn">Clear</button>
        </div>

        <div class="console-body">
          <div class="console-info">> Console ready...</div>

          <div class="console-log">Hello World</div>

          <div class="console-error">ReferenceError: x is not defined</div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { CodeEditor } from 'monaco-editor-vue3'

const editorOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true,
}

const code = ref(null)

const runCode = () => {
  console.log(code.value)
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.editor-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: white;
}

/* Header */

.header {
  height: 60px;
  background: #252526;
  border-bottom: 1px solid #383838;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #f7df1e;
  color: black;
  font-weight: bold;

  display: flex;
  justify-content: center;
  align-items: center;
}

.logo h2 {
  font-size: 18px;
  font-weight: 600;
}

.run-btn {
  background: #16a34a;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: 0.2s;
}

.run-btn:hover {
  background: #15803d;
}

/* Main */

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Editor */

.editor-panel {
  flex: 3;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #333;
}

.panel-header {
  height: 42px;
  background: #2d2d30;
  border-bottom: 1px solid #383838;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 0 16px;
  font-weight: 600;
}

.editor-container {
  padding: 0.5rem;
  flex: 1;
  background: #1e1e1e;

  display: flex;
  justify-content: center;
  align-items: center;

  color: #666;
  font-size: 18px;
}

.editor-container div {
  height: 100%;
  width: 100%;
}

/* Console */

.console-panel {
  width: 360px;
  display: flex;
  flex-direction: column;
  background: #181818;
}

.console-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  font-family: Consolas, monospace;
  font-size: 14px;
}

.console-info {
  color: #7aa2f7;
  margin-bottom: 10px;
}

.console-log {
  color: #22c55e;
  margin-bottom: 10px;
}

.console-error {
  color: #ef4444;
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
