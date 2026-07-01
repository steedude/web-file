<script setup lang="ts">
import type { ImageCropSelection, UploadedImagePreview } from '~/types/file-tool.type'
import { Check, RotateCcw, X } from '@lucide/vue'

const props = defineProps<{
  preview: UploadedImagePreview
}>()

const emit = defineEmits<{
  close: []
  clear: []
  save: [crop: ImageCropSelection]
}>()

const { t } = useI18n()
const canvas = ref<HTMLCanvasElement | null>(null)
const image = shallowRef<HTMLImageElement | null>(null)
const imageSize = reactive({ width: 0, height: 0 })
const view = reactive({ x: 0, y: 0, width: 0, height: 0, scale: 1 })
const selection = ref<ImageCropSelection | null>(props.preview.crop ? { ...props.preview.crop } : null)
const dragStart = ref<{ x: number, y: number } | null>(null)

watch(() => props.preview, loadImage, { immediate: true })
watch(selection, draw, { deep: true })

function loadImage() {
  if (!import.meta.client)
    return

  const nextImage = new window.Image()
  image.value = nextImage
  nextImage.onload = () => {
    imageSize.width = nextImage.naturalWidth
    imageSize.height = nextImage.naturalHeight
    fitCanvas()
    selection.value = props.preview.crop ? { ...props.preview.crop } : fullSelection()
    draw()
  }
  nextImage.src = props.preview.url
}

function fitCanvas() {
  const targetWidth = Math.min(720, imageSize.width)
  const targetHeight = Math.min(460, imageSize.height)
  const scale = Math.min(targetWidth / imageSize.width, targetHeight / imageSize.height, 1)
  const width = Math.max(1, Math.round(imageSize.width * scale))
  const height = Math.max(1, Math.round(imageSize.height * scale))

  view.x = 0
  view.y = 0
  view.width = width
  view.height = height
  view.scale = scale

  if (canvas.value) {
    canvas.value.width = width
    canvas.value.height = height
  }
}

function fullSelection(): ImageCropSelection {
  return { x: 0, y: 0, width: imageSize.width, height: imageSize.height }
}

function draw() {
  const context = canvas.value?.getContext('2d')

  if (!context || !image.value || !imageSize.width || !imageSize.height)
    return

  context.clearRect(0, 0, view.width, view.height)
  context.drawImage(image.value, 0, 0, view.width, view.height)

  const crop = selection.value

  if (!crop)
    return

  const rect = toCanvasRect(crop)
  context.fillStyle = 'rgb(0 0 0 / 55%)'
  context.fillRect(0, 0, view.width, view.height)
  context.clearRect(rect.x, rect.y, rect.width, rect.height)
  context.drawImage(image.value, rect.x / view.scale, rect.y / view.scale, rect.width / view.scale, rect.height / view.scale, rect.x, rect.y, rect.width, rect.height)
  context.strokeStyle = '#6dff9d'
  context.lineWidth = 2
  context.strokeRect(rect.x + 1, rect.y + 1, Math.max(1, rect.width - 2), Math.max(1, rect.height - 2))
}

function toCanvasRect(crop: ImageCropSelection): ImageCropSelection {
  return {
    x: crop.x * view.scale,
    y: crop.y * view.scale,
    width: crop.width * view.scale,
    height: crop.height * view.scale,
  }
}

function toImagePoint(event: PointerEvent) {
  const rect = canvas.value?.getBoundingClientRect()

  if (!rect)
    return { x: 0, y: 0 }

  const canvasX = (event.clientX - rect.left) * (view.width / rect.width)
  const canvasY = (event.clientY - rect.top) * (view.height / rect.height)

  return {
    x: Math.min(Math.max(canvasX / view.scale, 0), imageSize.width),
    y: Math.min(Math.max(canvasY / view.scale, 0), imageSize.height),
  }
}

function startSelection(event: PointerEvent) {
  const point = toImagePoint(event)
  dragStart.value = point
  selection.value = { x: point.x, y: point.y, width: 1, height: 1 }
  canvas.value?.setPointerCapture(event.pointerId)
}

function updateSelection(event: PointerEvent) {
  if (!dragStart.value)
    return

  const point = toImagePoint(event)
  const x = Math.min(dragStart.value.x, point.x)
  const y = Math.min(dragStart.value.y, point.y)
  const width = Math.abs(point.x - dragStart.value.x)
  const height = Math.abs(point.y - dragStart.value.y)
  selection.value = {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  }
}

function endSelection(event: PointerEvent) {
  updateSelection(event)
  dragStart.value = null
  canvas.value?.releasePointerCapture(event.pointerId)
}

function resetSelection() {
  selection.value = fullSelection()
}

function saveSelection() {
  if (!selection.value)
    return

  emit('save', selection.value)
}
</script>

<template>
  <div class="fixed inset-0 z-50 grid place-items-center bg-paper/82 p-4 backdrop-blur-md">
    <section class="w-full max-w-4xl border border-line bg-panel p-4 shadow-[0_0_60px_var(--fx-sky-18)]">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 class="font-mono text-lg font-black text-ink">
            {{ t('image.crop') }}
          </h3>
          <p class="mt-1 truncate text-sm font-semibold text-ink/52">
            {{ preview.file.name }}
          </p>
        </div>
        <button type="button" class="focus-ring grid size-9 place-items-center border border-line bg-grid text-ink/70 hover:border-coral hover:text-coral" :aria-label="t('common.close')" @click="emit('close')">
          <X class="size-4" aria-hidden="true" />
        </button>
      </div>

      <div class="overflow-auto border border-line bg-grid p-3">
        <canvas
          ref="canvas"
          class="mx-auto block max-w-full touch-none cursor-crosshair"
          @pointerdown="startSelection"
          @pointermove="updateSelection"
          @pointerup="endSelection"
          @pointercancel="dragStart = null"
        />
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p class="font-mono text-xs font-bold text-ink/52">
          {{ selection ? `${selection.width} ${t('common.by')} ${selection.height}` : `${imageSize.width} ${t('common.by')} ${imageSize.height}` }}
        </p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="focus-ring inline-flex items-center gap-2 border border-line bg-grid px-4 py-2 font-mono text-xs font-black text-ink/70 hover:border-sky hover:text-sky" @click="resetSelection">
            <RotateCcw class="size-4" aria-hidden="true" />
            {{ t('image.resetCrop') }}
          </button>
          <button type="button" class="focus-ring inline-flex items-center gap-2 border border-line bg-grid px-4 py-2 font-mono text-xs font-black text-ink/70 hover:border-coral hover:text-coral" @click="emit('clear')">
            <X class="size-4" aria-hidden="true" />
            {{ t('image.clearCrop') }}
          </button>
          <button type="button" class="focus-ring inline-flex items-center gap-2 border border-acid/70 bg-acid px-4 py-2 font-mono text-xs font-black text-paper hover:bg-acid/85" @click="saveSelection">
            <Check class="size-4" aria-hidden="true" />
            {{ t('common.apply') }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
