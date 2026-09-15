<template>
  <nav class="activity-bar" aria-label="Activity Bar">
    <div class="activity-top">
      <!-- Files / Explorer -->
      <button
        class="action-btn"
        :class="{ active: isSidebarOpen && activeView === 'explorer' }"
        title="Explorer (Cmd+Shift+E)"
        @click="$emit('select-view', 'explorer')"
      >
        <IconFile :size="20" />
      </button>

      <!-- Search -->
      <button
        class="action-btn"
        :class="{ active: isSidebarOpen && activeView === 'search' }"
        title="Search (Cmd+Shift+F)"
        @click="$emit('select-view', 'search')"
      >
        <IconSearch :size="20" />
      </button>
    </div>

    <div class="activity-bottom">
      <!-- Settings -->
      <button class="action-btn" title="Settings">
        <IconSettings :size="20" />
      </button>
    </div>
  </nav>
</template>

<script setup>
import { IconFile, IconSearch, IconSettings } from '@/components/icons'

defineProps({
  activeView: {
    type: String,
    default: 'explorer',
  },
  isSidebarOpen: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['select-view'])

/*
 * NEXT PHASE:
 * 1. Multi-pane sidebar switcher:
 *    - Search pane: global project text search and replace.
 *    - Source Control pane: Git repository status, diff view, stage/commit interface.
 *    - Extensions pane: community plugins / snippets.
 * 2. Settings modal overlay: editor typography, keybinding customizer, and theme switcher.
 */
</script>

<style scoped>
.activity-bar {
  width: 48px;
  height: 100%;
  background: var(--bg-activity);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
}

.activity-top,
.activity-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.action-btn {
  width: 100%;
  height: 44px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: color 0.15s;
}

.action-btn:hover {
  color: var(--text-bright);
}

.action-btn.active {
  color: var(--text-bright);
}

.action-btn.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: var(--text-bright);
}
</style>
