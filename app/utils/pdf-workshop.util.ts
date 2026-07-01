import type { PDFDocument as PdfLibDocument, PDFPage } from 'pdf-lib'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { ConvertedImage, PdfOptions, PdfPageItem, PdfResult } from '~/types/file-tool.type'
import { PdfImageOutputFormatValue } from '~/types/file-tool.type'
import { appendFileSuffix } from '~/utils/file-name.util'

export async function mergePdfPages(pages: PdfPageItem[]): Promise<PdfResult> {
  const { PDFDocument } = await import('pdf-lib')
  const output = await PDFDocument.create()
  const sources = new Map<File, PdfLibDocument>()

  for (const page of pages) {
    // 同一份 PDF 可能被取多頁，快取 parsed document 可以少做幾次 load。
    const source = await getSourceDocument(page.file, sources)
    const [copiedPage] = await output.copyPages(source, [page.pageIndex])

    if (copiedPage)
      output.addPage(copiedPage)
  }

  return pdfDocumentToResult(output, 'merged.pdf')
}

export async function extractPdfPages(file: File, selectedPages: PdfPageItem[]): Promise<PdfResult[]> {
  const { PDFDocument } = await import('pdf-lib')
  const source = await PDFDocument.load(await file.arrayBuffer())
  const indexes = selectedPages.map(page => page.pageIndex)
  const output = await PDFDocument.create()
  const copiedPages = await output.copyPages(source, indexes)
  copiedPages.forEach(page => output.addPage(page))

  return [await pdfDocumentToResult(output, appendFileSuffix(file.name, 'extracted'))]
}

export async function watermarkPdf(file: File, options: PdfOptions): Promise<PdfResult> {
  const { PDFDocument, StandardFonts, degrees, rgb } = await import('pdf-lib')
  const document = await PDFDocument.load(await file.arrayBuffer())
  const font = await document.embedFont(StandardFonts.HelveticaBold)
  const pages = document.getPages()
  const text = options.watermarkText.trim() || 'web file'
  const color = hexToRgb(options.watermarkColor)

  for (const page of pages) {
    const textWidth = font.widthOfTextAtSize(text, options.watermarkFontSize)
    const opacity = Math.max(5, Math.min(100, options.watermarkOpacity)) / 100
    const { x, y } = getWatermarkPosition(page, textWidth)

    page.drawText(text, {
      x,
      y,
      size: options.watermarkFontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(options.watermarkRotation),
    })
  }

  return pdfDocumentToResult(document, appendFileSuffix(file.name, 'watermark'))
}

export async function renderPdfPagesAsImages(pages: PdfPageItem[], options: PdfOptions): Promise<ConvertedImage[]> {
  const results: ConvertedImage[] = []
  const documents = new Map<File, PDFDocumentProxy>()

  for (const page of pages) {
    const previewDocument = await getPreviewDocument(page.file, documents)
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

export async function createPdfPageItems(files: File[], selected: boolean): Promise<PdfPageItem[]> {
  const items: PdfPageItem[] = []

  for (const file of files) {
    const document = await loadPdfPreviewDocument(file)

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1)
      items.push(await createPdfPageItem(file, document, pageNumber, selected))
  }

  return items
}

async function loadPdfPreviewDocument(file: File): Promise<PDFDocumentProxy> {
  // pdf.js worker 只在預覽或轉圖片時載入，首頁初始 bundle 不先扛這包。
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
  // 縮圖只用來排序與勾選，固定寬度比完整解析度省記憶體。
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

async function getSourceDocument(file: File, sources: Map<File, PdfLibDocument>) {
  const { PDFDocument } = await import('pdf-lib')
  const cachedDocument = sources.get(file)

  if (cachedDocument)
    return cachedDocument

  const document = await PDFDocument.load(await file.arrayBuffer())
  sources.set(file, document)
  return document
}

async function getPreviewDocument(file: File, documents: Map<File, PDFDocumentProxy>) {
  const cachedDocument = documents.get(file)

  if (cachedDocument)
    return cachedDocument

  const document = await loadPdfPreviewDocument(file)
  documents.set(file, document)
  return document
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

function getWatermarkPosition(page: PDFPage, textWidth: number) {
  const { width, height } = page.getSize()

  return { x: (width - textWidth) / 2, y: height / 2 }
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
