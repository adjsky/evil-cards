import React, { useState, useRef } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useAtom } from "jotai"

import { usernameAtom } from "../atoms"
import useSocket from "../hooks/use-socket"
import useScreenFactor from "../hooks/use-screen-factor"
import useHasMounted from "../hooks/use-has-mounted"

import UsernameInput from "../components/username-input"
import Plus from "../assets/plus.svg"
import Logo from "../components/logo"

import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"

const Entry: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const screenStyles = useScreenFactor({
    ref: containerRef,
    px: 40,
    py: 40
  })
  const { sendJsonMessage } = useSocket<SendMessage, ReceiveMessage>()
  const [username, setUsername] = useAtom(usernameAtom)
  const [avatarId, setAvatarId] = useState(1)
  const mounted = useHasMounted()
  const searchParams = useSearchParams()
  const joining = searchParams.has("s")

  return (
    <main className="h-screen">
      <div
        ref={containerRef}
        style={screenStyles}
        className="flex w-[20.625rem] flex-col items-center justify-center gap-8"
      >
        <Logo />
        <div className="flex aspect-[0.71942446043] w-48 flex-col items-center justify-center gap-5 rounded-lg bg-gray-100 pt-3">
          <div className="rounded-full border-[2px] border-gray-900 p-[2px]">
            <div className="relative">
              <Image
                src={`/avatars/${avatarId}.svg`}
                width={120}
                height={120}
                alt=""
              />
              <button
                onClick={() =>
                  setAvatarId((prev) => (prev == 17 ? 1 : prev + 1))
                }
                className="absolute right-[4px] top-[4px] flex h-[25px] w-[25px] items-center justify-center rounded-full bg-gray-900 transition-transform hover:rotate-[15deg]"
              >
                <Plus />
              </button>
            </div>
          </div>
          <UsernameInput
            value={mounted ? username : ""} // https://jotai.org/docs/utils/atom-with-storage#server-side-rendering
            onChange={setUsername}
          />
        </div>
        <button
          onClick={() => {
            const s = searchParams.get("s")
            if (s) {
              sendJsonMessage({
                type: "joinsession",
                details: {
                  username,
                  sessionId: s,
                  avatarId
                }
              })

              return
            }

            sendJsonMessage({
              type: "createsession",
              details: {
                username,
                avatarId
              }
            })
          }}
          className="rounded-lg bg-red-500 px-5 py-4 text-xl leading-none text-gray-100 transition-colors hover:bg-gray-100 hover:text-red-500"
        >
          {joining ? "ВОЙТИ" : "НАЧАТЬ"}
        </button>
      </div>
    </main>
  )
}

export default Entry
