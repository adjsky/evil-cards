const mockWindowSize = (width: number, height?: number) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width
  })

  if (height) {
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: height
    })
  }
}

export default mockWindowSize
