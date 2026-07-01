<script setup lang="ts">
import type { ImageMode, ImageTransformOptions, UploadedImagePreview } from '~/types/file-tool.type'
import { ImageModeValue } from '~/types/file-tool.type'
import { formatFileSize } from '~/utils/file-size.util'

defineProps<{
  hasSameExtensionWarning: boolean
  imageMode: ImageMode
  isEstimatePending: boolean
  options: ImageTransformOptions
  originalSizeReference: number
  outputSizeReference: number
  previews: UploadedImagePreview[]
  summaryDelta: { type: 'larger' | 'saved' | 'same', percent: number } | null
}>()

const emit = defineEmits<{
  commitEstimate: []
  openCrop: []
  setOptimisePng: [optimisePng: boolean]
  setPreserveDimensions: [preserveDimensions: boolean]
  setProportionalResize: []
  setResizeMode: [resizeMode: ImageTransformOptions['resizeMode']]
  setWebpLossless: [webpLossless: boolean]
  updateFormat: [event: Event]
  updateHeight: [event: Event]
  updateOutputFileName: [event: Event]
  updateQuality: [event: Event]
  updateResizePercent: [event: Event]
  updateWidth: [event: Event]
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
    @commit-estimate="emit('commitEstimate')"
    @set-optimise-png="emit('setOptimisePng', $event)"
    @set-webp-lossless="emit('setWebpLossless', $event)"
    @update-format="emit('updateFormat', $event)"
    @update-output-file-name="emit('updateOutputFileName', $event)"
    @update-quality="emit('updateQuality', $event)"
  />

  <div class="grid gap-2 font-mono text-xs font-bold text-ink md:grid-cols-3">
    <span class="border border-line/70 bg-paper/70 px-3 py-2">
      <span class="block text-ink/42"><template v-if="imageMode === ImageModeValue.Batch">{{ t('image.batchSummary') }} </template>{{ t('image.sourceSize') }}</span>
      <span class="mt-1 block text-sm font-black text-ink">{{ formatFileSize(originalSizeReference) }}</span>
    </span>
    <span class="border border-line/70 bg-paper/70 px-3 py-2">
      <span class="block text-ink/42">{{ t('image.outputSizeReference') }}</span>
      <span class="mt-1 block text-sm font-black text-ink">{{ isEstimatePending ? t('image.estimating') : outputSizeReference ? formatFileSize(outputSizeReference) : t('image.waitingEstimate') }}</span>
    </span>
    <span v-if="summaryDelta" class="border px-3 py-2" :class="summaryDelta.type === 'larger' ? 'border-coral/60 bg-coral/12 text-coral' : summaryDelta.type === 'saved' ? 'border-acid/60 bg-acid/12 text-acid' : 'border-line/70 bg-paper/70 text-ink/62'">
      <span class="block text-current/70">{{ summaryDelta.type === 'larger' ? t('image.largerReference') : summaryDelta.type === 'saved' ? t('image.savedReference') : t('image.unchanged') }}</span>
      <span class="mt-1 block text-sm font-black">{{ getDeltaLabel(summaryDelta) }}</span>
    </span>
  </div>

  <ImageResizeControls
    :image-mode="imageMode"
    :options="options"
    :previews="previews"
    @commit-estimate="emit('commitEstimate')"
    @open-crop="emit('openCrop')"
    @set-preserve-dimensions="emit('setPreserveDimensions', $event)"
    @set-proportional-resize="emit('setProportionalResize')"
    @set-resize-mode="emit('setResizeMode', $event)"
    @update-height="emit('updateHeight', $event)"
    @update-resize-percent="emit('updateResizePercent', $event)"
    @update-width="emit('updateWidth', $event)"
  />
</template>
