import React, { useState } from "react"
import Image from "next/future/image"
import Router from "next/router"
import { useAtom } from "jotai"

import { useSocket } from "../ws/hooks"
import { sessionAtom } from "../atoms"

import UsernameInput from "../components/username-input"
import { Plus, Logo } from "../components/icons"
import cat from "../assets/cat.svg"

import type { Message as SendMessage } from "@kado/schemas/client/send"
import type { Message as ReceiveMessage } from "@kado/schemas/client/receive"

const Entry: React.FC = () => {
  const { sendJsonMessage, lastJsonMessage } = useSocket<
    SendMessage,
    ReceiveMessage
  >({
    onJsonMessage(data) {
      if (data.type == "created" || data.type == "joined") {
        setSession(data.details.session)
      }
    }
  })
  const [session, setSession] = useAtom(sessionAtom)
  const [username, setUsername] = useState("Игрок")

  if (session) {
    return null
  }

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-8">
      <Logo />
      <div className="flex aspect-[0.71942446043] w-[200px] flex-col items-center justify-center gap-5 rounded-lg bg-gray-100 pt-3">
        <div className="rounded-full border-[2px] border-gray-900 p-[2px]">
          <div className="relative">
            <Image src={cat} width={120} height={120} alt="" />
            <button className="absolute right-[4px] top-[4px] flex h-[25px] w-[25px] items-center justify-center rounded-full bg-gray-900 transition-transform hover:rotate-[15deg]">
              <Plus />
            </button>
          </div>
        </div>
        <UsernameInput value={username} onChange={setUsername} />
      </div>
      <button
        onClick={() => {
          const { sessionId } = Router.query
          if (typeof sessionId == "string") {
            sendJsonMessage({
              type: "joinsession",
              details: {
                username,
                sessionId
              }
            })

            return
          }

          sendJsonMessage({
            type: "createsession",
            details: {
              username
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
