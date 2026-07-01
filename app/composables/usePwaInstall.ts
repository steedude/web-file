interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePwaInstall() {
  const deferredPrompt = useState<BeforeInstallPromptEvent | null>('pwa-install-prompt', () => null)
  const canInstall = computed(() => Boolean(deferredPrompt.value))

  if (import.meta.client) {
    window.addEventListener('beforeinstallprompt', (event) => {
      // 先攔下瀏覽器預設提示，讓安裝入口交給右上角按鈕控制。
      event.preventDefault()
      deferredPrompt.value = event as BeforeInstallPromptEvent
    })
  }

  async function install() {
    if (!deferredPrompt.value)
      return

    await deferredPrompt.value.prompt()
    await deferredPrompt.value.userChoice
    deferredPrompt.value = null
  }

  return {
    canInstall,
    install,
  }
}
