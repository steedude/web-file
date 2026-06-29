<script setup lang="ts">
import { UploadCloud } from '@lucide/vue'

defineProps<{
  accept: string
  label: string
}>()

const emit = defineEmits<{
  files: [files: FileList]
}>()

const isDragging = ref(false)
const input = ref<HTMLInputElement | null>(null)

function openPicker() {
  input.value?.click()
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement

  if (target.files)
    emit('files', target.files)

  target.value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false

  if (event.dataTransfer?.files)
    emit('files', event.dataTransfer.files)
}
</script>

<template>
  <div
    class="border border-dashed border-line bg-grid/70 p-6 transition"
    :class="isDragging ? 'border-sky bg-sky/10 shadow-[0_0_36px_rgb(72_215_255_/_18%)]' : 'shadow-[0_0_24px_rgb(0_0_0_/_18%)]'"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <input ref="input" class="sr-only" type="file" multiple :accept="accept" @change="handleInput">
    <button
      type="button"
      class="focus-ring flex w-full flex-col items-center justify-center gap-3 py-8 text-center"
      @click="openPicker"
    >
      <span class="grid size-12 place-items-center border border-acid/60 bg-acid/12 text-acid shadow-[0_0_24px_rgb(109_255_157_/_16%)]">
        <UploadCloud class="size-6" aria-hidden="true" />
      </span>
      <span class="font-mono text-base font-black text-ink/76">{{ label }}</span>
    </button>
  </div>
</template>
