<script setup lang="ts">
import type { ImagePdfOptions, UploadedImagePreview } from '~/types/file-tool.type'
import { imagePdfPageSizeOptions } from '~/configs/file-tool.config'

defineProps<{
  options: ImagePdfOptions
  previews: UploadedImagePreview[]
}>()

const emit = defineEmits<{
  updateMargin: [event: Event]
  updatePageSize: [event: Event]
}>()

const { t } = useI18n()
const { getImagePdfPageSizeLabel } = useFileToolLang()
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 md:grid-cols-2">
      <label class="grid gap-2">
        <span class="font-mono text-sm font-black tracking-widest text-sky uppercase">{{ t('image.pdfPageSize') }}</span>
        <select :value="options.pageSize" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-base font-bold text-ink" @change="emit('updatePageSize', $event)">
          <option v-for="pageSize in imagePdfPageSizeOptions" :key="pageSize" :value="pageSize">
            {{ getImagePdfPageSizeLabel(pageSize) }}
          </option>
        </select>
      </label>

      <label class="grid gap-2">
        <span class="font-mono text-sm font-black tracking-widest text-sky uppercase">{{ t('image.pdfMargin') }}</span>
        <input :value="options.margin" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-base font-bold text-ink" type="number" min="0" step="8" @input="emit('updateMargin', $event)">
      </label>
    </div>

    <ImagePdfPreview :options="options" :previews="previews" />
  </div>
</template>
