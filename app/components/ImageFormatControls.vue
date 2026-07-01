<script setup lang="ts">
import type { ImageMode, ImageTransformOptions } from '~/types/file-tool.type'
import { imageFormatOptions } from '~/configs/file-tool.config'
import { ImageModeValue, ImageOutputFormatValue } from '~/types/file-tool.type'

const props = defineProps<{
  hasSameExtensionWarning: boolean
  imageMode: ImageMode
  options: ImageTransformOptions
  previewsLength: number
}>()

const emit = defineEmits<{
  commitEstimate: []
  setOptimisePng: [optimisePng: boolean]
  setWebpLossless: [webpLossless: boolean]
  updateFormat: [event: Event]
  updateOutputFileName: [event: Event]
  updateQuality: [event: Event]
}>()

const { t } = useI18n()
const displayedQuality = computed(() => props.options.webpLossless ? 100 : props.options.quality)
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <label class="grid grid-rows-[auto_2.25rem] gap-2">
      <span class="flex h-4 items-center font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.outputFormat') }}</span>
      <select :value="options.format" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" @change="emit('updateFormat', $event)">
        <option v-for="format in imageFormatOptions" :key="format.value" :value="format.value">
          {{ format.value.toUpperCase() }}
        </option>
      </select>
    </label>

    <div>
      <div v-if="options.format === ImageOutputFormatValue.Webp">
        <label class="grid grid-rows-[auto_2.25rem] gap-2">
          <span class="flex h-4 items-center font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.quality') }} {{ t('common.dot') }} {{ displayedQuality }}</span>
          <input :value="displayedQuality" class="h-9 w-full accent-acid disabled:opacity-40" type="range" min="1" max="100" :disabled="options.webpLossless" @change="emit('commitEstimate')" @input="emit('updateQuality', $event)">
        </label>
      </div>

      <label v-else-if="options.format === ImageOutputFormatValue.Jpeg" class="grid grid-rows-[auto_2.25rem] gap-2">
        <span class="flex h-4 items-center font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.quality') }} {{ t('common.dot') }} {{ options.quality }}</span>
        <input :value="options.quality" class="h-9 w-full accent-acid" type="range" min="1" max="100" @change="emit('commitEstimate')" @input="emit('updateQuality', $event)">
      </label>

      <div v-else class="grid grid-rows-[auto_2.25rem] gap-2">
        <span class="flex h-4 items-center font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.pngQualityTitle') }}</span>
        <div class="flex items-center border border-line bg-grid px-3 font-mono text-xs font-bold text-ink/42">
          {{ t('image.pngQualityUnavailable') }}
        </div>
      </div>
    </div>
  </div>

  <label v-if="options.format === ImageOutputFormatValue.Png" class="block space-y-2">
    <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.losslessPng') }}</span>
    <span class="inline-flex w-full items-center gap-2 border border-line bg-grid px-3 py-2 font-mono text-xs font-black text-ink/70">
      <input :checked="options.optimisePng" type="checkbox" class="size-4 accent-acid" @change="emit('setOptimisePng', ($event.target as HTMLInputElement).checked)">
      {{ t('image.optimisePng') }}
    </span>
  </label>

  <label v-if="options.format === ImageOutputFormatValue.Webp" class="block space-y-2">
    <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.webpLossless') }}</span>
    <span class="inline-flex w-full items-center gap-2 border border-line bg-grid px-3 py-2 font-mono text-xs font-black text-ink/70">
      <input :checked="options.webpLossless" type="checkbox" class="size-4 accent-acid" @change="emit('setWebpLossless', ($event.target as HTMLInputElement).checked)">
      {{ t('image.enableWebpLossless') }}
    </span>
  </label>

  <p v-if="hasSameExtensionWarning" class="border border-coral/70 bg-coral/12 px-3 py-2 font-mono text-xs font-black text-coral">
    {{ t('image.sameExtensionWarning') }}
  </p>

  <label v-if="imageMode === ImageModeValue.Single && previewsLength" class="block space-y-2">
    <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.outputFileName') }}</span>
    <input
      :value="options.outputFileName"
      class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink"
      type="text"
      autocomplete="off"
      spellcheck="false"
      @input="emit('updateOutputFileName', $event)"
    >
  </label>
</template>
