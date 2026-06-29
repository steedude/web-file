import type { ConvertedImage, ImageOutputFormat, ImageTransformOptions, UploadedImagePreview } from '~/types/file-tool.type'
import { defaultImageOptions, imageFormatOptions } from '~/configs/file-tool.config'
import { replaceFileExtension } from '~/utils/file-name.util'
import { fileToImageData } from '~/utils/image-canvas.util'

export function useImageTranscoder() {
  const options = reactive<ImageTransformOptions>({ ...defaultImageOptions })
  const files = ref<File[]>([])
  const previews = ref<UploadedImagePreview[]>([])
  const results = ref<ConvertedImage[]>([])
  const isProcessing = ref(false)
  const error = ref('')

  const canConvert = computed(() => files.value.length > 0 && !isProcessing.value)

  function addFiles(fileList: FileList | File[]) {
    const imageFiles = Array.from(fileList).filter(file => file.type.startsWith('image/'))
    files.value = [...files.value, ...imageFiles]
    previews.value = [
      ...previews.value,
      ...imageFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      })),
    ]
  }

  function removeFile(index: number) {
    const preview = previews.value[index]

    if (preview)
      URL.revokeObjectURL(preview.url)

    files.value = files.value.filter((_, fileIndex) => fileIndex !== index)
    previews.value = previews.value.filter((_, previewIndex) => previewIndex !== index)
  }

  function clear() {
    files.value = []
    clearPreviews()
    clearResults()
    error.value = ''
  }

  function clearPreviews() {
    for (const preview of previews.value)
      URL.revokeObjectURL(preview.url)

    previews.value = []
  }

  function clearResults() {
    for (const result of results.value)
      URL.revokeObjectURL(result.url)

    results.value = []
  }

  async function convert() {
    if (!canConvert.value)
      return

    isProcessing.value = true
    error.value = ''
    clearResults()

    try {
      const nextResults: ConvertedImage[] = []

      for (const file of files.value) {
        const imageData = await fileToImageData(file, options.maxWidth, options.maxHeight, options.preserveDimensions)
        const encoded = await encodeImage(imageData, options.format, options)
        const format = imageFormatOptions.find(item => item.value === options.format) ?? imageFormatOptions[0]!
        const blob = new Blob([encoded], { type: format.mimeType })
        const fileName = replaceFileExtension(file.name, format.extension)

        nextResults.push({
          id: crypto.randomUUID(),
          sourceName: file.name,
          fileName,
          originalSize: file.size,
          outputSize: blob.size,
          width: imageData.width,
          height: imageData.height,
          mimeType: format.mimeType,
          url: URL.createObjectURL(blob),
        })
      }

      results.value = nextResults
    }
    catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Image conversion failed.'
    }
    finally {
      isProcessing.value = false
    }
  }

  onBeforeUnmount(() => {
    clearPreviews()
    clearResults()
  })

  return {
    addFiles,
    canConvert,
    clear,
    convert,
    error,
    files,
    isProcessing,
    options,
    previews,
    removeFile,
    results,
  }
}

async function encodeImage(imageData: ImageData, format: ImageOutputFormat, options: ImageTransformOptions): Promise<ArrayBuffer> {
  if (format === 'jpeg') {
    const { encode } = await import('@jsquash/jpeg')
    return encode(imageData, {
      quality: options.quality,
      progressive: true,
      optimize_coding: true,
    })
  }

  if (format === 'webp') {
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

  const { optimise } = await import('@jsquash/oxipng')
  return optimise(png, {
    level: 2,
    interlace: false,
    optimiseAlpha: true,
  })
}
