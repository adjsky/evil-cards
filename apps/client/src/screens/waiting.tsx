import React, { useEffect } from "react"
import { useAtomValue } from "jotai"
import Image from "next/future/image"
import dynamic from "next/dynamic"
import clsx from "clsx"

import { sessionAtom } from "../atoms"
import { useSocket } from "../ws/hooks"
import useToggle from "../hooks/use-toggle"

import { Logo, Crown } from "../components/icons"
import cat from "../assets/cat.svg"

import type { User } from "@kado/schemas/client/receive"

const Waiting: React.FC = () => {
  const session = useAtomValue(sessionAtom)
  useSocket()

  if (session?.state != "waiting") {
    return null
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <Logo />
      <div className="flex gap-4">
        <div className="h-[700px]">
          <Users users={session.users} />
        </div>
        <div className="flex w-[900px] flex-col gap-6">
          <div className="flex h-full w-full flex-col rounded-lg border-2 border-gray-200 p-4">
            <h2 className="text-center text-3xl font-bold text-gray-100">
              ПРАВИЛА
            </h2>
          </div>
          <div className="flex w-full justify-center gap-6">
            <DynamicInviteButton id={session.id} />
            <button className="rounded-lg bg-red-500 px-5 py-4 text-xl leading-none text-gray-100 transition-colors hover:bg-gray-100 hover:text-red-500">
              НАЧАТь
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const InviteButton: React.FC<{ id: string }> = ({ id }) => {
  const [copied, toggleCopied] = useToggle()
  useEffect(() => {
    if (!copied) {
      return
    }

    const timeout = setTimeout(toggleCopied, 1000)
    return () => {
      clearTimeout(timeout)
    }
  }, [copied, toggleCopied])

  return (
    <div className="relative">
      <button
        className="rounded-lg border-gray-100 bg-gray-100 px-5 py-4 text-xl leading-none text-gray-900"
        onClick={async () => {
          await navigator.clipboard.writeText(
            `${window.location.href}?sessionId=${id}`
          )

          toggleCopied()
        }}
      >
        ПРИГЛАСИТЬ
      </button>
      <span
        className={clsx(
          "absolute left-1/2 -bottom-[25px] -translate-x-1/2 text-xs font-bold tracking-wider text-gold-500 opacity-0 transition-opacity",
          copied && "opacity-100"
        )}
      >
        СКОПИРОВАНО
      </span>
    </div>
  )
}
const DynamicInviteButton = dynamic(() => Promise.resolve(InviteButton), {
  ssr: false
})

const Users: React.FC<{ users: User[] }> = ({ users }) => {
  return (
    <div className="scrollable flex h-full flex-col gap-2 pr-2">
      {users.map((user) => (
        <User key={user.id} user={user} />
      ))}
      {Array.from({ length: 10 - users.length }).map((_, index) => (
        <User key={index} />
      ))}
    </div>
  )
}

const User: React.FC<{ user?: User }> = ({ user }) => {
  return (
    <div className="flex w-[291px] items-center gap-2 rounded-xl border-2 border-gray-200 px-3 py-2">
      {user?.host && <Crown width={22} height={17} />}
      <Image src={cat} width={72} height={72} alt="" />
      <div className="flex flex-col gap-1 text-gray-100">
        <span className="text-lg leading-none">
          {user?.username ?? "Пусто"}
        </span>
      </div>
    </div>
  )
}

export default Waiting
