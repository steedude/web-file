import type { ImagePdfOptions, ImageTransformOptions, PdfOptions } from '~/types/file-tool.type'
import { ImageOutputFormats, ImagePdfPageSizes, ImageResizeModes, PdfImageOutputFormats, PdfModes, PdfWatermarkPreviewScales } from '~/types/file-tool.type'

export const imageFormatOptions = [
  { value: ImageOutputFormats.Jpeg, mimeType: 'image/jpeg', extension: 'jpg' },
  { value: ImageOutputFormats.Png, mimeType: 'image/png', extension: 'png' },
  { value: ImageOutputFormats.Webp, mimeType: 'image/webp', extension: 'webp' },
]

export const defaultImageOptions: ImageTransformOptions = {
  format: ImageOutputFormats.Webp,
  outputFileName: '',
  quality: 78,
  maxWidth: 1920,
  maxHeight: 1920,
  resizeMode: ImageResizeModes.Percent,
  resizePercent: 100,
  preserveDimensions: true,
  optimisePng: true,
  webpLossless: false,
}

export const imagePdfPageSizeOptions = Object.values(ImagePdfPageSizes)

export const defaultImagePdfOptions: ImagePdfOptions = {
  pageSize: ImagePdfPageSizes.Image,
  margin: 0,
}

export const pdfModeOptions = Object.values(PdfModes)
export const pdfWatermarkPreviewScaleOptions = Object.values(PdfWatermarkPreviewScales)
export const pdfImageFormatOptions = Object.values(PdfImageOutputFormats)

export const defaultPdfOptions: PdfOptions = {
  mode: PdfModes.Merge,
  watermarkText: 'web file',
  watermarkFontSize: 48,
  watermarkOpacity: 25,
  watermarkRotation: -30,
  watermarkColor: '#6dff9d',
  watermarkPreviewScale: PdfWatermarkPreviewScales.Full,
  imageFormat: PdfImageOutputFormats.Png,
  imageQuality: 90,
  imageScale: 2,
}
