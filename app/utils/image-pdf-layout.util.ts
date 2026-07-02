import type { ImagePdfOptions, ImageRotation } from '~/types/file-tool.type'
import { ImagePdfPageSizeValue } from '~/types/file-tool.type'

export interface PdfSize {
  width: number
  height: number
}

export interface PdfRect extends PdfSize {
  x: number
  y: number
}

export function getRotatedImageSize(width: number, height: number, rotation: ImageRotation): PdfSize {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)

  return rotation === 90 || rotation === 270
    ? { width: safeHeight, height: safeWidth }
    : { width: safeWidth, height: safeHeight }
}

export function getImagePdfPageSize(pageSize: ImagePdfOptions['pageSize'], imageWidth: number, imageHeight: number): PdfSize {
  if (pageSize === ImagePdfPageSizeValue.A4)
    return { width: 595, height: 842 }

  if (pageSize === ImagePdfPageSizeValue.Letter)
    return { width: 612, height: 792 }

  return { width: imageWidth, height: imageHeight }
}

export function normalisePdfMargin(margin: number, pageSize: PdfSize) {
  return Math.min(Math.max(margin, 0), Math.min(pageSize.width, pageSize.height) / 3)
}

export function fitImageIntoPage(imageSize: PdfSize, pageSize: PdfSize, margin: number): PdfRect {
  const safeMargin = normalisePdfMargin(margin, pageSize)
  const targetWidth = Math.max(1, pageSize.width - safeMargin * 2)
  const targetHeight = Math.max(1, pageSize.height - safeMargin * 2)
  const scale = Math.min(targetWidth / imageSize.width, targetHeight / imageSize.height)
  const width = imageSize.width * scale
  const height = imageSize.height * scale

  return {
    height,
    width,
    x: safeMargin + (targetWidth - width) / 2,
    y: safeMargin + (targetHeight - height) / 2,
  }
}

export function getRotatedDrawRect(rect: PdfRect, rotation: ImageRotation): PdfRect {
  if (rotation === 90) {
    return {
      height: rect.width,
      width: rect.height,
      x: rect.x + rect.width,
      y: rect.y,
    }
  }

  if (rotation === 180) {
    return {
      ...rect,
      x: rect.x + rect.width,
      y: rect.y + rect.height,
    }
  }

  if (rotation === 270) {
    return {
      height: rect.width,
      width: rect.height,
      x: rect.x,
      y: rect.y + rect.height,
    }
  }

  return rect
}
