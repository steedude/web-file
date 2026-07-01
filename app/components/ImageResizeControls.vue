<script setup lang="ts">
import type { ImageMode, ImageTransformOptions, UploadedImagePreview } from '~/types/file-tool.type'
import { Scissors } from '@lucide/vue'
import { ImageModeValue, ImageResizeModeValue } from '~/types/file-tool.type'

defineProps<{
  imageMode: ImageMode
  options: ImageTransformOptions
  previews: UploadedImagePreview[]
}>()

const emit = defineEmits<{
  commitEstimate: []
  openCrop: []
  setPreserveDimensions: [preserveDimensions: boolean]
  setProportionalResize: []
  setResizeMode: [resizeMode: ImageTransformOptions['resizeMode']]
  updateHeight: [event: Event]
  updateResizePercent: [event: Event]
  updateWidth: [event: Event]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <button
      type="button"
      class="focus-ring border px-3 py-2 font-mono text-sm font-black transition"
      :class="options.preserveDimensions ? 'border-sky bg-sky text-paper' : 'border-line bg-grid text-ink/62 hover:border-sky hover:text-sky'"
      @click="emit('setPreserveDimensions', true)"
    >
      {{ t('image.keepOriginal') }}
    </button>
    <button
      type="button"
      class="focus-ring border px-3 py-2 font-mono text-sm font-black transition"
      :class="!options.preserveDimensions ? 'border-sky bg-sky text-paper' : 'border-line bg-grid text-ink/62 hover:border-sky hover:text-sky'"
      @click="emit('setProportionalResize')"
    >
      {{ t('image.proportionalResize') }}
    </button>
    <button
      v-if="imageMode === ImageModeValue.Single"
      type="button"
      class="focus-ring inline-flex items-center gap-2 border border-line bg-grid px-3 py-2 font-mono text-sm font-black text-ink/76 transition hover:border-sky hover:text-sky disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink/76"
      :disabled="!previews.length"
      @click="emit('openCrop')"
    >
      <Scissors class="size-4" aria-hidden="true" />
      {{ t('image.crop') }}
    </button>
  </div>

  <div v-if="imageMode === ImageModeValue.Single && !options.preserveDimensions" class="grid grid-cols-2 gap-2 md:w-max">
    <button
      type="button"
      class="focus-ring border px-3 py-2 font-mono text-sm font-black transition"
      :class="options.resizeMode === ImageResizeModeValue.Dimensions ? 'border-sky bg-sky text-paper' : 'border-line bg-grid text-ink/62 hover:border-sky hover:text-sky'"
      @click="emit('setResizeMode', ImageResizeModeValue.Dimensions)"
    >
      {{ t('image.resizeByPixels') }}
    </button>
    <button
      type="button"
      class="focus-ring border px-3 py-2 font-mono text-sm font-black transition"
      :class="options.resizeMode === ImageResizeModeValue.Percent ? 'border-sky bg-sky text-paper' : 'border-line bg-grid text-ink/62 hover:border-sky hover:text-sky'"
      @click="emit('setResizeMode', ImageResizeModeValue.Percent)"
    >
      {{ t('image.resizeByPercent') }}
    </button>
  </div>

  <label v-if="!options.preserveDimensions && options.resizeMode === ImageResizeModeValue.Percent" class="grid gap-2">
    <span class="font-mono text-sm font-black tracking-widest text-sky uppercase">{{ t('image.resizePercent') }} {{ t('common.dot') }} {{ options.resizePercent }}{{ t('common.percent') }}</span>
    <input :value="options.resizePercent" class="w-full accent-acid" type="range" min="1" max="100" step="1" @change="emit('commitEstimate')" @input="emit('updateResizePercent', $event)">
  </label>

  <div v-if="imageMode === ImageModeValue.Single && options.resizeMode === ImageResizeModeValue.Dimensions" class="grid gap-4 md:grid-cols-2">
    <label class="grid gap-2">
      <span class="font-mono text-sm font-black tracking-widest text-sky uppercase">{{ t('image.width') }}</span>
      <input
        :value="options.maxWidth"
        class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-base font-bold text-ink disabled:opacity-40"
        type="number"
        min="1"
        step="1"
        :disabled="options.preserveDimensions"
        @input="emit('updateWidth', $event)"
      >
    </label>

    <label class="grid gap-2">
      <span class="font-mono text-sm font-black tracking-widest text-sky uppercase">{{ t('image.height') }}</span>
      <input
        :value="options.maxHeight"
        class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-base font-bold text-ink disabled:opacity-40"
        type="number"
        min="1"
        step="1"
        :disabled="options.preserveDimensions"
        @input="emit('updateHeight', $event)"
      >
    </label>
  </div>
</template>
