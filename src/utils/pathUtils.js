/**
 * Resolves the full relative workspace path of a file or folder by walking up the directory tree in filesMap.
 *
 * @param {string|{ id?: string, name: string, parentId?: string|null }} itemOrId - File/folder node or id
 * @param {Array<{ id: string, name: string, parentId?: string|null }>} [filesMap] - Flat list of tree nodes
 * @returns {string} - Full relative path (e.g. 'src/app.js')
 */
export const getFileFullPath = (itemOrId, filesMap = []) => {
  if (!itemOrId) return ''

  const map = Array.isArray(filesMap) ? filesMap : []
  let item = typeof itemOrId === 'object' && itemOrId !== null ? itemOrId : null

  if (!item && typeof itemOrId === 'string') {
    item = map.find((f) => f.id === itemOrId || f.name === itemOrId)
    if (!item) {
      return itemOrId.replace(/^\.?\//, '')
    }
  }

  const segments = [item.name]
  let currentParentId = item.parentId
  let depth = 0
  const visited = new Set([item.id || item.name])

  while (currentParentId && depth < 50) {
    const parent = map.find((f) => f.id === currentParentId)
    if (!parent || visited.has(parent.id)) break
    visited.add(parent.id)
    segments.unshift(parent.name)
    currentParentId = parent.parentId
    depth++
  }

  return segments.join('/')
}

export default {
  getFileFullPath,
}
