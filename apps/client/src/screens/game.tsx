import React from "react"
import Image from "next/future/image"
import { useAtom } from "jotai"

import { sessionAtom } from "../atoms"
import { useSocket } from "../ws/hooks"

import { Crown } from "../components/icons"
import cat from "../assets/cat.svg"

import type { User } from "@kado/schemas/client/receive"

const Game: React.FC = () => {
  const [session, setSession] = useAtom(sessionAtom)
  useSocket()

  if (session?.state != "voting" && session?.state != "choosing") {
    return null
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      <div className="flex h-[342px] items-center justify-center gap-[49px]">
        <div className="h-[241px] w-[174px] rounded-lg bg-red-500 p-4 text-lg font-medium leading-[1.15] text-gray-100">
          На луне можно найти две вещи: мячики для гольфа и _____
        </div>
      </div>
      <div className="flex h-[364px] gap-4">
        <Leaderboard users={session.users} />
        <div className="flex flex-col gap-3">
          <div className="relative h-[10px] w-full rounded-lg bg-gray-200">
            <div className="absolute left-0 top-0 h-full w-1/4 rounded-lg bg-red-500"></div>
          </div>
          <div className="grid grid-cols-5 grid-rows-2 gap-2">
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
          </div>
        </div>
      </div>
    </div>
  )
}

const User: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="flex w-[194px] items-center gap-2 rounded-xl border-2 border-gray-200 px-2 py-1">
      {user.host && <Crown />}
      <Image src={cat} width={48} height={48} alt="" />
      <div className="flex flex-col gap-1 text-gray-100">
        <span className="text-xs leading-none">{user.username}</span>
        <span className="text-base font-medium leading-none">
          {user.score}{" "}
          {user.score == 0 ? "очков" : user.score == 1 ? "очко" : "очка"}
        </span>
      </div>
    </div>
  )
}

const Leaderboard: React.FC<{ users: User[] }> = ({ users }) => {
  return (
    <div className="scrollable flex h-full flex-col gap-2 pr-2">
      {users.map((user) => (
        <User key={user.id} user={user} />
      ))}
    </div>
  )
}

const Card: React.FC = () => {
  return (
    <button className="flex h-[167px] w-[120px] rounded-lg bg-gray-100 p-3 text-left">
      <span className="inline-block w-full break-words text-sm font-medium leading-[1.15]">
        Сферический конь в вакууме
      </span>
    </button>
  )
}

export default Game
