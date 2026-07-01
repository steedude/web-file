<script setup lang="ts">
import type { ImageControlActions, ImageMode, ImageTransformOptions, UploadedImagePreview } from '~/types/file-tool.type'
import { ImageModeValue } from '~/types/file-tool.type'
import { formatFileSize } from '~/utils/file-size.util'

defineProps<{
  actions: ImageControlActions
  hasSameExtensionWarning: boolean
  imageMode: ImageMode
  isEstimatePending: boolean
  options: ImageTransformOptions
  originalSizeReference: number
  outputSizeReference: number
  previews: UploadedImagePreview[]
  summaryDelta: { type: 'larger' | 'saved' | 'same', percent: number } | null
}>()

const { t } = useI18n()

function getDeltaLabel(delta: { type: 'larger' | 'saved' | 'same', percent: number } | null) {
  if (!delta)
    return t('image.waitingEstimate')

  if (delta.type === 'same')
    return t('image.unchanged')

  return `${delta.type === 'larger' ? t('image.largerReference') : t('image.savedReference')} ${delta.percent}${t('common.percent')}`
}
</script>

<template>
  <ImageFormatControls
    :has-same-extension-warning="hasSameExtensionWarning"
    :image-mode="imageMode"
    :options="options"
    :previews-length="previews.length"
    :actions="actions"
  />

  <div class="grid gap-2 font-mono text-sm font-bold text-ink md:grid-cols-3">
    <span class="border border-line/70 bg-paper/70 px-3 py-2">
      <span class="block text-ink/42"><template v-if="imageMode === ImageModeValue.Batch">{{ t('image.batchSummary') }} </template>{{ t('image.sourceSize') }}</span>
      <span class="mt-1 block text-base font-black text-ink">{{ formatFileSize(originalSizeReference) }}</span>
    </span>
    <span class="border border-line/70 bg-paper/70 px-3 py-2">
      <span class="block text-ink/42">{{ t('image.outputSizeReference') }}</span>
      <span class="mt-1 block text-base font-black text-ink">{{ isEstimatePending ? t('image.estimating') : outputSizeReference ? formatFileSize(outputSizeReference) : t('image.waitingEstimate') }}</span>
    </span>
    <span v-if="summaryDelta" class="border px-3 py-2" :class="summaryDelta.type === 'larger' ? 'border-coral/60 bg-coral/12 text-coral' : summaryDelta.type === 'saved' ? 'border-acid/60 bg-acid/12 text-acid' : 'border-line/70 bg-paper/70 text-ink/62'">
      <span class="block text-current/70">{{ summaryDelta.type === 'larger' ? t('image.largerReference') : summaryDelta.type === 'saved' ? t('image.savedReference') : t('image.unchanged') }}</span>
      <span class="mt-1 block text-base font-black">{{ getDeltaLabel(summaryDelta) }}</span>
    </span>
  </div>

  <ImageResizeControls
    :image-mode="imageMode"
    :options="options"
    :previews="previews"
    :actions="actions"
  />
</template>
