<script setup lang="ts">
import type { UploadedImagePreview } from '~/types/file-tool.type'
import { X } from '@lucide/vue'
import { formatFileSize } from '~/utils/file-size.util'

const props = withDefaults(defineProps<{
  allowCrop?: boolean
  compact?: boolean
  estimates?: Array<{
    outputSize: number
    delta: { type: 'larger' | 'saved' | 'same', percent: number } | null
  }>
  previews: UploadedImagePreview[]
}>(), {
  allowCrop: false,
  compact: false,
  estimates: () => [],
})

const emit = defineEmits<{
  remove: [index: number]
}>()

const { t } = useI18n()

function getPreviewFrameStyle(preview: UploadedImagePreview) {
  if (!preview.crop)
    return {}

  return {
    aspectRatio: `${preview.crop.width} / ${preview.crop.height}`,
  }
}

function getCroppedImageStyle(preview: UploadedImagePreview) {
  if (!preview.crop)
    return {}

  return {
    height: `${preview.height / preview.crop.height * 100}%`,
    left: `${-preview.crop.x / preview.crop.width * 100}%`,
    top: `${-preview.crop.y / preview.crop.height * 100}%`,
    width: `${preview.width / preview.crop.width * 100}%`,
  }
}

function getPreviewFrameClass(preview: UploadedImagePreview) {
  if (props.compact)
    return 'h-full min-h-24 w-20'

  if (props.allowCrop)
    return preview.crop ? 'w-full' : 'max-h-[520px] min-h-72 w-full'

  return 'aspect-video w-full'
}

function getDeltaLabel(delta: { type: 'larger' | 'saved' | 'same', percent: number } | null) {
  if (!delta)
    return t('image.waitingEstimate')

  if (delta.type === 'same')
    return t('image.unchanged')

  return `${delta.type === 'larger' ? t('image.largerReference') : t('image.savedReference')} ${delta.percent}${t('common.percent')}`
}
</script>

<template>
  <div v-if="previews.length" :class="compact ? 'space-y-2' : allowCrop ? 'space-y-3' : 'grid gap-3 md:grid-cols-2'">
    <article
      v-for="(preview, index) in previews"
      :key="preview.id"
      class="group relative overflow-hidden border border-line bg-panel/80 shadow-[0_0_24px_var(--fx-black-20)]"
      :class="compact ? 'grid grid-cols-[5rem_minmax(0,1fr)]' : ''"
    >
      <div
        class="relative overflow-hidden bg-grid"
        :class="getPreviewFrameClass(preview)"
        :style="getPreviewFrameStyle(preview)"
      >
        <img
          :src="preview.url"
          :alt="preview.file.name"
          class="absolute object-contain"
          :class="preview.crop ? 'max-w-none' : 'inset-0 h-full w-full'"
          :style="getCroppedImageStyle(preview)"
        >
      </div>
      <div class="border-line bg-grid/90 p-3" :class="compact ? 'border-l' : 'border-t'">
        <p class="truncate font-mono text-sm font-black text-ink/84">
          {{ preview.file.name }}
        </p>
        <p class="mt-1 font-mono text-sm font-bold text-ink/52">
          {{ preview.width }} {{ $t('common.by') }} {{ preview.height }} {{ $t('image.pixels') }}
        </p>
        <p v-if="preview.crop" class="mt-1 font-mono text-sm font-black text-acid">
          {{ $t('image.cropped') }} {{ preview.crop.width }} {{ $t('common.by') }} {{ preview.crop.height }} {{ $t('image.pixels') }}
        </p>
        <p v-if="!allowCrop" class="mt-1 font-mono text-sm font-bold text-ink/52">
          {{ $t('image.sourceSize') }} {{ formatFileSize(preview.file.size) }}
        </p>
        <p v-if="!allowCrop" class="mt-1 font-mono text-sm font-bold text-ink/52">
          {{ $t('image.outputSizeReference') }} {{ estimates[index]?.outputSize ? formatFileSize(estimates[index]!.outputSize) : $t('image.waitingEstimate') }}
        </p>
        <p
          v-if="!allowCrop && estimates[index]?.delta"
          class="mt-1 font-mono text-sm font-black"
          :class="estimates[index]!.delta?.type === 'larger' ? 'text-coral' : estimates[index]!.delta?.type === 'saved' ? 'text-acid' : 'text-ink/42'"
        >
          {{ getDeltaLabel(estimates[index]!.delta) }}
        </p>
      </div>
      <button
        type="button"
        class="focus-ring absolute top-2 right-2 grid size-8 place-items-center border border-line bg-paper/90 text-ink/70 opacity-100 transition hover:border-coral hover:text-coral md:opacity-0 md:group-hover:opacity-100"
        :aria-label="$t('common.remove')"
        :title="$t('common.remove')"
        @click="emit('remove', index)"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </article>
  </div>
</template>
