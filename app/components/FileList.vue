<script setup lang="ts">
import { X } from '@lucide/vue'
import { formatFileSize } from '~/utils/file-size.util'

defineProps<{
  files: File[]
}>()

const emit = defineEmits<{
  remove: [index: number]
}>()
</script>

<template>
  <ul v-if="files.length" class="divide-y divide-line border border-line bg-panel/80 shadow-[0_0_24px_var(--fx-black-20)]">
    <li v-for="(file, index) in files" :key="`${file.name}-${file.size}-${index}`" class="flex items-center justify-between gap-4 p-3">
      <div class="min-w-0">
        <p class="truncate font-mono text-sm font-black text-ink/84">
          {{ file.name }}
        </p>
        <p class="font-mono text-xs font-bold text-ink/42">
          {{ formatFileSize(file.size) }}
        </p>
      </div>
      <button
        type="button"
        class="focus-ring grid size-8 shrink-0 place-items-center border border-line bg-grid text-ink/54 transition hover:border-coral hover:text-coral"
        :aria-label="$t('common.remove')"
        :title="$t('common.remove')"
        @click="emit('remove', index)"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </li>
  </ul>
</template>
