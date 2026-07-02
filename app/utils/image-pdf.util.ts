import type { PDFDocument as PdfLibDocument } from 'pdf-lib'
import type { ImagePdfOptions, PdfResult, UploadedImagePreview } from '~/types/file-tool.type'
import { replaceFileExtension } from '~/utils/file-name.util'
import { fitImageIntoPage, getImagePdfPageSize, getRotatedDrawRect, getRotatedImageSize } from '~/utils/image-pdf-layout.util'

export async function createImagePdf(previews: UploadedImagePreview[], pdfOptions: ImagePdfOptions): Promise<PdfResult> {
  const { degrees, PDFDocument } = await import('pdf-lib')
  const document = await PDFDocument.create()

  for (const preview of previews) {
    const file = preview.file
    const bitmap = await createImageBitmap(file)

    try {
      const rotatedSize = getRotatedImageSize(bitmap.width, bitmap.height, preview.rotation)
      const pageSize = getImagePdfPageSize(pdfOptions.pageSize, rotatedSize.width, rotatedSize.height)
      const page = document.addPage([pageSize.width, pageSize.height])
      const fitted = fitImageIntoPage(rotatedSize, pageSize, pdfOptions.margin)
      const drawRect = getRotatedDrawRect(fitted, preview.rotation)
      const image = await embedImage(document, file, bitmap)

      page.drawImage(image, {
        height: drawRect.height,
        rotate: degrees(preview.rotation),
        width: drawRect.width,
        x: drawRect.x,
        y: drawRect.y,
      })
    }
    finally {
      bitmap.close()
    }
  }

  const fileName = previews.length === 1 ? replaceFileExtension(previews[0]?.file.name ?? 'image', 'pdf') : 'images.pdf'
  return pdfDocumentToResult(document, fileName)
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
