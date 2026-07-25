<template>
  <header class="header">
    <div class="logo">
      <span class="logo-icon">JS</span>
      <h2>JavaScript Playground</h2>
    </div>

    <div class="header-actions">
      <select
        v-model="currentMode"
        @change="$emit('updateMode', currentMode)"
        class="mode-selector"
      >
        <option value="all">All</option>
        <option value="html-css">HTML & CSS</option>
        <option value="js">JavaScript</option>
      </select>

      <button class="run-btn" @click="$emit('onExecute')">▶ Run</button>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'

const currentMode = ref('all')
defineEmits(['onExecute', 'updateMode'])
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 50px;
  background: #252526;
  border-bottom: 1px solid #3b3b3b;
  color: white;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  background: #f7df1e;
  color: black;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mode-selector {
  background: #3c3c3c;
  color: white;
  border: 1px solid #555;
  padding: 6px 12px;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}

.run-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.run-btn:hover {
  background: #45a049;
}
</style>
