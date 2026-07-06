export const AppErrorCodes = {
  ImageDecodeFailed: 'IMAGE_DECODE_FAILED',
  ImageEncodeFailed: 'IMAGE_ENCODE_FAILED',
  ImagePdfCreateFailed: 'IMAGE_PDF_CREATE_FAILED',
  ImagePreviewFailed: 'IMAGE_PREVIEW_FAILED',
  ImageUnsupportedFormat: 'IMAGE_UNSUPPORTED_FORMAT',
  PdfLoadFailed: 'PDF_LOAD_FAILED',
  PdfMergeFailed: 'PDF_MERGE_FAILED',
  PdfPreviewFailed: 'PDF_PREVIEW_FAILED',
  PdfRenderImageFailed: 'PDF_RENDER_IMAGE_FAILED',
  PdfSplitFailed: 'PDF_SPLIT_FAILED',
  PdfWatermarkFailed: 'PDF_WATERMARK_FAILED',
  PwaInstallFailed: 'PWA_INSTALL_FAILED',
  Unknown: 'UNKNOWN_ERROR',
} as const

export const AppErrorFeatures = {
  ImageConvert: 'image-convert',
  ImagePreview: 'image-preview',
  ImageToPdf: 'image-to-pdf',
  PdfMerge: 'pdf-merge',
  PdfPreview: 'pdf-preview',
  PdfSplit: 'pdf-split',
  PdfToImage: 'pdf-to-image',
  PdfWatermark: 'pdf-watermark',
  PwaInstall: 'pwa-install',
  System: 'system',
} as const

export const AppErrorSeverities = {
  Error: 'error',
  Fatal: 'fatal',
  Info: 'info',
  Warning: 'warning',
} as const

export const AppErrorMessages = {
  [AppErrorCodes.ImageDecodeFailed]: 'Image decode failed.',
  [AppErrorCodes.ImageEncodeFailed]: 'Image conversion failed.',
  [AppErrorCodes.ImagePdfCreateFailed]: 'Image to PDF failed.',
  [AppErrorCodes.ImagePreviewFailed]: 'Image preview failed.',
  [AppErrorCodes.ImageUnsupportedFormat]: 'Unsupported image format.',
  [AppErrorCodes.PdfLoadFailed]: 'PDF load failed.',
  [AppErrorCodes.PdfMergeFailed]: 'PDF merge failed.',
  [AppErrorCodes.PdfPreviewFailed]: 'PDF preview failed.',
  [AppErrorCodes.PdfRenderImageFailed]: 'PDF to image failed.',
  [AppErrorCodes.PdfSplitFailed]: 'PDF split failed.',
  [AppErrorCodes.PdfWatermarkFailed]: 'PDF watermark failed.',
  [AppErrorCodes.PwaInstallFailed]: 'PWA install prompt failed.',
  [AppErrorCodes.Unknown]: 'Unexpected application error.',
} as const
