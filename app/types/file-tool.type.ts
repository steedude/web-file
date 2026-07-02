export const ToolModeValue = {
  Image: 'image',
  Pdf: 'pdf',
} as const
export type ToolMode = typeof ToolModeValue[keyof typeof ToolModeValue]

export const ImageOutputFormatValue = {
  Jpeg: 'jpeg',
  Png: 'png',
  Webp: 'webp',
} as const
export type ImageOutputFormat = typeof ImageOutputFormatValue[keyof typeof ImageOutputFormatValue]

export const ImageModeValue = {
  Batch: 'batch',
  Single: 'single',
  Pdf: 'pdf',
} as const
export type ImageMode = typeof ImageModeValue[keyof typeof ImageModeValue]

export const ImageResizeModeValue = {
  Dimensions: 'dimensions',
  Percent: 'percent',
} as const
export type ImageResizeMode = typeof ImageResizeModeValue[keyof typeof ImageResizeModeValue]

export const ImagePdfPageSizeValue = {
  Image: 'image',
  A4: 'a4',
  Letter: 'letter',
} as const
export type ImagePdfPageSize = typeof ImagePdfPageSizeValue[keyof typeof ImagePdfPageSizeValue]

export const ImageRotationValue = {
  Deg0: 0,
  Deg90: 90,
  Deg180: 180,
  Deg270: 270,
} as const
export type ImageRotation = typeof ImageRotationValue[keyof typeof ImageRotationValue]

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
  optimisePng: boolean
  webpLossless: boolean
}

export interface ImageControlActions {
  commitEstimate: () => void
  openCrop: () => void
  setOptimisePng: (optimisePng: boolean) => void
  setPreserveDimensions: (preserveDimensions: boolean) => void
  setProportionalResize: () => void
  setResizeMode: (resizeMode: ImageResizeMode) => void
  setWebpLossless: (webpLossless: boolean) => void
  updateFormat: (event: Event) => void
  updateHeight: (event: Event) => void
  updateOutputFileName: (event: Event) => void
  updateQuality: (event: Event) => void
  updateResizePercent: (event: Event) => void
  updateWidth: (event: Event) => void
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

export interface ImagePdfOptions {
  pageSize: ImagePdfPageSize
  margin: number
}

export interface UploadedImagePreview {
  id: string
  file: File
  url: string
  width: number
  height: number
  rotation: ImageRotation
  crop?: ImageCropSelection
}

export const PdfModeValue = {
  Merge: 'merge',
  Split: 'split',
  Watermark: 'watermark',
  Images: 'images',
} as const
export type PdfMode = typeof PdfModeValue[keyof typeof PdfModeValue]

export const PdfImageOutputFormatValue = {
  Png: 'png',
  Jpeg: 'jpeg',
  Webp: 'webp',
} as const
export type PdfImageOutputFormat = typeof PdfImageOutputFormatValue[keyof typeof PdfImageOutputFormatValue]

export const PdfWatermarkPreviewScaleValue = {
  Quarter: 25,
  Half: 50,
  ThreeQuarter: 75,
  Full: 100,
} as const
export type PdfWatermarkPreviewScale = typeof PdfWatermarkPreviewScaleValue[keyof typeof PdfWatermarkPreviewScaleValue]

export interface PdfOptions {
  mode: PdfMode
  watermarkText: string
  watermarkFontSize: number
  watermarkOpacity: number
  watermarkRotation: number
  watermarkColor: string
  watermarkPreviewScale: PdfWatermarkPreviewScale
  imageFormat: PdfImageOutputFormat
  imageQuality: number
  imageScale: number
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
