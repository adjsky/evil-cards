import React from "react"
import Image from "next/image"
import clsx from "clsx"

import getScoreLabel from "@/functions/get-score-label"

import CheckMark from "@/assets/check-mark.svg"
import Crown from "@/assets/crown.svg"
import Question from "@/assets/question.svg"

import type { User as UserType } from "@evil-cards/server/src/lib/ws/send"

const DesktopUserList: React.FC<{
  users: UserType[]
  variant: "game" | "waiting"
}> = ({ users, variant }) => {
  const filteredUsers = users.filter((user) => user.disconnected == false)

  return (
    <div
      className="scrollable hidden h-full flex-col gap-2 pr-2 sm:flex"
      data-testid="user-list"
    >
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

const User: React.FC<{ user?: UserType; variant: "game" | "waiting" }> = ({
  user,
  variant
}) => {
  const displayCrown =
    (variant == "waiting" && user?.host) || (variant == "game" && user?.master)
  const displayCheckMark = variant == "game" && user?.voted

  return (
    <div className="flex w-[194px] items-center gap-2 rounded-xl border-2 border-gray-200 px-2 py-1">
      {(displayCheckMark || displayCrown) && (
        <div className="flex w-[16px] justify-center">
          {displayCrown && <Crown />}
          {displayCheckMark && <CheckMark />}
        </div>
      )}
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
            {user.score} {getScoreLabel(user.score)}
          </span>
        )}
      </div>
    </div>
  )
}

export default DesktopUserList
