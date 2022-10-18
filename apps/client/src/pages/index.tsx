import { useEffect, useState, useRef } from "react"
import Image from "next/future/image"
import useWebSocket from "react-use-websocket"

import { env } from "../env/client.mjs"
import { Message as SendMessage } from "@kado/schemas/client/send"
import {
  Message as ReceiveMessage,
  Session,
  User
} from "@kado/schemas/client/receive"

import UsernameInput from "../components/username-input"
import { Plus, Crown } from "../components/icons"
import catEyes from "../assets/cat-eyes.svg"
import cat from "../assets/cat.svg"

import type { NextPage } from "next"

const Home: NextPage = () => {
  const [session, setSession] = useState<Session | null>(null)
  // const { sendJsonMessage: _sendJsonMessage, lastJsonMessage } =
  //   useWebSocket<ReceiveMessage>(env.NEXT_PUBLIC_WS_HOST, {
  //     onMessage({ data }) {
  //       const parsedData = JSON.parse(data) as ReceiveMessage
  //       console.log(parsedData)
  //       if (parsedData.type != "error" && parsedData.type != "gameend") {
  //         setSession(parsedData.details.session)
  //       }
  //     }
  //   })
  // const sendJsonMessage = (data: SendMessage) => {
  //   _sendJsonMessage(data)
  // }

  

  if (session) {
    return <Game session={session} />
  }

  return (
    <Entry
      onConnect={(username) => {
        // sendJsonMessage({
        //   type: "createsession",
        //   details: {
        //     username
        //   }
        // })
      }}
    />
  )
}

const Record: React.FC<{ user: User }> = ({ user }) => {
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
        <Record key={user.id} user={user} />
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

const Game: React.FC<{ session: Session }> = ({ session }) => {
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

const Entry: React.FC<{ onConnect?: (username: string) => void }> = ({
  onConnect
}) => {
  const [username, setUsername] = useState("Игрок")

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center justify-center">
        <Image src={catEyes} alt="" />
        <h1 className="text-center text-2xl font-bold leading-none text-gray-100">
          <span>500</span>{" "}
          <span className="text-4xl leading-none text-red-500">ЗЛОБНЫХ</span>{" "}
          <span>карт</span> <br /> <span className="h text-lg">онлайн</span>
        </h1>
      </div>
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
        onClick={() => onConnect && onConnect(username)}
        className="rounded-lg bg-red-500 px-5 py-4 text-xl leading-none text-gray-100 transition-colors hover:bg-gray-100 hover:text-red-500"
      >
        НАЧАТЬ
      </button>
    </main>
  )
}

export default Home
