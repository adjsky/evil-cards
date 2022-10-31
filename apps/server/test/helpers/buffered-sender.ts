import type { Sender } from "../../src/game/session"

class BufferedSender<T = string> implements Sender<T> {
  private skip = false
  private messages: T[] = []

  public constructor(skip?: boolean) {
    if (skip) {
      this.skip = true
    }
  }

  public send(data: T) {
    if (this.skip) {
      return
    }

    this.messages.push(data)
  }

  public getMessages() {
    return this.messages
  }

  public clearMessages() {
    this.messages = []
  }
}

export default BufferedSender
