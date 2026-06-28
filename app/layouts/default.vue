<script setup lang="ts">
import { Download, Languages, Wifi, WifiOff } from '@lucide/vue'

const { locale, setLocale, t } = useI18n()
const localePath = useLocalePath()
const { canInstall, install, isOnline } = usePwaInstall()

function toggleLocale() {
  setLocale(locale.value === 'zh-TW' ? 'en' : 'zh-TW')
}
</script>

<template>
  <div class="min-h-screen text-ink">
    <div class="noise" />
    <header class="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
      <NuxtLink :to="localePath('/')" class="focus-ring group inline-flex items-center gap-3 rounded-full">
        <span class="grid size-10 rotate-3 place-items-center rounded-xl border-2 border-ink bg-acid text-sm font-black shadow-[3px_3px_0_#171714] transition group-hover:-rotate-3">
          {{ t('common.logoMark') }}
        </span>
        <span class="hidden text-sm font-black tracking-[0.16em] uppercase lg:block">{{ t('brand') }}</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <span
          class="hidden items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-2 text-xs font-black shadow-[2px_2px_0_#171714] sm:inline-flex"
          :title="isOnline ? t('pwa.online') : t('pwa.offline')"
        >
          <Wifi v-if="isOnline" class="size-4" aria-hidden="true" />
          <WifiOff v-else class="size-4" aria-hidden="true" />
          {{ isOnline ? t('pwa.online') : t('pwa.offline') }}
        </span>

        <button
          v-if="canInstall"
          type="button"
          class="focus-ring grid size-10 place-items-center rounded-full border-2 border-ink bg-mint shadow-[2px_2px_0_#171714] transition hover:-translate-y-0.5"
          :title="t('pwa.install')"
          :aria-label="t('pwa.install')"
          @click="install"
        >
          <Download class="size-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="focus-ring grid size-10 place-items-center rounded-full border-2 border-ink bg-white shadow-[2px_2px_0_#171714] transition hover:-translate-y-0.5"
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
