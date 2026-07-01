<script setup lang="ts">
import type { ImagePdfOptions } from '~/types/file-tool.type'
import { imagePdfFitModeOptions, imagePdfPageSizeOptions } from '~/configs/file-tool.config'

defineProps<{
  options: ImagePdfOptions
}>()

const emit = defineEmits<{
  updateFitMode: [event: Event]
  updateMargin: [event: Event]
  updatePageSize: [event: Event]
}>()

const { t } = useI18n()
const { getImagePdfFitModeLabel, getImagePdfPageSizeLabel } = useFileToolLang()
</script>

<template>
  <div class="grid gap-4 md:grid-cols-3">
    <label class="space-y-2">
      <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.pdfPageSize') }}</span>
      <select :value="options.pageSize" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" @change="emit('updatePageSize', $event)">
        <option v-for="pageSize in imagePdfPageSizeOptions" :key="pageSize" :value="pageSize">
          {{ getImagePdfPageSizeLabel(pageSize) }}
        </option>
      </select>
    </label>

    <label class="space-y-2">
      <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.pdfFitMode') }}</span>
      <select :value="options.fitMode" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" @change="emit('updateFitMode', $event)">
        <option v-for="fitMode in imagePdfFitModeOptions" :key="fitMode" :value="fitMode">
          {{ getImagePdfFitModeLabel(fitMode) }}
        </option>
      </select>
    </label>

    <label class="space-y-2">
      <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.pdfMargin') }}</span>
      <input :value="options.margin" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" type="number" min="0" step="8" @input="emit('updateMargin', $event)">
    </label>
  </div>
</template>
