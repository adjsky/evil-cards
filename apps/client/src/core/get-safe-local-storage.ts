import isLocalStorageAvailable from "./is-local-storage-available"

const fakeStorage: Storage = {
  clear() {
    //
  },
  getItem() {
    return null
  },
  key() {
    return null
  },
  length: 0,
  removeItem() {
    //
  },
  setItem() {
    //
  }
}

function getSafeLocalStorage() {
  if (!isLocalStorageAvailable()) {
    return fakeStorage
  }

  return localStorage
}

export default getSafeLocalStorage
