<script setup lang="ts">
import type { UploadedImagePreview } from '~/types/file-tool.type'
import { X } from '@lucide/vue'
import { formatFileSize } from '~/utils/file-size.util'

defineProps<{
  previews: UploadedImagePreview[]
}>()

const emit = defineEmits<{
  remove: [index: number]
}>()
</script>

<template>
  <div v-if="previews.length" class="grid gap-3 sm:grid-cols-2">
    <article
      v-for="(preview, index) in previews"
      :key="preview.id"
      class="group relative overflow-hidden border border-line bg-panel/80 shadow-[0_0_24px_rgb(0_0_0_/_20%)]"
    >
      <img
        :src="preview.url"
        :alt="preview.file.name"
        class="aspect-video w-full bg-grid object-contain"
      >
      <div class="border-t border-line bg-grid/90 p-3">
        <p class="truncate font-mono text-xs font-black text-ink/84">
          {{ preview.file.name }}
        </p>
        <p class="mt-1 font-mono text-xs font-bold text-ink/42">
          {{ formatFileSize(preview.file.size) }}
        </p>
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
