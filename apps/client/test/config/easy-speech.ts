const mock = {
  voices: () => [],
  status: () => ({
    initialized: false
  }),
  speak: () => Promise.resolve({}),
  init: () => Promise.resolve(true)
}

export default mock
