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
  <ul v-if="files.length" class="divide-y-2 divide-ink/10 rounded-lg border-2 border-ink bg-white shadow-[3px_3px_0_#171714]">
    <li v-for="(file, index) in files" :key="`${file.name}-${file.size}-${index}`" class="flex items-center justify-between gap-4 p-3">
      <div class="min-w-0">
        <p class="truncate text-sm font-black">
          {{ file.name }}
        </p>
        <p class="text-xs font-bold text-ink/55">
          {{ formatFileSize(file.size) }}
        </p>
      </div>
      <button
        type="button"
        class="focus-ring grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-white transition hover:bg-coral/25"
        :aria-label="$t('common.remove')"
        :title="$t('common.remove')"
        @click="emit('remove', index)"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </li>
  </ul>
</template>
