<template>
  <header class="header">
    <div class="logo">
      <span class="logo-icon">JS</span>
      <h2>JavaScript Playground</h2>
    </div>

    <button class="run-btn" @click="$emit('onExecute')">▶ Run</button>
  </header>
</template>

<script setup>
defineEmits(['onExecute'])
</script>

<style scoped>
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
</style>
