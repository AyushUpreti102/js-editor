<template>
  <aside class="console-panel">
    <div class="console-body">
      <div v-if="logs.length === 0" class="console-empty">Console is empty</div>

      <template v-for="({ args, method, timestamp }, index) in logs" :key="index">
        <div
          class="log-row"
          :class="{
            'console-info': method === 'info',
            'console-log': method === 'log',
            'console-warn': method === 'warn',
            'console-error': method === 'error',
          }"
        >
          <span v-if="timestamp" class="log-time">[{{ timestamp }}]</span>
          <span class="log-method-tag">{{ method.toUpperCase() }}</span>
          <span class="log-text">{{ renderLogs(args) }}</span>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useConsoleStore } from '@/stores/consoleStore'

const consoleStore = useConsoleStore()
const { logs } = storeToRefs(consoleStore)

const renderLogs = (args) => {
  if (!args) return ''
  if (Array.isArray(args)) {
    return args.join(' ')
  }
  return String(args)
}
</script>

<style scoped>
.console-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #181818;
  min-height: 0;
}

.console-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
}

.console-empty {
  color: var(--text-secondary);
  font-style: italic;
  padding: 8px 0;
}

.log-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 3px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  word-break: break-word;
}

.log-time {
  color: #555555;
  font-size: 11px;
  flex-shrink: 0;
}

.log-method-tag {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 2px;
  flex-shrink: 0;
  line-height: 1.4;
}

.console-info .log-method-tag {
  background: rgba(122, 162, 247, 0.15);
  color: #7aa2f7;
}

.console-info .log-text {
  color: #7aa2f7;
}

.console-log .log-method-tag {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.console-log .log-text {
  color: #e2e8f0;
}

.console-warn .log-method-tag {
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
}

.console-warn .log-text {
  color: #fef08a;
}

.console-error .log-method-tag {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.console-error .log-text {
  color: #fca5a5;
}

.log-text {
  flex: 1;
  white-space: pre-wrap;
}
</style>
