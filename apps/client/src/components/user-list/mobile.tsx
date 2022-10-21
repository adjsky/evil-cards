import React from "react"
import Image from "next/future/image"
import clsx from "clsx"

import { CheckMark, Crown, Question } from "../../components/icons"

import type { User } from "@kado/schemas/dist/client/receive"

const MobileUserList: React.FC<{
  users: User[]
  variant: "game" | "waiting"
}> = ({ users, variant }) => {
  const filteredUsers = users.filter((user) => user.disconnected == false)

  return (
    <div className="w-full overflow-y-auto sm:hidden">
      <div className="flex">
        {filteredUsers.map((user) => (
          <User key={user.id} user={user} variant={variant} />
        ))}
        {variant == "waiting" &&
          Array.from({ length: 10 - filteredUsers.length }).map((_, index) => (
            <User key={index} variant={variant} />
          ))}
      </div>
    </div>
  )
}

const User: React.FC<{ user?: User; variant: "game" | "waiting" }> = ({
  user,
  variant
}) => {
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-1">
      <div className="relative h-[44px] w-[44px] flex-none">
        {user ? (
          <Image
            src={`/avatars/${user.avatarId}.svg`}
            width={44}
            height={44}
            alt=""
          />
        ) : (
          <Question width={44} height={44} />
        )}
      </div>
      <div className="flex flex-col items-center justify-center text-gray-100">
        {variant == "game" && user && (
          <span className="text-xs font-medium">
            {user.score}{" "}
            {user.score == 0 || user.score > 4
              ? "очков"
              : user.score == 1
              ? "очко"
              : "очка"}
          </span>
        )}
        <span className="text-[10px]">{user?.username ?? "Пусто"}</span>
      </div>
    </div>
  )
}

export default MobileUserList
