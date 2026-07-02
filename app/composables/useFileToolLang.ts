import type { ImagePdfPageSize, PdfMode } from '~/types/file-tool.type'
import { ImagePdfPageSizeValue, PdfModeValue } from '~/types/file-tool.type'

export function useFileToolLang() {
  const { t } = useI18n()

  function getPdfModeLabel(mode: PdfMode) {
    const labels = {
      [PdfModeValue.Merge]: t('pdf.merge'),
      [PdfModeValue.Split]: t('pdf.split'),
      [PdfModeValue.Watermark]: t('pdf.watermark'),
      [PdfModeValue.Images]: t('pdf.images'),
    }

    return labels[mode]
  }

  function getImagePdfPageSizeLabel(pageSize: ImagePdfPageSize) {
    const labels = {
      [ImagePdfPageSizeValue.Image]: t('image.pdfPageSizes.image'),
      [ImagePdfPageSizeValue.A4]: t('image.pdfPageSizes.a4'),
      [ImagePdfPageSizeValue.Letter]: t('image.pdfPageSizes.letter'),
    }

    return labels[pageSize]
  }

  return {
    getImagePdfPageSizeLabel,
    getPdfModeLabel,
  }
}
