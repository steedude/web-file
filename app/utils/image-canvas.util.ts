import type { ImageCropPosition } from '~/types/file-tool.type'

interface SourceRect {
  x: number
  y: number
  width: number
  height: number
}

export async function fileToImageData(file: File, maxWidth: number, maxHeight: number, preserveDimensions: boolean, cropPosition: ImageCropPosition): Promise<ImageData> {
  const bitmap = await createImageBitmap(file)
  const source = getSourceRect(bitmap.width, bitmap.height, maxWidth, maxHeight, preserveDimensions ? 'none' : cropPosition)
  const scale = preserveDimensions ? 1 : Math.min(1, maxWidth / source.width, maxHeight / source.height)
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

function getSourceRect(imageWidth: number, imageHeight: number, targetWidth: number, targetHeight: number, cropPosition: ImageCropPosition): SourceRect {
  if (cropPosition === 'none')
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
  if ((axis === 'x' && cropPosition === 'left') || (axis === 'y' && cropPosition === 'top'))
    return 0

  if ((axis === 'x' && cropPosition === 'right') || (axis === 'y' && cropPosition === 'bottom'))
    return sourceSize - cropSize

  return Math.round((sourceSize - cropSize) / 2)
}
