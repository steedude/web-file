<script setup lang="ts">
import type { ImageMode, UploadedImagePreview } from '~/types/file-tool.type'
import { Image } from '@lucide/vue'
import { ImageModes } from '~/types/file-tool.type'

defineProps<{
  imageMode: ImageMode
  previewEstimates: Array<{
    outputSize: number
    delta: { type: 'larger' | 'saved' | 'same', percent: number } | null
  }>
  previews: UploadedImagePreview[]
}>()

const emit = defineEmits<{
  filesAdded: [files: FileList | File[]]
  modeChanged: [mode: ImageMode]
  removeFile: [index: number]
  rotateFile: [index: number]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-start gap-3">
      <span class="grid size-11 shrink-0 place-items-center border border-sky/70 bg-sky/12 text-sky shadow-[0_0_28px_var(--fx-sky-14)]">
        <Image class="size-5" aria-hidden="true" />
      </span>
      <div>
        <h2 class="font-mono text-2xl font-black tracking-tight text-ink">
          {{ t('image.title') }}
        </h2>
        <p class="mt-2 text-base leading-7 font-semibold text-ink/62">
          {{ t('image.description') }}
        </p>
      </div>
    </div>

    <div class="border border-line bg-panel/82 p-1 shadow-[0_0_34px_var(--fx-sky-7)]">
      <div class="grid grid-cols-3 gap-1">
        <button
          type="button"
          class="focus-ring min-h-12 border px-4 py-3 font-mono text-sm font-black transition"
          :aria-pressed="imageMode === ImageModes.Batch"
          :class="imageMode === ImageModes.Batch ? 'border-sky bg-sky text-paper shadow-[0_0_22px_var(--fx-sky-18)]' : 'border-transparent bg-grid/70 text-ink/62 hover:border-sky/70 hover:text-sky'"
          @click="emit('modeChanged', ImageModes.Batch)"
        >
          {{ t('image.batchSettings') }}
        </button>
        <button
          type="button"
          class="focus-ring min-h-12 border px-4 py-3 font-mono text-sm font-black transition"
          :aria-pressed="imageMode === ImageModes.Single"
          :class="imageMode === ImageModes.Single ? 'border-sky bg-sky text-paper shadow-[0_0_22px_var(--fx-sky-18)]' : 'border-transparent bg-grid/70 text-ink/62 hover:border-sky/70 hover:text-sky'"
          @click="emit('modeChanged', ImageModes.Single)"
        >
          {{ t('image.singleSettings') }}
        </button>
        <button
          type="button"
          class="focus-ring min-h-12 border px-4 py-3 font-mono text-sm font-black transition"
          :aria-pressed="imageMode === ImageModes.Pdf"
          :class="imageMode === ImageModes.Pdf ? 'border-sky bg-sky text-paper shadow-[0_0_22px_var(--fx-sky-18)]' : 'border-transparent bg-grid/70 text-ink/62 hover:border-sky/70 hover:text-sky'"
          @click="emit('modeChanged', ImageModes.Pdf)"
        >
          {{ t('image.pdfSettings') }}
        </button>
      </div>
    </div>

    <FileDropZone accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" :label="t('common.dropFiles')" :multiple="imageMode !== ImageModes.Single" @files="emit('filesAdded', $event)" />
    <ImagePreviewList :allow-crop="imageMode === ImageModes.Single" :allow-rotate="imageMode === ImageModes.Pdf" :compact="imageMode !== ImageModes.Single" :estimates="previewEstimates" :previews="previews" :show-estimates="imageMode === ImageModes.Batch" @remove="emit('removeFile', $event)" @rotate="emit('rotateFile', $event)" />
  </div>
</template>
