<template>
  <div class="monaco-wrapper">
    <!-- Monaco mount container -->
    <div v-show="activeFile" ref="editorContainerRef" class="monaco-container"></div>

    <!-- Empty state when no tab/file is selected -->
    <div v-if="!activeFile" class="empty-editor">
      <div class="empty-content">
        <IconFile :size="48" :stroke-width="1.5" />
        <h3>No file open</h3>
        <p>Select a file from the explorer on the left to start editing</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useFilesStore } from '@/stores/filesStore'
import { useEditorStore } from '@/stores/editorStore'
import { IconFile } from '@/components/icons'

const props = defineProps({
  activeFile: {
    type: Object,
    default: null,
  },
  activeTabId: {
    type: String,
    default: 'index-html',
  },
})

const fileStore = useFilesStore()
const editorStore = useEditorStore()
const editorContainerRef = ref(null)

onMounted(() => {
  if (editorContainerRef.value) {
    editorStore.initEditor(
      editorContainerRef.value,
      fileStore.fileContentMap,
      props.activeTabId || 'index-html',
      (fileId, newContent) => {
        if (fileStore.fileContentMap[fileId]) {
          fileStore.fileContentMap[fileId].content = newContent
        }
      },
    )
  }
})

onBeforeUnmount(() => {
  editorStore.disposeEditor()
})

/*
 * NEXT PHASE:
 * 1. Split Editor View: Add Monaco DiffEditor and multi-column side-by-side editing.
 * 2. Breadcrumbs Code Navigation: Click function/class symbol breadcrumbs to jump cursor.
 * 3. In-Editor Find & Replace widget overlay (Cmd+F / Cmd+H).
 */
</script>

<style scoped>
.monaco-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.monaco-container {
  width: 100%;
  height: 100%;
}

.empty-editor {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  color: var(--text-secondary);
}

.empty-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-content :deep(svg) {
  opacity: 0.3;
}

.empty-content h3 {
  font-size: 16px;
  color: var(--text-primary);
}

.empty-content p {
  font-size: 13px;
  max-width: 320px;
}
</style>
