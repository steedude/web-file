import type { ImageCropSelection } from '~/types/file-tool.type'

export async function fileToImageData(file: File, maxWidth: number, maxHeight: number, preserveDimensions: boolean, crop?: ImageCropSelection): Promise<ImageData> {
  const bitmap = await createImageBitmap(file)
  const source = getSourceRect(bitmap.width, bitmap.height, crop)
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

function getSourceRect(imageWidth: number, imageHeight: number, crop?: ImageCropSelection): ImageCropSelection {
  if (!crop)
    return { x: 0, y: 0, width: imageWidth, height: imageHeight }

  const x = Math.min(Math.max(Math.round(crop.x), 0), imageWidth - 1)
  const y = Math.min(Math.max(Math.round(crop.y), 0), imageHeight - 1)
  const width = Math.min(Math.max(Math.round(crop.width), 1), imageWidth - x)
  const height = Math.min(Math.max(Math.round(crop.height), 1), imageHeight - y)

  return { x, y, width, height }
}
