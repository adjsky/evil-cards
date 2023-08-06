import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { cn } from "@/lib/functions"

import CatConfused from "../assets/cats/confused.svg"
import Send from "../assets/send.svg"

import type { ChatMessage } from "@/lib/atoms/session"

const Chat: React.FC<{
  chat: ChatMessage[]
  onChat: (message: string) => void
  onMessageRead: (id: string) => void
}> = ({ chat, onChat, onMessageRead }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const scrolledToBottomRef = useRef(true)

  const [message, setMessage] = useState("")

  const sendMessage = () => {
    if (message == "") {
      return
    }

    onChat(message.trim().replace(/\s\s+/g, " "))
    setMessage("")
  }

  useLayoutEffect(() => {
    if (!textAreaRef.current) {
      return
    }

    textAreaRef.current.style.height = ""
    textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px"
  }, [message])

  useEffect(() => {
    if (!listRef.current || !scrolledToBottomRef.current) {
      return
    }

    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [chat])

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 text-[13px] text-gray-100">
      {chat.length == 0 && (
        <div className="flex flex-auto flex-col items-center justify-center gap-2">
          <CatConfused />
          <span className="text-sm">В чате ничего нет...</span>
        </div>
      )}
      {chat.length != 0 && (
        <ul
          className="scrollable flex-auto text-left"
          ref={listRef}
          onScroll={(event) => {
            const target = event.currentTarget

            // Detect whether user scrolled to bottom of the chat
            scrolledToBottomRef.current =
              target.scrollHeight - target.offsetHeight - target.scrollTop < 10

            // Detect if any unread messages were scrolled.
            // Start from end and break when any read message is found
            // because there couldn't be any unread messages after read messages
            // and unread messages appear only at the end.
            for (let i = target.children.length - 1; i >= 0; i--) {
              const element = target.children[i]

              const read = element.getAttribute("data-read")
              const id = element.getAttribute("data-id")

              if (read == "true") {
                break
              }

              if (!id) {
                throw new Error(
                  "Expected to have `data-id` property on child element"
                )
              }

              if (!isElementVisible(element)) {
                continue
              }

              onMessageRead(id)
            }
          }}
        >
          {chat.map(({ nickname, message, id, read }) => (
            <li
              key={id}
              className="py-0.5"
              data-id={id}
              data-read={read}
              ref={(element) => {
                if (!element || read) {
                  return
                }

                if (!isElementVisible(element)) {
                  return
                }

                onMessageRead(id)
              }}
            >
              <span className="font-medium text-gray-300">{nickname}:</span>
              <span>&nbsp;</span>
              <span className="break-words">{message}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex w-full flex-col">
            <textarea
              ref={textAreaRef}
              value={message}
              className={cn(
                "peer w-full resize-none overflow-y-hidden outline-none",
                "bg-transparent text-gray-100 placeholder-gray-100 placeholder-opacity-60"
              )}
              rows={1}
              placeholder="Напишите в чат"
              onChange={({ target }) => {
                if (target.value.length <= 200) {
                  setMessage(target.value)
                }
              }}
              onKeyDown={(event) => {
                if (event.key == "Enter") {
                  event.preventDefault()
                  sendMessage()
                }
              }}
            />
            <div className="h-[1px] w-full bg-gray-100 opacity-60 transition-opacity peer-focus:opacity-100" />
          </div>
          <button
            className="self-end p-0.5 uppercase text-gray-100"
            disabled={message == ""}
            onClick={sendMessage}
          >
            <Send />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat

// Here we have to implement custom visibility logic instead of using `IntersectionObserver`
// due to some strange bugs, especially in chrome, when opening this chat component in the `Modal` component.
// More likely i'm just dumb and missed something, but i'll implement everything by myself.

function isElementVisible(element: Element) {
  return isElementInView(element) && !isElementHidden(element)
}

function isElementHidden(element: Element) {
  const styles = window.getComputedStyle(element)

  if (styles.display == "none") {
    return true
  }

  if (element.parentElement == null) {
    return false
  }

  return isElementHidden(element.parentElement)
}

function isElementInView(element: Element) {
  const parent = element.parentElement

  if (!parent) {
    throw new Error("`element` has to be children")
  }

  const parentRect = parent.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()

  if (elementRect.top <= parentRect.top) {
    return parentRect.top - elementRect.top <= elementRect.height
  } else {
    return elementRect.bottom - parentRect.bottom <= elementRect.height
  }
}
