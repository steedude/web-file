import type { ImageCropPosition, ImageOutputFormat, ImagePdfFitMode, ImagePdfOptions, ImagePdfPageSize, ImageTransformOptions, PdfImageOutputFormat, PdfMode, PdfOptions, PdfWatermarkPosition } from '~/types/file-tool.type'

export const imageFormatOptions: Array<{ value: ImageOutputFormat, mimeType: string, extension: string }> = [
  { value: 'jpeg', mimeType: 'image/jpeg', extension: 'jpg' },
  { value: 'png', mimeType: 'image/png', extension: 'png' },
  { value: 'webp', mimeType: 'image/webp', extension: 'webp' },
]

export const defaultImageOptions: ImageTransformOptions = {
  format: 'webp',
  outputFileName: '',
  quality: 78,
  maxWidth: 1920,
  maxHeight: 1920,
  resizeMode: 'percent',
  resizePercent: 100,
  preserveDimensions: false,
  cropPosition: 'none',
  optimisePng: true,
  webpLossless: false,
}

export const imageCropPositionOptions: ImageCropPosition[] = ['none', 'center', 'top', 'bottom', 'left', 'right']

export const imagePdfPageSizeOptions: ImagePdfPageSize[] = ['image', 'a4', 'letter']
export const imagePdfFitModeOptions: ImagePdfFitMode[] = ['contain', 'cover']

export const defaultImagePdfOptions: ImagePdfOptions = {
  pageSize: 'image',
  fitMode: 'contain',
  margin: 0,
}

export const pdfModeOptions: PdfMode[] = ['merge', 'split', 'watermark', 'images']
export const pdfWatermarkPositionOptions: PdfWatermarkPosition[] = ['center', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'tile']
export const pdfImageFormatOptions: PdfImageOutputFormat[] = ['png', 'jpeg', 'webp']

export const defaultPdfOptions: PdfOptions = {
  mode: 'merge',
  watermarkText: 'web file',
  watermarkFontSize: 48,
  watermarkOpacity: 25,
  watermarkRotation: -30,
  watermarkPosition: 'center',
  watermarkColor: '#6dff9d',
  imageFormat: 'png',
  imageQuality: 90,
  imageScale: 2,
}
