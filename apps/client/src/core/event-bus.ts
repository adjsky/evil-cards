import { useEffect } from "react"

type Listener<T = unknown> = T extends undefined
  ? () => void
  : (data: T) => void
type Events = Record<PropertyKey, unknown>
type DatalessEventNames<EventData> = {
  [Key in keyof EventData]: EventData[Key] extends undefined ? Key : never
}[keyof EventData]

/**
 *  Generic event bus (event emitter)
 *
 *  @example
 *  type Events = {
 *    eventWithoutData: undefined,
 *    eventWithData: number
 *  }
 *  const eventBus = new EventBus<Events>()
 *
 *  const eventWithDataListener = () => {}
 *  eventBus.subscribe("eventWithData", eventWithDataListener)
 *  eventBus.emit("eventWithData", 4)
 *
 *  const eventWithoutDataListener = () => {}
 *  eventBus.subscribe("eventWithoutData", eventWithoutDataListener)
 *  eventBus.emit("eventWithoutData")
 *
 *  eventBus.unsubscribe("eventWithData", eventWithoutListener)
 *  eventBus.unsubscribe("eventWithoutData", eventWithoutDataListener)
 */
export class EventBus<
  EventData extends Events,
  DatalessEvents = DatalessEventNames<EventData>
> {
  private eventsMap: Map<PropertyKey, Set<Listener>>

  constructor() {
    this.eventsMap = new Map()
  }

  emit<Name extends DatalessEvents>(event: Name): boolean
  emit<Name extends keyof EventData>(
    event: Name,
    data: EventData[Name]
  ): boolean
  emit<Name extends keyof EventData>(event: Name, data?: EventData[Name]) {
    const eventListeners = this.eventsMap.get(event)
    if (!eventListeners || eventListeners.size == 0) {
      return false
    }

    eventListeners.forEach((listener) => listener(data))

    return true
  }

  subscribe<Name extends keyof EventData>(
    event: Name,
    listener: Listener<EventData[Name]>
  ): void {
    if (!this.eventsMap.has(event)) {
      this.eventsMap.set(event, new Set())
    }
    const eventListeners = this.eventsMap.get(event)!

    eventListeners.add(listener)
  }

  unsubscribe<Name extends keyof EventData>(
    event: Name,
    listener: Listener<EventData[Name]>
  ): boolean {
    const eventListeners = this.eventsMap.get(event)

    if (!eventListeners) {
      return false
    }

    return eventListeners.delete(listener)
  }
}

export function createEventBus<T extends Events>() {
  const eventBus = new EventBus<T>()

  return {
    emit: eventBus.emit.bind(eventBus),
    subscribe: eventBus.subscribe.bind(eventBus),
    unsubscribe: eventBus.unsubscribe.bind(eventBus),
    useSubscription<K extends keyof T>(event: K, listener: Listener<T[K]>) {
      useEffect(() => {
        eventBus.subscribe(event, listener)

        return () => {
          eventBus.unsubscribe(event, listener)
        }
      }, [event, listener])
    }
  }
}
