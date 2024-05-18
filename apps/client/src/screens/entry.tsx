import { useAtom } from "jotai"
import React, { useRef } from "react"

import { avatarAtom, nicknameAtom } from "@/lib/atoms/game"
import { AVAILABLE_AVATARS } from "@/lib/data/constants"
import isBrowserUnsupported from "@/lib/functions/is-browser-unsupported"
import useCreateOrJoinSession from "@/lib/hooks/use-create-or-join-session"
import useScreenFactor from "@/lib/hooks/use-screen-factor"

import AvailableSessions from "@/components/available-sessions"
import Button from "@/components/button"
import FadeIn from "@/components/fade-in"
import Loader from "@/components/loader"
import Logo from "@/components/logo"
import NicknameInput from "@/components/nickname-input"

import { ReactComponent as Arrow } from "@/assets/arrows/left-line.svg"

const Entry: React.FC = () => {
  const unsupported = useRef(isBrowserUnsupported())
  const [screenStyles, containerRef] = useScreenFactor({
    px: 40,
    py: 40,
    disableOnMobile: true
  })
  const { createOrJoinSession, connecting } = useCreateOrJoinSession()

  const searchParams = new URLSearchParams(window.location.search)
  const sessionId = searchParams.get("s")

  const disabled = connecting || unsupported.current

  return (
    <FadeIn
      className="flex h-full flex-row items-center justify-center"
      duration={100}
    >
      <div
        ref={containerRef}
        style={screenStyles}
        className="flex flex-col items-center justify-center gap-8 sm:h-[30.625rem] sm:w-[21.25rem]"
      >
        <Logo />
        <UserCard />
        <div className="flex gap-2">
          {sessionId == null && <AvailableSessions />}
          <Button
            variant="filled"
            onClick={() => createOrJoinSession(sessionId ?? undefined)}
            className="w-28 uppercase"
            disabled={disabled}
            data-testid="connect-session"
          >
            {connecting ? (
              <Loader
                className="fill-gray-100 opacity-75"
                width={20}
                height={20}
              />
            ) : (
              "Играть"
            )}
          </Button>
        </div>
      </div>
    </FadeIn>
  )
}

const UserCard: React.FC = () => {
  const [nickname, setNickname] = useAtom(nicknameAtom)
  const [avatarId, setAvatarId] = useAtom(avatarAtom)

  return (
    <div className="flex aspect-[65/90] w-48 flex-col items-center justify-center gap-5 rounded-lg bg-gray-100 pt-3">
      <div className="rounded-full border-[2px] border-gray-900 p-[2px]">
        <div className="relative">
          <button
            onClick={() =>
              setAvatarId((prev) => (prev == AVAILABLE_AVATARS ? 1 : prev + 1))
            }
            className="absolute -right-5 top-1/2 flex h-[25px] w-[25px] -translate-y-1/2 items-center justify-center rounded-full bg-gray-900"
            data-testid="avatar-next"
          >
            <Arrow className="rotate-180" />
          </button>
          <div
            style={{
              width: 120,
              height: 120,
              backgroundImage: `url(/avatars/${avatarId}.svg)`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover"
            }}
            data-testid="avatar"
            data-test-avatar-id={avatarId}
          />
          <button
            onClick={() =>
              setAvatarId((prev) => (prev == 1 ? AVAILABLE_AVATARS : prev - 1))
            }
            className="absolute -left-5 top-1/2 flex h-[25px] w-[25px] -translate-y-1/2 items-center justify-center rounded-full bg-gray-900"
            data-testid="avatar-prev"
          >
            <Arrow />
          </button>
        </div>
      </div>
      <NicknameInput value={nickname} onChange={setNickname} />
    </div>
  )
}

export default Entry
