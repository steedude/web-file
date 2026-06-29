import type { PDFDocument as PdfLibDocument } from 'pdf-lib'
import type { ConvertedImage, ImageCropSelection, ImageOutputFormat, ImagePdfOptions, ImageTransformOptions, PdfResult, UploadedImagePreview } from '~/types/file-tool.type'
import { defaultImageOptions, imageFormatOptions } from '~/configs/file-tool.config'
import { replaceFileExtension } from '~/utils/file-name.util'
import { fileToImageData } from '~/utils/image-canvas.util'

const supportedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const supportedImageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp'])

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
      const nextResults: ConvertedImage[] = []
      const entries = typeof index === 'number'
        ? [[index, files.value[index]] as const]
        : files.value.map((file, fileIndex) => [fileIndex, file] as const)

      for (const [_index, file] of entries) {
        if (!file)
          continue

        const imageData = await fileToImageData(file, options.maxWidth, options.maxHeight, options.preserveDimensions, options.cropPosition, previews.value[_index]?.crop, options.resizeMode, options.resizePercent)
        const encoded = await encodeImage(imageData, options.format, options)
        const format = imageFormatOptions.find(item => item.value === options.format) ?? imageFormatOptions[0]!
        const blob = new Blob([encoded], { type: format.mimeType })
        const fileName = getOutputFileName(file, format.extension, entries.length === 1 ? options.outputFileName : '')

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

  async function convertToPdf(pdfOptions: ImagePdfOptions) {
    if (!canConvert.value)
      return

    isProcessing.value = true
    error.value = ''
    clearResults()

    try {
      const { PDFDocument } = await import('pdf-lib')
      const document = await PDFDocument.create()

      for (const file of files.value) {
        const bitmap = await createImageBitmap(file)
        const pageSize = getImagePdfPageSize(pdfOptions.pageSize, bitmap.width, bitmap.height)
        const page = document.addPage([pageSize.width, pageSize.height])
        const margin = Math.min(Math.max(pdfOptions.margin, 0), Math.min(pageSize.width, pageSize.height) / 3)
        const targetWidth = pageSize.width - margin * 2
        const targetHeight = pageSize.height - margin * 2
        const fitted = fitRect(bitmap.width, bitmap.height, targetWidth, targetHeight, pdfOptions.fitMode)
        const image = await embedImage(document, file, bitmap)

        page.drawImage(image, {
          x: margin + (targetWidth - fitted.width) / 2,
          y: margin + (targetHeight - fitted.height) / 2,
          width: fitted.width,
          height: fitted.height,
        })

        bitmap.close()
      }

      const bytes = await document.save()
      const buffer = new ArrayBuffer(bytes.byteLength)
      new Uint8Array(buffer).set(bytes)
      const blob = new Blob([buffer], { type: 'application/pdf' })
      const fileName = files.value.length === 1 ? replaceFileExtension(files.value[0]?.name ?? 'image', 'pdf') : 'images.pdf'

      pdfResults.value = [{
        id: crypto.randomUUID(),
        fileName,
        size: blob.size,
        url: URL.createObjectURL(blob),
      }]
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
      const entries = typeof index === 'number'
        ? [[index, files.value[index]] as const]
        : files.value.map((file, fileIndex) => [fileIndex, file] as const)
      const sizes: Array<{ index: number, size: number }> = []

      for (const [fileIndex, file] of entries) {
        if (!file)
          continue

        const imageData = await fileToImageData(file, options.maxWidth, options.maxHeight, options.preserveDimensions, options.cropPosition, previews.value[fileIndex]?.crop, options.resizeMode, options.resizePercent)
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

function isSupportedImageFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (supportedImageMimeTypes.has(file.type))
    return supportedImageExtensions.has(extension) || extension === ''

  return supportedImageExtensions.has(extension)
}

function getOutputFileName(file: File, extension: string, outputFileName: string) {
  const cleanName = sanitiseFileName(outputFileName.trim())

  return replaceFileExtension(cleanName || file.name, extension)
}

function getFileBaseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '')
}

function sanitiseFileName(fileName: string) {
  return Array.from(fileName)
    .map(character => character.charCodeAt(0) < 32 || /[<>:"/\\|?*]/.test(character) ? '-' : character)
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
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

function getImagePdfPageSize(pageSize: ImagePdfOptions['pageSize'], imageWidth: number, imageHeight: number) {
  if (pageSize === 'a4')
    return { width: 595, height: 842 }

  if (pageSize === 'letter')
    return { width: 612, height: 792 }

  return { width: imageWidth, height: imageHeight }
}

function fitRect(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number, fitMode: ImagePdfOptions['fitMode']) {
  const scale = fitMode === 'cover'
    ? Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
    : Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)

  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  }
}

async function embedImage(pdfDocument: PdfLibDocument, file: File, bitmap: ImageBitmap) {
  if (file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name))
    return pdfDocument.embedJpg(await file.arrayBuffer())

  if (file.type === 'image/png' || /\.png$/i.test(file.name))
    return pdfDocument.embedPng(await file.arrayBuffer())

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context)
    throw new Error('Canvas 2D context is not available.')

  canvas.width = bitmap.width
  canvas.height = bitmap.height
  context.drawImage(bitmap, 0, 0)
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))

  if (!blob)
    throw new Error('Could not prepare image for PDF.')

  return pdfDocument.embedPng(await blob.arrayBuffer())
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
