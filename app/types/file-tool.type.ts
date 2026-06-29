export type ToolMode = 'image' | 'pdf'

export type ImageOutputFormat = 'jpeg' | 'png' | 'webp'
export type ImageCropPosition = 'none' | 'center' | 'top' | 'bottom' | 'left' | 'right'
export type ImageResizeMode = 'dimensions' | 'percent'

export interface ImageCropSelection {
  x: number
  y: number
  width: number
  height: number
}

export interface ImageTransformOptions {
  format: ImageOutputFormat
  outputFileName: string
  quality: number
  maxWidth: number
  maxHeight: number
  resizeMode: ImageResizeMode
  resizePercent: number
  preserveDimensions: boolean
  cropPosition: ImageCropPosition
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

export interface UploadedImagePreview {
  id: string
  file: File
  url: string
  width: number
  height: number
  crop?: ImageCropSelection
}

export type PdfMode = 'merge' | 'split'

export interface PdfOptions {
  mode: PdfMode
}

export interface PdfResult {
  id: string
  fileName: string
  size: number
  url: string
}

export interface PdfPageItem {
  id: string
  file: File
  sourceName: string
  pageIndex: number
  pageNumber: number
  thumbnailUrl: string
  selected: boolean
}
