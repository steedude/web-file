import type { PdfOptions, PdfResult } from '~/types/file-tool.type'
import { degrees, PDFDocument } from 'pdf-lib'
import { defaultPdfOptions } from '~/configs/file-tool.config'
import { appendFileSuffix } from '~/utils/file-name.util'
import { parsePageRanges } from '~/utils/pdf-range.util'

export function usePdfWorkshop() {
  const options = reactive<PdfOptions>({ ...defaultPdfOptions })
  const files = ref<File[]>([])
  const results = ref<PdfResult[]>([])
  const isProcessing = ref(false)
  const error = ref('')

  const canRun = computed(() => files.value.length > 0 && !isProcessing.value)

  watch(() => options.mode, (mode) => {
    clearResults()
    error.value = ''

    if (mode !== 'merge' && files.value.length > 1)
      files.value = files.value.slice(0, 1)
  })

  function addFiles(fileList: FileList | File[]) {
    const pdfFiles = Array.from(fileList).filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))

    if (pdfFiles.length === 0)
      return

    clearResults()
    error.value = ''
    files.value = options.mode === 'merge' ? [...files.value, ...pdfFiles] : pdfFiles.slice(0, 1)
  }

  function removeFile(index: number) {
    files.value = files.value.filter((_, fileIndex) => fileIndex !== index)
  }

  function clear() {
    files.value = []
    clearResults()
    error.value = ''
  }

  function clearResults() {
    for (const result of results.value)
      URL.revokeObjectURL(result.url)

    results.value = []
  }

  async function run() {
    if (!canRun.value)
      return

    isProcessing.value = true
    error.value = ''
    clearResults()

    try {
      const firstFile = files.value[0]

      if (options.mode === 'merge')
        results.value = [await mergePdfs(files.value)]
      else if (options.mode === 'split' && firstFile)
        results.value = await extractPdfPages(firstFile, options.ranges)
      else if (firstFile)
        results.value = [await editPdf(firstFile, options)]
    }
    catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'PDF processing failed.'
    }
    finally {
      isProcessing.value = false
    }
  }

  onBeforeUnmount(clearResults)

  return {
    addFiles,
    canRun,
    clear,
    error,
    files,
    isProcessing,
    options,
    removeFile,
    results,
    run,
  }
}

async function mergePdfs(files: File[]): Promise<PdfResult> {
  const output = await PDFDocument.create()

  for (const file of files) {
    const source = await PDFDocument.load(await file.arrayBuffer())
    const copiedPages = await output.copyPages(source, source.getPageIndices())
    copiedPages.forEach(page => output.addPage(page))
  }

  return pdfDocumentToResult(output, 'merged.pdf')
}

async function extractPdfPages(file: File, ranges: string): Promise<PdfResult[]> {
  const source = await PDFDocument.load(await file.arrayBuffer())
  const indexes = parsePageRanges(ranges, source.getPageCount())
  const output = await PDFDocument.create()
  const copiedPages = await output.copyPages(source, indexes)
  copiedPages.forEach(page => output.addPage(page))

  return [await pdfDocumentToResult(output, appendFileSuffix(file.name, 'extracted'))]
}

async function editPdf(file: File, options: PdfOptions): Promise<PdfResult> {
  const output = await PDFDocument.load(await file.arrayBuffer())

  if (options.title.trim())
    output.setTitle(options.title.trim())

  if (options.author.trim())
    output.setAuthor(options.author.trim())

  if (options.rotation !== 0) {
    for (const page of output.getPages())
      page.setRotation(degrees(options.rotation))
  }

  return pdfDocumentToResult(output, appendFileSuffix(file.name, 'edited'))
}

async function pdfDocumentToResult(document: PDFDocument, fileName: string): Promise<PdfResult> {
  const bytes = await document.save()
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  const blob = new Blob([buffer], { type: 'application/pdf' })

  return {
    id: crypto.randomUUID(),
    fileName,
    size: blob.size,
    url: URL.createObjectURL(blob),
  }
}
