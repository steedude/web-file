import type { AppErrorCode } from '~/types/error.type'
import { AppErrorCodes } from '~/configs/error-code.config'

export function useAppErrorLang() {
  const { t } = useI18n()

  function getAppErrorMessage(code: AppErrorCode) {
    const messages = {
      [AppErrorCodes.ImageDecodeFailed]: t('appErrors.imageDecodeFailed'),
      [AppErrorCodes.ImageEncodeFailed]: t('appErrors.imageEncodeFailed'),
      [AppErrorCodes.ImagePdfCreateFailed]: t('appErrors.imagePdfCreateFailed'),
      [AppErrorCodes.ImagePreviewFailed]: t('appErrors.imagePreviewFailed'),
      [AppErrorCodes.ImageUnsupportedFormat]: t('appErrors.imageUnsupportedFormat'),
      [AppErrorCodes.PdfLoadFailed]: t('appErrors.pdfLoadFailed'),
      [AppErrorCodes.PdfMergeFailed]: t('appErrors.pdfMergeFailed'),
      [AppErrorCodes.PdfPreviewFailed]: t('appErrors.pdfPreviewFailed'),
      [AppErrorCodes.PdfRenderImageFailed]: t('appErrors.pdfRenderImageFailed'),
      [AppErrorCodes.PdfSplitFailed]: t('appErrors.pdfSplitFailed'),
      [AppErrorCodes.PdfWatermarkFailed]: t('appErrors.pdfWatermarkFailed'),
      [AppErrorCodes.PwaInstallFailed]: t('appErrors.pwaInstallFailed'),
      [AppErrorCodes.Unknown]: t('appErrors.unknown'),
    }

    return messages[code]
  }

  return {
    getAppErrorMessage,
  }
}
