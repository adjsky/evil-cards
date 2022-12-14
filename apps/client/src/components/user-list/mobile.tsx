import React from "react"
import Image from "next/image"

import getScoreLabel from "@/functions/get-score-label"

import CheckMark from "@/assets/check-mark.svg"
import Crown from "@/assets/crown.svg"
import Question from "@/assets/question.svg"

import type { User as UserType } from "@evil-cards/server/src/lib/ws/send"

const MobileUserList: React.FC<{
  users: UserType[]
  variant: "game" | "waiting"
}> = ({ users, variant }) => {
  const filteredUsers = users.filter((user) => user.disconnected == false)

  return (
    <div className="w-full overflow-x-auto sm:hidden">
      <div className="flex" data-testid="user-list">
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

const User: React.FC<{ user?: UserType; variant: "game" | "waiting" }> = ({
  user,
  variant
}) => {
  const displayCrown =
    (variant == "waiting" && user?.host) || (variant == "game" && user?.master)
  const displayMark = variant == "game" && user?.voted

  return (
    <div className="flex w-[70px] flex-col items-center gap-1 p-2 pb-0">
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
        {displayCrown && (
          <div className="absolute left-0 bottom-0">
            <Crown />
          </div>
        )}
        {displayMark && (
          <div className="absolute right-0 bottom-0">
            <CheckMark />
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-center text-gray-100">
        {variant == "game" && user && (
          <span className="text-xs font-medium">
            {user.score} {getScoreLabel(user.score)}
          </span>
        )}
        <span className="inline-block max-w-[60px] overflow-hidden overflow-ellipsis whitespace-nowrap text-[10px]">
          {user?.username ?? "??????????"}
        </span>
      </div>
    </div>
  )
}

export default MobileUserList
