import type { ImagePdfPageSize, PdfMode } from '~/types/file-tool.type'
import { ImagePdfPageSizes, PdfModes } from '~/types/file-tool.type'

export function useFileToolLang() {
  const { t } = useI18n()

  function getPdfModeLabel(mode: PdfMode) {
    const labels = {
      [PdfModes.Merge]: t('pdf.merge'),
      [PdfModes.Split]: t('pdf.split'),
      [PdfModes.Watermark]: t('pdf.watermark'),
      [PdfModes.Images]: t('pdf.images'),
    }

    return labels[mode]
  }

  function getImagePdfPageSizeLabel(pageSize: ImagePdfPageSize) {
    const labels = {
      [ImagePdfPageSizes.Image]: t('image.pdfPageSizes.image'),
      [ImagePdfPageSizes.A4]: t('image.pdfPageSizes.a4'),
      [ImagePdfPageSizes.Letter]: t('image.pdfPageSizes.letter'),
    }

    return labels[pageSize]
  }

  return {
    getImagePdfPageSizeLabel,
    getPdfModeLabel,
  }
}
