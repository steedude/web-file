import type { ConvertedImage, PdfOptions, PdfPageItem, PdfResult } from '~/types/file-tool.type'
import { defaultPdfOptions } from '~/configs/file-tool.config'
import { PdfModeValue } from '~/types/file-tool.type'
import { createPdfPageItems, extractPdfPages, mergePdfPages, renderPdfPagesAsImages, watermarkPdf } from '~/utils/pdf-workshop.util'

// 只有擷取與轉圖片需要勾選頁面；合併和浮水印使用目前頁面清單即可。
const selectablePdfModes = new Set<PdfOptions['mode']>([PdfModeValue.Split, PdfModeValue.Images])

export function usePdfWorkshop() {
  const options = reactive<PdfOptions>({ ...defaultPdfOptions })
  const files = ref<File[]>([])
  const pages = ref<PdfPageItem[]>([])
  const results = ref<PdfResult[]>([])
  const imageResults = ref<ConvertedImage[]>([])
  const isProcessing = ref(false)
  const isRenderingPages = ref(false)
  const error = ref('')

  const activePages = computed(() => selectablePdfModes.has(options.mode) ? pages.value.filter(page => page.selected) : pages.value)
  const canRun = computed(() => activePages.value.length > 0 && !isProcessing.value && !isRenderingPages.value)

  watch(() => options.mode, () => {
    // PDF 模式的檔案限制不同，切換時直接清空可以避開舊頁面狀態混進新流程。
    files.value = []
    clearPages()
    clearResults()
    error.value = ''
  })

  async function addFiles(fileList: FileList | File[]) {
    const pdfFiles = Array.from(fileList).filter(isPdfFile)

    if (pdfFiles.length === 0)
      return

    clearResults()
    error.value = ''

    // 合併可以收多份 PDF；其他模式先收單份，避免頁碼來源變得難判斷。
    const nextFiles = options.mode === PdfModeValue.Merge ? pdfFiles : pdfFiles.slice(0, 1)

    if (options.mode !== PdfModeValue.Merge) {
      clearPages()
      files.value = []
    }

    isRenderingPages.value = true

    try {
      const nextPages = await createPdfPageItems(nextFiles, selectablePdfModes.has(options.mode))
      files.value = options.mode === PdfModeValue.Merge ? [...files.value, ...nextFiles] : nextFiles
      pages.value = options.mode === PdfModeValue.Merge ? [...pages.value, ...nextPages] : nextPages
    }
    catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'PDF preview failed.'
    }
    finally {
      isRenderingPages.value = false
    }
  }

  function removeFile(index: number) {
    const file = files.value[index]

    if (file)
      removePages(page => page.file === file)

    files.value = files.value.filter((_, fileIndex) => fileIndex !== index)
  }

  function clear() {
    files.value = []
    clearPages()
    clearResults()
    error.value = ''
  }

  function removePage(id: string) {
    removePages(page => page.id === id)
  }

  function movePage(fromIndex: number, toIndex: number) {
    const nextPages = [...pages.value]
    const [page] = nextPages.splice(fromIndex, 1)

    if (!page)
      return

    nextPages.splice(toIndex, 0, page)
    pages.value = nextPages
    clearResults()
  }

  function reorderPages(nextPages: PdfPageItem[]) {
    pages.value = nextPages
    clearResults()
  }

  function togglePageSelection(id: string) {
    pages.value = pages.value.map(page => page.id === id ? { ...page, selected: !page.selected } : page)
    clearResults()
  }

  function selectAllPages(selected: boolean) {
    pages.value = pages.value.map(page => ({ ...page, selected }))
    clearResults()
  }

  function clearResults() {
    for (const result of results.value)
      URL.revokeObjectURL(result.url)

    for (const result of imageResults.value)
      URL.revokeObjectURL(result.url)

    results.value = []
    imageResults.value = []
  }

  function clearPages() {
    // 縮圖都是 object URL，頁面清單變動時要跟著釋放。
    for (const page of pages.value)
      URL.revokeObjectURL(page.thumbnailUrl)

    pages.value = []
  }

  function removePages(predicate: (page: PdfPageItem) => boolean) {
    const removedPages = pages.value.filter(predicate)

    for (const page of removedPages)
      URL.revokeObjectURL(page.thumbnailUrl)

    pages.value = pages.value.filter(page => !predicate(page))
    clearResults()
  }

  async function run() {
    if (!canRun.value)
      return

    isProcessing.value = true
    error.value = ''
    clearResults()

    try {
      const firstFile = files.value[0]

      // 真正的 PDF 處理在 util；composable 只負責依照目前模式分派。
      if (options.mode === PdfModeValue.Merge)
        results.value = [await mergePdfPages(activePages.value)]
      else if (options.mode === PdfModeValue.Split && firstFile)
        results.value = await extractPdfPages(firstFile, activePages.value)
      else if (options.mode === PdfModeValue.Watermark && firstFile)
        results.value = [await watermarkPdf(firstFile, options)]
      else if (options.mode === PdfModeValue.Images)
        imageResults.value = await renderPdfPagesAsImages(activePages.value, options)
    }
    catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'PDF processing failed.'
    }
    finally {
      isProcessing.value = false
    }
  }

  onBeforeUnmount(() => {
    clearPages()
    clearResults()
  })

  return {
    addFiles,
    canRun,
    clear,
    error,
    files,
    imageResults,
    pages,
    isRenderingPages,
    isProcessing,
    movePage,
    options,
    removePage,
    removeFile,
    reorderPages,
    results,
    run,
    selectAllPages,
    togglePageSelection,
  }
}

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}
