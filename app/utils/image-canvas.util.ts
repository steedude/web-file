export async function fileToImageData(file: File, maxWidth: number, maxHeight: number, preserveDimensions: boolean): Promise<ImageData> {
  const bitmap = await createImageBitmap(file)
  const scale = preserveDimensions ? 1 : Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context)
    throw new Error('Canvas 2D context is not available.')

  canvas.width = width
  canvas.height = height
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return context.getImageData(0, 0, width, height)
}
