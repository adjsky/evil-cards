function isLocalStorageAvailable() {
  const test = "test"

  try {
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

export default isLocalStorageAvailable
