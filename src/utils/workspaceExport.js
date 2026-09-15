import JSZip from 'jszip'
import { getFileFullPath } from './pathUtils'

/**
 * Exports all virtual workspace files and folders into a downloadable ZIP archive.
 *
 * @param {Array<{ id: string, name: string, type: string, parentId?: string|null }>} filesMap
 * @param {Record<string, { id?: string, name?: string, path?: string, content?: string }>} fileContentMap
 * @param {string} [archiveName='js-editor-workspace.zip']
 */
export const exportWorkspaceZip = async (
  filesMap = [],
  fileContentMap = {},
  archiveName = 'js-editor-workspace.zip',
) => {
  const zip = new JSZip()

  // Iterate over files only
  const fileNodes = (filesMap || []).filter((f) => f.type === 'file')

  fileNodes.forEach((file) => {
    const fullPath = getFileFullPath(file, filesMap) || file.name
    // Extract content from fileContentMap
    const contentObj = fileContentMap[file.id] || fileContentMap[file.name]
    const content = typeof contentObj === 'string' ? contentObj : (contentObj?.content ?? '')

    zip.file(fullPath, content)
  })

  // Generate the ZIP blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  // Create temporary link to trigger download in browser
  const downloadUrl = URL.createObjectURL(zipBlob)
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = archiveName
  document.body.appendChild(anchor)
  anchor.click()

  // Clean up resource
  setTimeout(() => {
    document.body.removeChild(anchor)
    URL.revokeObjectURL(downloadUrl)
  }, 1000)
}

export default exportWorkspaceZip
