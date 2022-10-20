import React from "react"
import Image from "next/future/image"
import clsx from "clsx"

import { CheckMark, Crown, Question } from "../components/icons"

import type { User } from "@kado/schemas/dist/client/receive"

const UserList: React.FC<{ users: User[]; variant: "game" | "waiting" }> = ({
  users,
  variant
}) => {
  const filteredUsers = users.filter((user) => user.disconnected == false)

  return (
    <div className="scrollable flex h-full flex-col gap-2 pr-2">
      {filteredUsers.map((user) => (
        <User key={user.id} user={user} variant={variant} />
      ))}
      {variant == "waiting" &&
        Array.from({ length: 10 - filteredUsers.length }).map((_, index) => (
          <User key={index} variant={variant} />
        ))}
    </div>
  )
}

const User: React.FC<{ user?: User; variant: "game" | "waiting" }> = ({
  user,
  variant
}) => {
  return (
    <div className="flex w-[194px] items-center gap-2 rounded-xl border-2 border-gray-200 px-2 py-1">
      {user && (variant == "waiting" && user.host ? <Crown /> : null)}
      {user &&
        (variant == "game" && user.master ? (
          <Crown />
        ) : user.voted ? (
          <CheckMark />
        ) : null)}
      {user ? (
        <Image
          src={`/avatars/${user.avatarId}.svg`}
          width={48}
          height={48}
          alt=""
        />
      ) : (
        <Question />
      )}
      <div
        className={clsx(
          "flex flex-col gap-1",
          user ? "text-gray-100" : "text-gray-600"
        )}
      >
        <span className="text-xs leading-none">
          {user?.username ?? "Пусто"}
        </span>
        {user && variant == "game" && (
          <span className="text-base font-medium leading-none">
            {user.score}{" "}
            {user.score == 0 ? "очков" : user.score == 1 ? "очко" : "очка"}
          </span>
        )}
      </div>
    </div>
  )
}

export default UserList
