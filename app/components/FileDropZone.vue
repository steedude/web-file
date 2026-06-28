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
    class="rounded-lg border-2 border-dashed border-ink bg-white/75 p-6 transition"
    :class="isDragging ? 'translate-y-[-2px] bg-sky/35 shadow-[5px_5px_0_#171714]' : 'shadow-[3px_3px_0_#171714]'"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <input ref="input" class="sr-only" type="file" multiple :accept="accept" @change="handleInput">
    <button
      type="button"
      class="focus-ring flex w-full flex-col items-center justify-center gap-3 rounded-md py-8 text-center"
      @click="openPicker"
    >
      <span class="grid size-12 place-items-center rounded-full border-2 border-ink bg-acid">
        <UploadCloud class="size-6" aria-hidden="true" />
      </span>
      <span class="text-base font-black">{{ label }}</span>
    </button>
  </div>
</template>
