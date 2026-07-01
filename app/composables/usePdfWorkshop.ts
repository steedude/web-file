import type { PDFDocument as PdfLibDocument, PDFPage } from 'pdf-lib'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { ConvertedImage, PdfOptions, PdfPageItem, PdfResult } from '~/types/file-tool.type'
import { defaultPdfOptions } from '~/configs/file-tool.config'
import { PdfImageOutputFormatValue, PdfModeValue } from '~/types/file-tool.type'
import { appendFileSuffix } from '~/utils/file-name.util'

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
    files.value = []
    clearPages()
    clearResults()
    error.value = ''
  })

  async function addFiles(fileList: FileList | File[]) {
    const pdfFiles = Array.from(fileList).filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))

    if (pdfFiles.length === 0)
      return

    clearResults()
    error.value = ''
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

async function mergePdfPages(pages: PdfPageItem[]): Promise<PdfResult> {
  const { PDFDocument } = await import('pdf-lib')
  const output = await PDFDocument.create()
  const sources = new Map<File, PdfLibDocument>()

  for (const page of pages) {
    const source = await getSourceDocument(page.file, sources)
    const [copiedPage] = await output.copyPages(source, [page.pageIndex])

    if (copiedPage)
      output.addPage(copiedPage)
  }

  return pdfDocumentToResult(output, 'merged.pdf')
}

async function extractPdfPages(file: File, selectedPages: PdfPageItem[]): Promise<PdfResult[]> {
  const { PDFDocument } = await import('pdf-lib')
  const source = await PDFDocument.load(await file.arrayBuffer())
  const indexes = selectedPages.map(page => page.pageIndex)
  const output = await PDFDocument.create()
  const copiedPages = await output.copyPages(source, indexes)
  copiedPages.forEach(page => output.addPage(page))

  return [await pdfDocumentToResult(output, appendFileSuffix(file.name, 'extracted'))]
}

async function watermarkPdf(file: File, options: PdfOptions): Promise<PdfResult> {
  const { PDFDocument, StandardFonts, degrees, rgb } = await import('pdf-lib')
  const document = await PDFDocument.load(await file.arrayBuffer())
  const font = await document.embedFont(StandardFonts.HelveticaBold)
  const pages = document.getPages()
  const text = options.watermarkText.trim() || 'web file'
  const color = hexToRgb(options.watermarkColor)

  for (const page of pages) {
    const textWidth = font.widthOfTextAtSize(text, options.watermarkFontSize)
    const opacity = Math.max(5, Math.min(100, options.watermarkOpacity)) / 100
    const rotation = degrees(options.watermarkRotation)
    const draw = (x: number, y: number) => page.drawText(text, {
      x,
      y,
      size: options.watermarkFontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: rotation,
    })

    const { x, y } = getWatermarkPosition(page, textWidth)
    draw(x, y)
  }

  return pdfDocumentToResult(document, appendFileSuffix(file.name, 'watermark'))
}

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '')
  const value = /^[\da-f]{6}$/i.test(cleanHex) ? cleanHex : '6dff9d'

  return {
    r: Number.parseInt(value.slice(0, 2), 16) / 255,
    g: Number.parseInt(value.slice(2, 4), 16) / 255,
    b: Number.parseInt(value.slice(4, 6), 16) / 255,
  }
}

async function getSourceDocument(file: File, sources: Map<File, PdfLibDocument>) {
  const { PDFDocument } = await import('pdf-lib')
  const cachedDocument = sources.get(file)

  if (cachedDocument)
    return cachedDocument

  const document = await PDFDocument.load(await file.arrayBuffer())
  sources.set(file, document)
  return document
}

async function renderPdfPagesAsImages(pages: PdfPageItem[], options: PdfOptions): Promise<ConvertedImage[]> {
  const results: ConvertedImage[] = []

  for (const page of pages) {
    const previewDocument = await loadPdfPreviewDocument(page.file)
    const pdfPage = await previewDocument.getPage(page.pageNumber)
    const viewport = pdfPage.getViewport({ scale: options.imageScale })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context)
      throw new Error('Could not render PDF page image.')

    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    await pdfPage.render({ canvas, canvasContext: context, viewport }).promise

    const mimeType = getPdfImageMimeType(options.imageFormat)
    const blob = await canvasToBlob(canvas, mimeType, options.imageQuality / 100)
    const extension = options.imageFormat === PdfImageOutputFormatValue.Jpeg ? 'jpg' : options.imageFormat

    results.push({
      id: crypto.randomUUID(),
      sourceName: page.sourceName,
      fileName: appendFileSuffix(page.sourceName, `page-${page.pageNumber}`).replace(/\.pdf$/i, `.${extension}`),
      originalSize: page.file.size,
      outputSize: blob.size,
      width: canvas.width,
      height: canvas.height,
      mimeType,
      url: URL.createObjectURL(blob),
    })
  }

  return results
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

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob)
        resolve(blob)
      else
        reject(new Error('Could not create image output.'))
    }, mimeType, quality)
  })
}

function getPdfImageMimeType(format: PdfOptions['imageFormat']) {
  if (format === PdfImageOutputFormatValue.Jpeg)
    return 'image/jpeg'

  if (format === PdfImageOutputFormatValue.Webp)
    return 'image/webp'

  return 'image/png'
}

function getWatermarkPosition(page: PDFPage, textWidth: number) {
  const { width, height } = page.getSize()

  return { x: (width - textWidth) / 2, y: height / 2 }
}

async function pdfDocumentToResult(document: PdfLibDocument, fileName: string): Promise<PdfResult> {
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
