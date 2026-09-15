<template>
  <div class="tabs-and-breadcrumbs">
    <!-- Top Tabs Row -->
    <div class="tabs-container">
      <div class="tabs-list">
        <div
          v-for="tab in openTabs"
          :key="tab.id"
          class="tab-item"
          :class="{ active: tab.id === activeTabId }"
          @click="$emit('select-tab', tab.id)"
        >
          <!-- Badge Icon -->
          <span :class="['tab-badge', `file-${getFileExt(tab.name)}`]">
            {{ getFileExt(tab.name).toUpperCase() }}
          </span>

          <!-- Tab Title -->
          <span class="tab-title">{{ tab.name }}</span>

          <!-- Tab Close Button -->
          <button
            class="tab-close-btn"
            title="Close Tab (Cmd+W)"
            @click.stop="$emit('close-tab', tab.id)"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Right Tab Bar Controls -->
      <div class="tab-actions">
        <button class="tab-action-btn" title="Split Editor Right" @click="handleSplitEditor">
          <IconSplit :size="14" />
        </button>
        <button class="tab-action-btn" title="More Actions..." @click="handleMoreActions">
          <IconMore :size="14" />
        </button>
      </div>
    </div>

    <!-- Breadcrumb Bar -->
    <div class="breadcrumbs">
      <span class="breadcrumb-item">workspace</span>
      <template v-for="(segment, idx) in breadcrumbSegments" :key="idx">
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-item" :class="{ active: idx === breadcrumbSegments.length - 1 }">
          {{ segment }}
        </span>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFilesStore } from '@/stores/filesStore'
import { getFileExt } from '@/utils/fileUtils'
import { IconSplit, IconMore } from '@/components/icons'

const props = defineProps({
  openTabs: {
    type: Array,
    default: () => [{ id: 'index-html', name: 'index.html' }],
  },
  activeTabId: {
    type: String,
    default: 'index-html',
  },
})

defineEmits(['select-tab', 'close-tab'])

const filesStore = useFilesStore()

const currentFileName = computed(() => {
  const current = props.openTabs.find((t) => t.id === props.activeTabId)
  return current ? current.name : 'Untitled'
})

const breadcrumbSegments = computed(() => {
  const fullPath = filesStore.getFilePath
    ? filesStore.getFilePath(props.activeTabId)
    : currentFileName.value
  return (fullPath || currentFileName.value).split('/').filter(Boolean)
})

const handleSplitEditor = () => {
  /*
   * NEXT PHASE:
   * 1. Multi-pane editor layout: Split current tab side-by-side or stacked vertically.
   */
}

const handleMoreActions = () => {
  /*
   * NEXT PHASE:
   * 1. Tab actions dropdown: Close All Tabs, Close Others, Close Saved, Pin Tab.
   */
}
</script>

<style scoped>
.tabs-and-breadcrumbs {
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  user-select: none;
}

.tabs-container {
  height: 35px;
  background: #181818;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  overflow-x: auto;
}

.tabs-list {
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs-list::-webkit-scrollbar {
  display: none;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  background: #2d2d2d;
  color: var(--text-secondary);
  border-right: 1px solid var(--border-color);
  font-size: 13px;
  cursor: pointer;
  position: relative;
  transition:
    background 0.1s,
    color 0.1s;
  min-width: 120px;
  max-width: 180px;
}

.tab-item:hover {
  background: #252526;
  color: var(--text-primary);
}

.tab-item.active {
  background: var(--bg-primary);
  color: var(--text-bright);
}

.tab-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-blue);
}

.tab-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 3px;
  border-radius: 2px;
  font-family: var(--font-mono);
  line-height: 1;
}

.file-vue {
  background: rgba(65, 184, 131, 0.2);
  color: #41b883;
}

.file-js {
  background: rgba(247, 223, 30, 0.2);
  color: #f7df1e;
}

.file-css {
  background: rgba(38, 77, 228, 0.2);
  color: #61afef;
}

.file-html {
  background: rgba(227, 76, 38, 0.2);
  color: #e34c26;
}

.file-json {
  background: rgba(203, 192, 45, 0.2);
  color: #dcdcaa;
}

.file-md {
  background: rgba(100, 160, 255, 0.2);
  color: #4fc1ff;
}

.tab-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 11px;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.6;
  transition:
    opacity 0.15s,
    background 0.15s;
}

.tab-item:hover .tab-close-btn {
  opacity: 1;
}

.tab-close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-bright);
}

.tab-actions {
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 4px;
  background: #181818;
}

.tab-action-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-action-btn:hover {
  background: var(--bg-selected);
  color: var(--text-bright);
}

.breadcrumbs {
  height: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  background: var(--bg-primary);
  font-size: 11px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

.breadcrumb-sep {
  opacity: 0.5;
  font-size: 13px;
}

.breadcrumb-item.active {
  color: var(--text-primary);
}
</style>
