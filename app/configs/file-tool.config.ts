import type { ImageOutputFormat, ImageTransformOptions, PdfMode, PdfOptions } from '~/types/file-tool.type'

export const imageFormatOptions: Array<{ value: ImageOutputFormat, mimeType: string, extension: string }> = [
  { value: 'jpeg', mimeType: 'image/jpeg', extension: 'jpg' },
  { value: 'png', mimeType: 'image/png', extension: 'png' },
  { value: 'webp', mimeType: 'image/webp', extension: 'webp' },
]

export const defaultImageOptions: ImageTransformOptions = {
  format: 'webp',
  quality: 78,
  maxWidth: 1920,
  maxHeight: 1920,
  preserveDimensions: false,
  optimisePng: true,
}

export const pdfModeOptions: PdfMode[] = ['merge', 'split', 'edit']

export const defaultPdfOptions: PdfOptions = {
  mode: 'merge',
  ranges: '1-end',
  rotation: 0,
  title: '',
  author: '',
}

export const rotationOptions = [0, 90, 180, 270]
