import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { PdfOptions, PdfPageItem, PdfResult } from '~/types/file-tool.type'
import { PDFDocument } from 'pdf-lib'
import { defaultPdfOptions } from '~/configs/file-tool.config'
import { appendFileSuffix } from '~/utils/file-name.util'

export function usePdfWorkshop() {
  const options = reactive<PdfOptions>({ ...defaultPdfOptions })
  const files = ref<File[]>([])
  const pages = ref<PdfPageItem[]>([])
  const results = ref<PdfResult[]>([])
  const isProcessing = ref(false)
  const isRenderingPages = ref(false)
  const error = ref('')

  const activePages = computed(() => options.mode === 'split' ? pages.value.filter(page => page.selected) : pages.value)
  const canRun = computed(() => activePages.value.length > 0 && !isProcessing.value && !isRenderingPages.value)

  watch(() => options.mode, (mode) => {
    clearResults()
    error.value = ''

    if (mode !== 'merge' && files.value.length > 1)
      files.value = files.value.slice(0, 1)

    if (mode !== 'merge' && files.value[0])
      pages.value = pages.value.filter(page => page.file === files.value[0])

    pages.value = pages.value.map(page => ({ ...page, selected: mode === 'split' ? page.selected : true }))
  })

  async function addFiles(fileList: FileList | File[]) {
    const pdfFiles = Array.from(fileList).filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))

    if (pdfFiles.length === 0)
      return

    clearResults()
    error.value = ''
    const nextFiles = options.mode === 'merge' ? pdfFiles : pdfFiles.slice(0, 1)

    if (options.mode !== 'merge') {
      clearPages()
      files.value = []
    }

    isRenderingPages.value = true

    try {
      const nextPages = await createPdfPageItems(nextFiles, options.mode === 'split')
      files.value = options.mode === 'merge' ? [...files.value, ...nextFiles] : nextFiles
      pages.value = options.mode === 'merge' ? [...pages.value, ...nextPages] : nextPages
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

    results.value = []
  }

  function clearPages() {
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

      if (options.mode === 'merge')
        results.value = [await mergePdfPages(activePages.value)]
      else if (options.mode === 'split' && firstFile)
        results.value = await extractPdfPages(firstFile, activePages.value)
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
    pages,
    isRenderingPages,
    isProcessing,
    movePage,
    options,
    removePage,
    removeFile,
    results,
    run,
    selectAllPages,
    togglePageSelection,
  }
}

async function mergePdfPages(pages: PdfPageItem[]): Promise<PdfResult> {
  const output = await PDFDocument.create()
  const sources = new Map<File, PDFDocument>()

  for (const page of pages) {
    const source = await getSourceDocument(page.file, sources)
    const [copiedPage] = await output.copyPages(source, [page.pageIndex])

    if (copiedPage)
      output.addPage(copiedPage)
  }

  return pdfDocumentToResult(output, 'merged.pdf')
}

async function extractPdfPages(file: File, selectedPages: PdfPageItem[]): Promise<PdfResult[]> {
  const source = await PDFDocument.load(await file.arrayBuffer())
  const indexes = selectedPages.map(page => page.pageIndex)
  const output = await PDFDocument.create()
  const copiedPages = await output.copyPages(source, indexes)
  copiedPages.forEach(page => output.addPage(page))

  return [await pdfDocumentToResult(output, appendFileSuffix(file.name, 'extracted'))]
}

async function getSourceDocument(file: File, sources: Map<File, PDFDocument>) {
  const cachedDocument = sources.get(file)

  if (cachedDocument)
    return cachedDocument

  const document = await PDFDocument.load(await file.arrayBuffer())
  sources.set(file, document)
  return document
}

async function createPdfPageItems(files: File[], selected: boolean): Promise<PdfPageItem[]> {
  const items: PdfPageItem[] = []

  for (const file of files) {
    const document = await loadPdfPreviewDocument(file)

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1)
      items.push(await createPdfPageItem(file, document, pageNumber, selected))
  }

  return items
}

async function loadPdfPreviewDocument(file: File): Promise<PDFDocumentProxy> {
  const [{ getDocument, GlobalWorkerOptions }, workerUrl] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.mjs?url'),
  ])

  GlobalWorkerOptions.workerSrc = workerUrl.default

  return getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
}

async function createPdfPageItem(file: File, pdfDocument: PDFDocumentProxy, pageNumber: number, selected: boolean): Promise<PdfPageItem> {
  const page = await pdfDocument.getPage(pageNumber)
  const viewport = page.getViewport({ scale: 1 })
  const targetWidth = 144
  const scale = targetWidth / viewport.width
  const scaledViewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context)
    throw new Error('Could not render PDF page preview.')

  canvas.width = Math.ceil(scaledViewport.width)
  canvas.height = Math.ceil(scaledViewport.height)
  await page.render({ canvas, canvasContext: context, viewport: scaledViewport }).promise

  const thumbnailUrl = await canvasToObjectUrl(canvas)

  return {
    id: crypto.randomUUID(),
    file,
    sourceName: file.name,
    pageIndex: pageNumber - 1,
    pageNumber,
    thumbnailUrl,
    selected,
  }
}

async function canvasToObjectUrl(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.72))

  if (!blob)
    throw new Error('Could not create PDF page thumbnail.')

  return URL.createObjectURL(blob)
}

async function pdfDocumentToResult(document: PDFDocument, fileName: string): Promise<PdfResult> {
  const bytes = await document.save()
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  const blob = new Blob([buffer], { type: 'application/pdf' })

  return {
    id: crypto.randomUUID(),
    fileName,
    size: blob.size,
    url: URL.createObjectURL(blob),
  }
}
