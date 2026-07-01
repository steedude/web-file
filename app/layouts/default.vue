<script setup lang="ts">
import { Download, Languages } from '@lucide/vue'

const { locale, setLocale, t } = useI18n()
const localePath = useLocalePath()
const { canInstall, install } = usePwaInstall()

function toggleLocale() {
  setLocale(locale.value === 'zh-TW' ? 'en' : 'zh-TW')
}
</script>

<template>
  <div class="min-h-screen text-ink">
    <div class="noise" />
    <header class="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 xl:px-10">
      <NuxtLink :to="localePath('/')" class="focus-ring group inline-flex items-center gap-3 rounded-sm">
        <span class="grid size-10 place-items-center border border-acid/60 bg-acid/12 font-mono text-sm font-black text-acid shadow-[0_0_24px_var(--fx-acid-18)] transition group-hover:bg-acid group-hover:text-paper">
          {{ t('common.logoMark') }}
        </span>
        <span class="hidden font-mono text-sm font-black tracking-[0.22em] text-ink/80 uppercase xl:block">{{ t('brand') }}</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <button
          v-if="canInstall"
          type="button"
          class="focus-ring grid size-10 place-items-center border border-mint/60 bg-mint/12 text-mint transition hover:bg-mint hover:text-paper"
          :title="t('pwa.install')"
          :aria-label="t('pwa.install')"
          @click="install"
        >
          <Download class="size-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="focus-ring grid size-10 place-items-center border border-line bg-panel/85 text-ink/70 transition hover:border-sky hover:text-sky"
          :title="locale === 'zh-TW' ? t('common.switchToEnglish') : t('common.switchToChinese')"
          :aria-label="locale === 'zh-TW' ? t('common.switchToEnglish') : t('common.switchToChinese')"
          @click="toggleLocale"
        >
          <Languages class="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>
