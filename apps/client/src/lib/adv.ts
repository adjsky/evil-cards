export function renderAdv() {
  const yaWindow = window as unknown as {
    Ya?: {
      Context: {
        AdvManager: {
          render(
            params: {
              blockId: string
              type?: string
              platform?: string
              renderTo?: string
              onClose?: () => void
              onError?: (error: unknown) => void
              onRender?: (data: unknown) => void
            },
            callback: () => void
          ): void
          getPlatform(): string
        }
      }
    }
  }

  return new Promise<boolean>((resolve) => {
    if (!yaWindow.Ya) {
      return resolve(false)
    }

    const isDesktop = yaWindow.Ya.Context.AdvManager.getPlatform() == "desktop"

    yaWindow.Ya.Context.AdvManager.render(
      {
        blockId: isDesktop ? "R-A-3676892-1" : "R-A-3676892-3",
        type: "fullscreen",
        platform: isDesktop ? "desktop" : "touch",
        onError(error) {
          console.error(error)

          resolve(false)
        },
        onClose() {
          resolve(true)
        }
      },
      () => {
        resolve(false)
      }
    )
  })
}
