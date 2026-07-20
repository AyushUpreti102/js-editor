<template>
  <aside class="console-panel">
    <div class="console-body">
      <div class="console-info">> Console ready...</div>
      <template v-for="({ args, method }, index) in consoles" :key="index">
        <div
          :class="{
            'console-info': method === 'info',
            'console-log': method === 'log',
            'console-error': method === 'error',
          }"
        >
          {{ renderLogs(args) }}
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { useCodeEditor } from '../utils/useCodeEditor'

const { consoles } = useCodeEditor()

const renderLogs = (logs) => {
  if (logs) return logs.join(', ')
}
</script>

<style scoped>
.console-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #181818;
  min-height: 0;
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
</style>
