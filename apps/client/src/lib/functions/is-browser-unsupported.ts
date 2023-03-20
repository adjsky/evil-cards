function isBrowserUnsupported() {
  const hasResizeObserver = "ResizeObserver" in window
  const hasMutationObserver = "MutationObserver" in window
  const hasAnimation = "Animation" in window

  return !hasResizeObserver || !hasMutationObserver || !hasAnimation
}

export default isBrowserUnsupported
