import { useAtom } from "jotai"
import React from "react"

import { soundsAtom } from "@/lib/atoms/game"

import { ReactComponent as SoundOff } from "@/assets/sound-off.svg"
import { ReactComponent as SoundOn } from "@/assets/sound-on.svg"

type SoundsButtonProps = {
  width?: number
  height?: number
  className?: string
}

const SoundsButton: React.FC<SoundsButtonProps> = ({
  height = 48,
  width = 48,
  className
}) => {
  const [sounds, setSounds] = useAtom(soundsAtom)

  return (
    <button
      className={className}
      onClick={() => setSounds(!sounds)}
      data-testid={sounds ? "disable-sounds" : "enable-sounds"}
    >
      {sounds ? (
        <SoundOn width={width} height={height} />
      ) : (
        <SoundOff width={width} height={height} />
      )}
    </button>
  )
}

export default SoundsButton
