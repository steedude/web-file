import type { ConvertedImage, ImageCropSelection, ImagePdfOptions, ImageTransformOptions, PdfResult, UploadedImagePreview } from '~/types/file-tool.type'
import { defaultImageOptions } from '~/configs/file-tool.config'
import { fileToImageData } from '~/utils/image-canvas.util'
import { createImagePdf } from '~/utils/image-pdf.util'
import { createConvertedImage, createImagePreview, encodeImage, getFileBaseName, isSupportedImageFile } from '~/utils/image-transcode.util'

export function useImageTranscoder() {
  const options = reactive<ImageTransformOptions>({ ...defaultImageOptions })
  const files = ref<File[]>([])
  const previews = ref<UploadedImagePreview[]>([])
  const results = ref<ConvertedImage[]>([])
  const pdfResults = ref<PdfResult[]>([])
  const isProcessing = ref(false)
  const isEstimating = ref(false)
  const error = ref('')

  const canConvert = computed(() => files.value.length > 0 && !isProcessing.value)

  async function addFiles(fileList: FileList | File[], replace = false) {
    // 單張模式會整批替換，批次模式則累加；兩邊共用同一個 preview 結構。
    const imageFiles = Array.from(fileList).filter(isSupportedImageFile)
    const nextPreviews = await Promise.all(imageFiles.map(createImagePreview))
    const isFirstUpload = replace || files.value.length === 0

    if (replace) {
      files.value = []
      clearPreviews()
      clearResults()
    }

    files.value = replace ? imageFiles : [...files.value, ...imageFiles]
    previews.value = replace ? nextPreviews : [...previews.value, ...nextPreviews]

    if (isFirstUpload && nextPreviews[0]?.width && nextPreviews[0]?.height) {
      // 第一張圖決定初始尺寸，避免 UI 還停在 1920 這類通用預設值。
      options.maxWidth = nextPreviews[0].width
      options.maxHeight = nextPreviews[0].height
      options.outputFileName = getFileBaseName(nextPreviews[0].file.name)
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
    previews.value = previews.value.map((preview, previewIndex) => previewIndex === index ? { ...preview, crop } : preview)
    clearResults()
  }

  function clearCropSelection(index: number) {
    previews.value = previews.value.map((preview, previewIndex) => {
      if (previewIndex !== index)
        return preview

      const { crop: _crop, ...rest } = preview
      return rest
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

    for (const result of pdfResults.value)
      URL.revokeObjectURL(result.url)

    results.value = []
    pdfResults.value = []
  }

  function resetOptions() {
    Object.assign(options, defaultImageOptions)
    clearResults()
  }

  async function convert(index?: number) {
    if (!canConvert.value)
      return

    isProcessing.value = true
    error.value = ''
    clearResults()

    try {
      const entries = getFileEntries(index)
      const nextResults: ConvertedImage[] = []

      for (const [fileIndex, file] of entries) {
        // 正式轉檔和估算都走同一條 File -> ImageData -> encoder 路徑，數字才不會對不上。
        const imageData = await createTransformedImageData(fileIndex, file)
        const encoded = await encodeImage(imageData, options.format, options)
        nextResults.push(createConvertedImage(file, imageData, encoded, options.outputFileName, entries.length, options.format))
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

  async function convertToPdf(pdfOptions: ImagePdfOptions) {
    if (!canConvert.value)
      return

    isProcessing.value = true
    error.value = ''
    clearResults()

    try {
      pdfResults.value = [await createImagePdf(files.value, pdfOptions)]
    }
    catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Image to PDF failed.'
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
      const sizes: Array<{ index: number, size: number }> = []

      for (const [fileIndex, file] of getFileEntries(index)) {
        const imageData = await createTransformedImageData(fileIndex, file)
        const encoded = await encodeImage(imageData, options.format, options)
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

  function getFileEntries(index?: number) {
    if (typeof index === 'number') {
      const file = files.value[index]
      return file ? [[index, file] as const] : []
    }

    return files.value.map((file, fileIndex) => [fileIndex, file] as const)
  }

  function createTransformedImageData(index: number, file: File) {
    // crop 只來自單張模式的手動裁切；批次目前只做整張圖等比例縮放。
    return fileToImageData(file, options.maxWidth, options.maxHeight, options.preserveDimensions, previews.value[index]?.crop, options.resizeMode, options.resizePercent)
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
    clearCropSelection,
    convert,
    convertToPdf,
    error,
    files,
    isEstimating,
    isProcessing,
    options,
    pdfResults,
    previews,
    removeFile,
    resetOptions,
    results,
    setCropSelection,
    estimateOutputSizes,
    estimateOutputSize,
  }
}
