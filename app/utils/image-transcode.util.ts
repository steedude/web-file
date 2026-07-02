import type { ConvertedImage, ImageOutputFormat, ImageTransformOptions, UploadedImagePreview } from '~/types/file-tool.type'
import { imageFormatOptions } from '~/configs/file-tool.config'
import { ImageOutputFormatValue, ImageRotationValue } from '~/types/file-tool.type'
import { replaceFileExtension } from '~/utils/file-name.util'

const supportedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const supportedImageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp'])

export function isSupportedImageFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (supportedImageMimeTypes.has(file.type))
    return supportedImageExtensions.has(extension) || extension === ''

  return supportedImageExtensions.has(extension)
}

export function getFileBaseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '')
}

export function createConvertedImage(file: File, imageData: ImageData, encoded: ArrayBuffer, outputFileName: string, resultCount: number, format: ImageOutputFormat): ConvertedImage {
  const formatOption = imageFormatOptions.find(item => item.value === format) ?? imageFormatOptions[0]!
  const blob = new Blob([encoded], { type: formatOption.mimeType })
  // 批次輸出保留各自原檔名；只有單張模式才套用使用者輸入的檔名。
  const fileName = getOutputFileName(file, formatOption.extension, resultCount === 1 ? outputFileName : '')

  return {
    id: crypto.randomUUID(),
    sourceName: file.name,
    fileName,
    originalSize: file.size,
    outputSize: blob.size,
    width: imageData.width,
    height: imageData.height,
    mimeType: formatOption.mimeType,
    url: URL.createObjectURL(blob),
  }
}

export async function createImagePreview(file: File): Promise<UploadedImagePreview> {
  const dimensions = await getImageDimensions(file)

  return {
    id: crypto.randomUUID(),
    file,
    url: URL.createObjectURL(file),
    width: dimensions.width,
    height: dimensions.height,
    rotation: ImageRotationValue.Deg0,
  }
}

export async function encodeImage(imageData: ImageData, format: ImageOutputFormat, options: ImageTransformOptions): Promise<ArrayBuffer> {
  if (format === ImageOutputFormatValue.Jpeg) {
    const { encode } = await import('@jsquash/jpeg')
    return encode(imageData, {
      quality: options.quality,
      progressive: true,
      optimize_coding: true,
    })
  }

  if (format === ImageOutputFormatValue.Webp) {
    const { encode } = await import('@jsquash/webp')
    return encode(imageData, {
      quality: options.webpLossless ? 100 : options.quality,
      method: 4,
      alpha_quality: options.webpLossless ? 100 : options.quality,
      lossless: options.webpLossless ? 1 : 0,
      near_lossless: 100,
      thread_level: 1,
    })
  }

  const { encode } = await import('@jsquash/png')
  const png = await encode(imageData)

  if (!options.optimisePng)
    return png

  // PNG 這裡是無損最佳化，不吃 quality，避免 UI 暗示有失真壓縮。
  const { optimise } = await import('@jsquash/oxipng')
  return optimise(png, {
    level: 2,
    interlace: false,
    optimiseAlpha: true,
  })
}

async function getImageDimensions(file: File): Promise<{ width: number, height: number }> {
  try {
    const bitmap = await createImageBitmap(file)
    const dimensions = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return dimensions
  }
  catch {
    return { width: 0, height: 0 }
  }
}

function getOutputFileName(file: File, extension: string, outputFileName: string) {
  const cleanName = sanitiseFileName(outputFileName.trim())

  return replaceFileExtension(cleanName || file.name, extension)
}

function sanitiseFileName(fileName: string) {
  return Array.from(fileName)
    .map(character => character.charCodeAt(0) < 32 || /[<>:"/\\|?*]/.test(character) ? '-' : character)
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}
