<script setup lang="ts">
import type { UploadedImagePreview } from '~/types/file-tool.type'
import { Scissors, X } from '@lucide/vue'
import { formatFileSize } from '~/utils/file-size.util'

withDefaults(defineProps<{
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
  crop: [index: number]
  remove: [index: number]
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
  <div v-if="previews.length" :class="compact ? 'space-y-2' : 'grid gap-3 sm:grid-cols-2'">
    <article
      v-for="(preview, index) in previews"
      :key="preview.id"
      class="group relative overflow-hidden border border-line bg-panel/80 shadow-[0_0_24px_rgb(0_0_0_/_20%)]"
      :class="compact ? 'grid grid-cols-[5rem_minmax(0,1fr)]' : ''"
    >
      <img
        :src="preview.url"
        :alt="preview.file.name"
        class="bg-grid object-contain"
        :class="compact ? 'h-full min-h-24 w-20' : 'aspect-video w-full'"
      >
      <div class="border-line bg-grid/90 p-3" :class="compact ? 'border-l' : 'border-t'">
        <p class="truncate font-mono text-xs font-black text-ink/84">
          {{ preview.file.name }}
        </p>
        <p class="mt-1 font-mono text-xs font-bold text-ink/42">
          {{ preview.width }} {{ $t('common.by') }} {{ preview.height }} {{ $t('image.pixels') }}
        </p>
        <p v-if="preview.crop" class="mt-1 font-mono text-xs font-black text-acid">
          {{ $t('image.cropped') }} {{ preview.crop.width }} {{ $t('common.by') }} {{ preview.crop.height }} {{ $t('image.pixels') }}
        </p>
        <p v-if="!allowCrop" class="mt-1 font-mono text-xs font-bold text-ink/42">
          {{ $t('image.sourceSize') }} {{ formatFileSize(preview.file.size) }}
        </p>
        <p v-if="!allowCrop" class="mt-1 font-mono text-xs font-bold text-ink/42">
          {{ $t('image.outputSizeReference') }} {{ estimates[index]?.outputSize ? formatFileSize(estimates[index]!.outputSize) : $t('image.waitingEstimate') }}
        </p>
        <p
          v-if="!allowCrop && estimates[index]?.delta"
          class="mt-1 font-mono text-xs font-black"
          :class="estimates[index]!.delta?.type === 'larger' ? 'text-coral' : estimates[index]!.delta?.type === 'saved' ? 'text-acid' : 'text-ink/42'"
        >
          {{ getDeltaLabel(estimates[index]!.delta) }}
        </p>
        <button
          v-if="allowCrop"
          type="button"
          class="focus-ring mt-3 inline-flex items-center gap-2 border border-line bg-paper/80 px-3 py-2 font-mono text-xs font-black text-ink/70 transition hover:border-sky hover:text-sky"
          @click="emit('crop', index)"
        >
          <Scissors class="size-4" aria-hidden="true" />
          {{ $t('image.crop') }}
        </button>
      </div>
      <button
        type="button"
        class="focus-ring absolute top-2 right-2 grid size-8 place-items-center border border-line bg-paper/90 text-ink/70 opacity-100 transition hover:border-coral hover:text-coral sm:opacity-0 sm:group-hover:opacity-100"
        :aria-label="$t('common.remove')"
        :title="$t('common.remove')"
        @click="emit('remove', index)"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </article>
  </div>
</template>
