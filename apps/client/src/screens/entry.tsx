import React, { useState } from "react"
import Image from "next/future/image"
import Router from "next/router"

import useSocket from "../hooks/use-socket"

import UsernameInput from "../components/username-input"
import { Plus, Logo } from "../components/icons"

import type { Message as SendMessage } from "@kado/schemas/dist/client/send"
import type { Message as ReceiveMessage } from "@kado/schemas/dist/client/receive"

const Entry: React.FC = () => {
  const { sendJsonMessage } = useSocket<SendMessage, ReceiveMessage>()
  const [username, setUsername] = useState("Игрок")
  const [avatarId, setAvatarId] = useState(1)

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-8 py-10">
      <Logo />
      <div className="flex aspect-[0.71942446043] w-[200px] flex-col items-center justify-center gap-5 rounded-lg bg-gray-100 pt-3">
        <div className="rounded-full border-[2px] border-gray-900 p-[2px]">
          <div className="relative">
            <Image
              src={`/avatars/${avatarId}.svg`}
              width={120}
              height={120}
              alt=""
            />
            <button
              onClick={() => setAvatarId((prev) => (prev == 17 ? 1 : prev + 1))}
              className="absolute right-[4px] top-[4px] flex h-[25px] w-[25px] items-center justify-center rounded-full bg-gray-900 transition-transform hover:rotate-[15deg]"
            >
              <Plus />
            </button>
          </div>
        </div>
        <UsernameInput value={username} onChange={setUsername} />
      </div>
      <button
        onClick={() => {
          const { s } = Router.query
          if (typeof s == "string") {
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
        НАЧАТЬ
      </button>
    </main>
  )
}

export default Entry
