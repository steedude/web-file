import type { ImageCropPosition, ImageCropSelection, ImageResizeMode } from '~/types/file-tool.type'
import { ImageCropPositionValue, ImageResizeModeValue } from '~/types/file-tool.type'

interface SourceRect {
  x: number
  y: number
  width: number
  height: number
}

export async function fileToImageData(file: File, maxWidth: number, maxHeight: number, preserveDimensions: boolean, cropPosition: ImageCropPosition, crop: ImageCropSelection | undefined, resizeMode: ImageResizeMode, resizePercent: number): Promise<ImageData> {
  const bitmap = await createImageBitmap(file)
  // 手動裁切優先於批次裁切；百分比縮放只縮整張圖，不再套用裁切位置。
  const effectiveCropPosition = resizeMode === ImageResizeModeValue.Percent ? ImageCropPositionValue.None : cropPosition
  const source = crop ? getManualCropRect(bitmap.width, bitmap.height, crop) : getSourceRect(bitmap.width, bitmap.height, maxWidth, maxHeight, preserveDimensions ? ImageCropPositionValue.None : effectiveCropPosition)
  const scale = getScale(source, maxWidth, maxHeight, preserveDimensions, resizeMode, resizePercent)
  const width = Math.max(1, Math.round(source.width * scale))
  const height = Math.max(1, Math.round(source.height * scale))
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context)
    throw new Error('Canvas 2D context is not available.')

  canvas.width = width
  canvas.height = height
  context.drawImage(bitmap, source.x, source.y, source.width, source.height, 0, 0, width, height)
  bitmap.close()

  return context.getImageData(0, 0, width, height)
}

function getScale(source: SourceRect, maxWidth: number, maxHeight: number, preserveDimensions: boolean, resizeMode: ImageResizeMode, resizePercent: number): number {
  if (preserveDimensions)
    return 1

  if (resizeMode === ImageResizeModeValue.Percent)
    return Math.min(1, Math.max(1, Math.min(100, resizePercent)) / 100)

  // 目前尺寸模式只做等比例縮小，不放大，避免輸出看起來比來源糊。
  return Math.min(1, maxWidth / source.width, maxHeight / source.height)
}

function getManualCropRect(imageWidth: number, imageHeight: number, crop: ImageCropSelection): SourceRect {
  const x = Math.min(Math.max(Math.round(crop.x), 0), imageWidth - 1)
  const y = Math.min(Math.max(Math.round(crop.y), 0), imageHeight - 1)
  const width = Math.min(Math.max(Math.round(crop.width), 1), imageWidth - x)
  const height = Math.min(Math.max(Math.round(crop.height), 1), imageHeight - y)

  return { x, y, width, height }
}

function getSourceRect(imageWidth: number, imageHeight: number, targetWidth: number, targetHeight: number, cropPosition: ImageCropPosition): SourceRect {
  if (cropPosition === ImageCropPositionValue.None)
    return { x: 0, y: 0, width: imageWidth, height: imageHeight }

  const imageRatio = imageWidth / imageHeight
  const targetRatio = targetWidth / targetHeight
  let width = imageWidth
  let height = imageHeight

  if (imageRatio > targetRatio)
    width = Math.round(imageHeight * targetRatio)
  else
    height = Math.round(imageWidth / targetRatio)

  const x = getCropOffset(imageWidth, width, cropPosition, 'x')
  const y = getCropOffset(imageHeight, height, cropPosition, 'y')

  return { x, y, width, height }
}

function getCropOffset(sourceSize: number, cropSize: number, cropPosition: ImageCropPosition, axis: 'x' | 'y'): number {
  if ((axis === 'x' && cropPosition === ImageCropPositionValue.Left) || (axis === 'y' && cropPosition === ImageCropPositionValue.Top))
    return 0

  if ((axis === 'x' && cropPosition === ImageCropPositionValue.Right) || (axis === 'y' && cropPosition === ImageCropPositionValue.Bottom))
    return sourceSize - cropSize

  return Math.round((sourceSize - cropSize) / 2)
}
