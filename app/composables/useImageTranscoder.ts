import type { ConvertedImage, ImageCropSelection, ImageOutputFormat, ImageTransformOptions, UploadedImagePreview } from '~/types/file-tool.type'
import { defaultImageOptions, imageFormatOptions } from '~/configs/file-tool.config'
import { replaceFileExtension } from '~/utils/file-name.util'
import { fileToImageData } from '~/utils/image-canvas.util'

export function useImageTranscoder() {
  const options = reactive<ImageTransformOptions>({ ...defaultImageOptions })
  const files = ref<File[]>([])
  const previews = ref<UploadedImagePreview[]>([])
  const results = ref<ConvertedImage[]>([])
  const isProcessing = ref(false)
  const isEstimating = ref(false)
  const error = ref('')

  const canConvert = computed(() => files.value.length > 0 && !isProcessing.value)

  async function addFiles(fileList: FileList | File[]) {
    const imageFiles = Array.from(fileList).filter(file => file.type.startsWith('image/'))
    const nextPreviews = await Promise.all(imageFiles.map(createImagePreview))
    const isFirstUpload = files.value.length === 0
    files.value = [...files.value, ...imageFiles]
    previews.value = [...previews.value, ...nextPreviews]

    if (isFirstUpload && nextPreviews[0]?.width && nextPreviews[0]?.height) {
      options.maxWidth = nextPreviews[0].width
      options.maxHeight = nextPreviews[0].height
      clearResults()
    }
  }

  function removeFile(index: number) {
    const preview = previews.value[index]

    if (preview)
      URL.revokeObjectURL(preview.url)

    files.value = files.value.filter((_, fileIndex) => fileIndex !== index)
    previews.value = previews.value.filter((_, previewIndex) => previewIndex !== index)
  }

  function setCropSelection(index: number, crop: ImageCropSelection) {
    const preview = previews.value[index]

    if (!preview)
      return

    previews.value = previews.value.map((item, previewIndex) => previewIndex === index ? { ...item, crop } : item)
    clearResults()
  }

  function clearCropSelection(index: number) {
    const preview = previews.value[index]

    if (!preview)
      return

    previews.value = previews.value.map((item, previewIndex) => {
      if (previewIndex !== index)
        return item

      const { crop: _crop, ...nextPreview } = item
      return nextPreview
    })
    clearResults()
  }

  function setPreviewOptions(index: number, nextOptions: ImageTransformOptions) {
    const preview = previews.value[index]

    if (!preview)
      return

    previews.value = previews.value.map((item, previewIndex) => previewIndex === index ? { ...item, options: cloneImageOptions(nextOptions) } : item)
    clearResults()
  }

  function clearPreviewOptions(index: number) {
    const preview = previews.value[index]

    if (!preview)
      return

    previews.value = previews.value.map((item, previewIndex) => {
      if (previewIndex !== index)
        return item

      const { options: _options, ...nextPreview } = item
      return nextPreview
    })
    clearResults()
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

  async function convert(index?: number) {
    if (!canConvert.value)
      return

    isProcessing.value = true
    error.value = ''
    clearResults()

    try {
      const nextResults: ConvertedImage[] = []
      const entries = typeof index === 'number'
        ? [[index, files.value[index]] as const]
        : files.value.map((file, fileIndex) => [fileIndex, file] as const)

      for (const [index, file] of entries) {
        if (!file)
          continue

        const preview = previews.value[index]
        const activeOptions = preview?.options ?? options
        const imageData = await fileToImageData(file, activeOptions.maxWidth, activeOptions.maxHeight, activeOptions.preserveDimensions, preview?.crop)
        const encoded = await encodeImage(imageData, activeOptions.format, activeOptions)
        const format = imageFormatOptions.find(item => item.value === activeOptions.format) ?? imageFormatOptions[0]!
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

  async function estimateOutputSizes(index?: number): Promise<Array<{ index: number, size: number }>> {
    if (files.value.length === 0)
      return []

    isEstimating.value = true

    try {
      const entries = typeof index === 'number'
        ? [[index, files.value[index]] as const]
        : files.value.map((file, fileIndex) => [fileIndex, file] as const)
      const sizes: Array<{ index: number, size: number }> = []

      for (const [fileIndex, file] of entries) {
        if (!file)
          continue

        const preview = previews.value[fileIndex]
        const activeOptions = preview?.options ?? options
        const imageData = await fileToImageData(file, activeOptions.maxWidth, activeOptions.maxHeight, activeOptions.preserveDimensions, preview?.crop)
        const encoded = await encodeImage(imageData, activeOptions.format, activeOptions)
        sizes.push({ index: fileIndex, size: encoded.byteLength })
      }

      return sizes
    }
    finally {
      isEstimating.value = false
    }
  }

  async function estimateOutputSize(index?: number): Promise<number> {
    const sizes = await estimateOutputSizes(index)
    return sizes.reduce((total, item) => total + item.size, 0)
  }

  onBeforeUnmount(() => {
    clearPreviews()
    clearResults()
  })

  return {
    addFiles,
    canConvert,
    clear,
    clearResults,
    convert,
    error,
    files,
    isEstimating,
    isProcessing,
    options,
    previews,
    removeFile,
    results,
    clearCropSelection,
    clearPreviewOptions,
    setPreviewOptions,
    setCropSelection,
    estimateOutputSizes,
    estimateOutputSize,
  }
}

async function createImagePreview(file: File): Promise<UploadedImagePreview> {
  const dimensions = await getImageDimensions(file)

  return {
    id: crypto.randomUUID(),
    file,
    url: URL.createObjectURL(file),
    width: dimensions.width,
    height: dimensions.height,
  }
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

function cloneImageOptions(options: ImageTransformOptions): ImageTransformOptions {
  return { ...options }
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
