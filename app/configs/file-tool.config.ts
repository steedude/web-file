import type { ImagePdfOptions, ImageTransformOptions, PdfOptions } from '~/types/file-tool.type'
import { ImageOutputFormatValue, ImagePdfFitModeValue, ImagePdfPageSizeValue, ImageResizeModeValue, PdfImageOutputFormatValue, PdfModeValue, PdfWatermarkPreviewScaleValue } from '~/types/file-tool.type'

export const imageFormatOptions = [
  { value: ImageOutputFormatValue.Jpeg, mimeType: 'image/jpeg', extension: 'jpg' },
  { value: ImageOutputFormatValue.Png, mimeType: 'image/png', extension: 'png' },
  { value: ImageOutputFormatValue.Webp, mimeType: 'image/webp', extension: 'webp' },
]

export const defaultImageOptions: ImageTransformOptions = {
  format: ImageOutputFormatValue.Webp,
  outputFileName: '',
  quality: 78,
  maxWidth: 1920,
  maxHeight: 1920,
  resizeMode: ImageResizeModeValue.Percent,
  resizePercent: 100,
  preserveDimensions: true,
  optimisePng: true,
  webpLossless: false,
}

export const imagePdfPageSizeOptions = Object.values(ImagePdfPageSizeValue)
export const imagePdfFitModeOptions = Object.values(ImagePdfFitModeValue)

export const defaultImagePdfOptions: ImagePdfOptions = {
  pageSize: ImagePdfPageSizeValue.Image,
  fitMode: ImagePdfFitModeValue.Contain,
  margin: 0,
}

export const pdfModeOptions = Object.values(PdfModeValue)
export const pdfWatermarkPreviewScaleOptions = Object.values(PdfWatermarkPreviewScaleValue)
export const pdfImageFormatOptions = Object.values(PdfImageOutputFormatValue)

export const defaultPdfOptions: PdfOptions = {
  mode: PdfModeValue.Merge,
  watermarkText: 'web file',
  watermarkFontSize: 48,
  watermarkOpacity: 25,
  watermarkRotation: -30,
  watermarkColor: '#6dff9d',
  watermarkPreviewScale: PdfWatermarkPreviewScaleValue.Full,
  imageFormat: PdfImageOutputFormatValue.Png,
  imageQuality: 90,
  imageScale: 2,
}
