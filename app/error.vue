<script setup lang="ts">
import type { NuxtError } from '#app'
import { ArrowLeft, FileWarning } from '@lucide/vue'

const props = defineProps<{
  error: NuxtError
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const statusCode = computed(() => props.error.statusCode || 500)
const isNotFound = computed(() => statusCode.value === 404)

function backHome() {
  clearError({ redirect: localePath('/') })
}
</script>

<template>
  <NuxtLayout>
    <section class="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl place-items-center px-5 py-12 xl:px-10">
      <div class="w-full max-w-3xl border border-line bg-panel/82 p-6 shadow-[0_0_44px_var(--fx-sky-7)] backdrop-blur">
        <div class="flex items-start gap-4">
          <span class="grid size-12 shrink-0 place-items-center border border-coral/70 bg-coral/12 text-coral shadow-[0_0_28px_var(--fx-coral-16)]">
            <FileWarning class="size-6" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <p class="font-mono text-sm font-black tracking-widest text-coral uppercase">
              {{ t('error.statusLabel') }} {{ statusCode }}
            </p>
            <h1 class="mt-3 font-mono text-4xl font-black tracking-tight text-ink md:text-6xl">
              {{ isNotFound ? t('error.notFound') : t('error.title') }}
            </h1>
            <p class="mt-4 max-w-2xl text-base leading-7 font-semibold text-ink/62">
              {{ isNotFound ? t('error.description') : t('error.fallbackDescription') }}
            </p>
          </div>
        </div>

        <div class="mt-8 flex flex-wrap gap-3 border-t border-line pt-5">
          <button
            type="button"
            class="focus-ring inline-flex items-center gap-2 border border-acid/70 bg-acid px-5 py-3 font-mono text-sm font-black text-paper shadow-[0_0_24px_var(--fx-acid-18)] transition hover:bg-acid/85"
            @click="backHome"
          >
            <ArrowLeft class="size-4" aria-hidden="true" />
            {{ t('error.backHome') }}
          </button>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>
