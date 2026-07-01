import type { PDFDocument as PdfLibDocument } from 'pdf-lib'
import type { ImagePdfOptions, PdfResult } from '~/types/file-tool.type'
import { ImagePdfFitModeValue, ImagePdfPageSizeValue } from '~/types/file-tool.type'
import { replaceFileExtension } from '~/utils/file-name.util'

export async function createImagePdf(files: File[], pdfOptions: ImagePdfOptions): Promise<PdfResult> {
  const { PDFDocument } = await import('pdf-lib')
  const document = await PDFDocument.create()

  for (const file of files) {
    const bitmap = await createImageBitmap(file)
    const pageSize = getImagePdfPageSize(pdfOptions.pageSize, bitmap.width, bitmap.height)
    const page = document.addPage([pageSize.width, pageSize.height])
    const margin = Math.min(Math.max(pdfOptions.margin, 0), Math.min(pageSize.width, pageSize.height) / 3)
    const targetWidth = pageSize.width - margin * 2
    const targetHeight = pageSize.height - margin * 2
    const fitted = fitRect(bitmap.width, bitmap.height, targetWidth, targetHeight, pdfOptions.fitMode)
    const image = await embedImage(document, file, bitmap)

    page.drawImage(image, {
      x: margin + (targetWidth - fitted.width) / 2,
      y: margin + (targetHeight - fitted.height) / 2,
      width: fitted.width,
      height: fitted.height,
    })

    bitmap.close()
  }

  const fileName = files.length === 1 ? replaceFileExtension(files[0]?.name ?? 'image', 'pdf') : 'images.pdf'
  return pdfDocumentToResult(document, fileName)
}

function getImagePdfPageSize(pageSize: ImagePdfOptions['pageSize'], imageWidth: number, imageHeight: number) {
  if (pageSize === ImagePdfPageSizeValue.A4)
    return { width: 595, height: 842 }

  if (pageSize === ImagePdfPageSizeValue.Letter)
    return { width: 612, height: 792 }

  return { width: imageWidth, height: imageHeight }
}

function fitRect(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number, fitMode: ImagePdfOptions['fitMode']) {
  const scale = fitMode === ImagePdfFitModeValue.Cover
    ? Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
    : Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)

  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  }
}

async function embedImage(pdfDocument: PdfLibDocument, file: File, bitmap: ImageBitmap) {
  if (file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name))
    return pdfDocument.embedJpg(await file.arrayBuffer())

  if (file.type === 'image/png' || /\.png$/i.test(file.name))
    return pdfDocument.embedPng(await file.arrayBuffer())

  // pdf-lib 只能直接嵌 JPEG/PNG，WebP 先轉成 PNG 再放進 PDF。
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context)
    throw new Error('Canvas 2D context is not available.')

  canvas.width = bitmap.width
  canvas.height = bitmap.height
  context.drawImage(bitmap, 0, 0)
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))

  if (!blob)
    throw new Error('Could not prepare image for PDF.')

  return pdfDocument.embedPng(await blob.arrayBuffer())
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
