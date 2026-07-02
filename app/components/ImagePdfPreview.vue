<script setup lang="ts">
import type { ImagePdfOptions, UploadedImagePreview } from '~/types/file-tool.type'
import { fitImageIntoPage, getImagePdfPageSize, getRotatedImageSize } from '~/utils/image-pdf-layout.util'

const props = defineProps<{
  options: ImagePdfOptions
  previews: UploadedImagePreview[]
}>()

const { t } = useI18n()

function getPageStyle(preview: UploadedImagePreview) {
  const imageSize = getRotatedImageSize(preview.width, preview.height, preview.rotation)
  const pageSize = getImagePdfPageSize(props.options.pageSize, imageSize.width, imageSize.height)

  return {
    aspectRatio: `${pageSize.width} / ${pageSize.height}`,
  }
}

function getImageFrameStyle(preview: UploadedImagePreview) {
  const imageSize = getRotatedImageSize(preview.width, preview.height, preview.rotation)
  const pageSize = getImagePdfPageSize(props.options.pageSize, imageSize.width, imageSize.height)
  const rect = fitImageIntoPage(imageSize, pageSize, props.options.margin)

  return {
    height: `${rect.height / pageSize.height * 100}%`,
    left: `${rect.x / pageSize.width * 100}%`,
    top: `${(pageSize.height - rect.y - rect.height) / pageSize.height * 100}%`,
    width: `${rect.width / pageSize.width * 100}%`,
  }
}

function getImageStyle(preview: UploadedImagePreview) {
  const imageSize = getRotatedImageSize(preview.width, preview.height, preview.rotation)
  const pageSize = getImagePdfPageSize(props.options.pageSize, imageSize.width, imageSize.height)
  const rect = fitImageIntoPage(imageSize, pageSize, props.options.margin)
  const isSideways = preview.rotation === 90 || preview.rotation === 270

  return {
    height: isSideways ? `${rect.width / rect.height * 100}%` : '100%',
    transform: `translate(-50%, -50%) rotate(${preview.rotation}deg)`,
    width: isSideways ? `${rect.height / rect.width * 100}%` : '100%',
  }
}
</script>

<template>
  <section class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <h3 class="font-mono text-sm font-black tracking-widest text-sky uppercase">
        {{ t('image.pdfPreview') }}
      </h3>
      <p v-if="previews.length" class="font-mono text-sm font-bold text-ink/52">
        {{ t('image.pdfPreviewCount', { count: previews.length }) }}
      </p>
    </div>

    <div v-if="previews.length" class="grid gap-3 md:grid-cols-2">
      <article v-for="(preview, index) in previews" :key="preview.id" class="space-y-2">
        <div class="grid min-h-44 place-items-center border border-line bg-paper/70 p-3">
          <div class="relative w-full max-w-52 overflow-hidden border border-ink/20 bg-white shadow-[0_0_20px_var(--fx-black-20)]" :style="getPageStyle(preview)">
            <div class="absolute overflow-visible" :style="getImageFrameStyle(preview)">
              <img :src="preview.url" :alt="preview.file.name" class="absolute top-1/2 left-1/2 max-w-none object-contain" :style="getImageStyle(preview)">
            </div>
          </div>
        </div>
        <p class="truncate font-mono text-sm font-bold text-ink/62">
          {{ t('image.pdfPreviewItem', { number: index + 1, name: preview.file.name }) }}
        </p>
      </article>
    </div>

    <p v-else class="border border-line bg-grid/70 px-3 py-8 text-center font-mono text-base font-bold text-ink/52">
      {{ t('image.pdfPreviewEmpty') }}
    </p>
  </section>
</template>
