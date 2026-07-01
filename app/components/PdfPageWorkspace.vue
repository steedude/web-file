<script setup lang="ts">
import type { PdfMode, PdfPageItem } from '~/types/file-tool.type'
import { Check, ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, GripVertical, Trash2 } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import { PdfModeValue } from '~/types/file-tool.type'

const props = defineProps<{
  isLoading: boolean
  mode: PdfMode
  pages: PdfPageItem[]
}>()

const emit = defineEmits<{
  move: [fromIndex: number, toIndex: number]
  remove: [id: string]
  reorder: [pages: PdfPageItem[]]
  selectAll: [selected: boolean]
  toggle: [id: string]
}>()

const { t } = useI18n()
const selectedCount = computed(() => props.pages.filter(page => page.selected).length)
const selectable = computed(() => props.mode === PdfModeValue.Split || props.mode === PdfModeValue.Images)
const sortablePages = computed({
  get: () => props.pages,
  set: pages => emit('reorder', pages),
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 class="font-mono text-base font-black tracking-widest text-lilac uppercase">
          {{ mode === PdfModeValue.Merge ? t('pdf.pageQueue') : selectable ? t('pdf.pageSelection') : t('pdf.pagePreview') }}
        </h3>
        <p class="mt-1 font-mono text-sm font-bold text-ink/52">
          {{ isLoading ? t('pdf.renderingPages') : t('pdf.pageCount', { count: pages.length }) }}
        </p>
      </div>
      <div v-if="selectable && pages.length" class="flex gap-2">
        <button
          type="button"
          class="focus-ring border border-line bg-grid px-3 py-2 font-mono text-sm font-black text-ink/70 transition hover:border-lilac hover:text-lilac"
          @click="emit('selectAll', true)"
        >
          {{ t('pdf.selectAll') }}
        </button>
        <button
          type="button"
          class="focus-ring border border-line bg-grid px-3 py-2 font-mono text-sm font-black text-ink/70 transition hover:border-coral hover:text-coral"
          @click="emit('selectAll', false)"
        >
          {{ t('pdf.clearSelection') }}
        </button>
      </div>
    </div>

    <p v-if="selectable && pages.length" class="font-mono text-sm font-black text-acid">
      {{ t('pdf.selectedPages', { count: selectedCount }) }}
    </p>

    <VueDraggable
      v-if="pages.length"
      v-model="sortablePages"
      :animation="180"
      :disabled="mode !== PdfModeValue.Merge"
      ghost-class="opacity-35"
      handle=".pdf-page-drag-handle"
      class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"
    >
      <article
        v-for="(page, index) in pages"
        :key="page.id"
        class="group border bg-grid/80 p-2 transition"
        :class="selectable && !page.selected ? 'border-line opacity-45' : 'border-line hover:border-lilac'"
      >
        <div class="relative border border-line bg-paper">
          <img :src="page.thumbnailUrl" :alt="`${page.sourceName} ${page.pageNumber}`" class="aspect-[3/4] w-full object-contain">
          <button
            v-if="selectable"
            type="button"
            class="focus-ring absolute top-2 left-2 grid size-7 place-items-center border font-mono text-sm font-black transition"
            :class="page.selected ? 'border-acid bg-acid text-paper' : 'border-line bg-panel text-ink/52 hover:border-acid hover:text-acid'"
            @click="emit('toggle', page.id)"
          >
            <Check v-if="page.selected" class="size-4" aria-hidden="true" />
          </button>
          <span v-if="mode === PdfModeValue.Merge" class="pdf-page-drag-handle absolute top-2 left-2 grid size-7 cursor-grab place-items-center border border-line bg-panel text-ink/42 active:cursor-grabbing">
            <GripVertical class="size-4" aria-hidden="true" />
          </span>
          <button
            v-if="mode === PdfModeValue.Merge"
            type="button"
            class="focus-ring absolute top-2 right-2 grid size-7 place-items-center border border-line bg-panel text-ink/52 transition hover:border-coral hover:text-coral"
            @click="emit('remove', page.id)"
          >
            <Trash2 class="size-4" aria-hidden="true" />
          </button>
        </div>
        <div class="mt-2 min-w-0 font-mono">
          <p class="truncate text-sm font-black text-ink">
            {{ page.sourceName }}
          </p>
          <p class="mt-1 text-sm font-bold text-ink/52">
            {{ t('pdf.pageNumber', { number: page.pageNumber }) }}
          </p>
        </div>
        <div v-if="mode === PdfModeValue.Merge" class="mt-2 grid grid-cols-4 gap-1">
          <button
            type="button"
            class="focus-ring grid h-8 place-items-center border border-line bg-panel text-ink/52 transition hover:border-lilac hover:text-lilac disabled:opacity-30"
            :title="t('pdf.moveFirst')"
            :aria-label="t('pdf.moveFirst')"
            :disabled="index === 0"
            @click="emit('move', index, 0)"
          >
            <ChevronsUp class="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="focus-ring grid h-8 place-items-center border border-line bg-panel text-ink/52 transition hover:border-lilac hover:text-lilac disabled:opacity-30"
            :title="t('pdf.moveUp')"
            :aria-label="t('pdf.moveUp')"
            :disabled="index === 0"
            @click="emit('move', index, index - 1)"
          >
            <ChevronUp class="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="focus-ring grid h-8 place-items-center border border-line bg-panel text-ink/52 transition hover:border-lilac hover:text-lilac disabled:opacity-30"
            :title="t('pdf.moveDown')"
            :aria-label="t('pdf.moveDown')"
            :disabled="index === pages.length - 1"
            @click="emit('move', index, index + 1)"
          >
            <ChevronDown class="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="focus-ring grid h-8 place-items-center border border-line bg-panel text-ink/52 transition hover:border-lilac hover:text-lilac disabled:opacity-30"
            :title="t('pdf.moveLast')"
            :aria-label="t('pdf.moveLast')"
            :disabled="index === pages.length - 1"
            @click="emit('move', index, pages.length - 1)"
          >
            <ChevronsDown class="size-4" aria-hidden="true" />
          </button>
        </div>
      </article>
    </VueDraggable>

    <p v-else class="border border-line bg-grid/70 px-3 py-8 text-center font-mono text-base font-bold text-ink/52">
      {{ isLoading ? t('pdf.renderingPages') : t('pdf.noPages') }}
    </p>
  </div>
</template>
