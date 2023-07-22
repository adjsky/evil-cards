function raise(msg: string): never {
  throw new Error(msg)
}

export default raise
