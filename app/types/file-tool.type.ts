export type ToolMode = 'image' | 'pdf'

export type ImageOutputFormat = 'jpeg' | 'png' | 'webp'

export interface ImageTransformOptions {
  format: ImageOutputFormat
  quality: number
  maxWidth: number
  maxHeight: number
  preserveDimensions: boolean
  optimisePng: boolean
  webpLossless: boolean
}

export interface ConvertedImage {
  id: string
  sourceName: string
  fileName: string
  originalSize: number
  outputSize: number
  width: number
  height: number
  mimeType: string
  url: string
}

export interface ImageCropSelection {
  x: number
  y: number
  width: number
  height: number
}

export interface UploadedImagePreview {
  id: string
  file: File
  url: string
  crop?: ImageCropSelection
}

export type PdfMode = 'merge' | 'split' | 'edit'

export interface PdfOptions {
  mode: PdfMode
  ranges: string
  rotation: number
  title: string
  author: string
}

export interface PdfResult {
  id: string
  fileName: string
  size: number
  url: string
}
