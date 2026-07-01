import type { ImageCropPosition, ImagePdfFitMode, ImagePdfPageSize, PdfMode } from '~/types/file-tool.type'
import { ImageCropPositionValue, ImagePdfFitModeValue, ImagePdfPageSizeValue, PdfModeValue } from '~/types/file-tool.type'

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

  function getImageCropPositionLabel(position: ImageCropPosition) {
    const labels = {
      [ImageCropPositionValue.None]: t('image.cropPositions.none'),
      [ImageCropPositionValue.Center]: t('image.cropPositions.center'),
      [ImageCropPositionValue.Top]: t('image.cropPositions.top'),
      [ImageCropPositionValue.Bottom]: t('image.cropPositions.bottom'),
      [ImageCropPositionValue.Left]: t('image.cropPositions.left'),
      [ImageCropPositionValue.Right]: t('image.cropPositions.right'),
    }

    return labels[position]
  }

  function getImagePdfPageSizeLabel(pageSize: ImagePdfPageSize) {
    const labels = {
      [ImagePdfPageSizeValue.Image]: t('image.pdfPageSizes.image'),
      [ImagePdfPageSizeValue.A4]: t('image.pdfPageSizes.a4'),
      [ImagePdfPageSizeValue.Letter]: t('image.pdfPageSizes.letter'),
    }

    return labels[pageSize]
  }

  function getImagePdfFitModeLabel(fitMode: ImagePdfFitMode) {
    const labels = {
      [ImagePdfFitModeValue.Contain]: t('image.pdfFitModes.contain'),
      [ImagePdfFitModeValue.Cover]: t('image.pdfFitModes.cover'),
    }

    return labels[fitMode]
  }

  return {
    getImageCropPositionLabel,
    getImagePdfFitModeLabel,
    getImagePdfPageSizeLabel,
    getPdfModeLabel,
  }
}
