import React, { useEffect, useState } from "react"
import { Transition } from "@headlessui/react"
import clsx from "clsx"

const FadeIn: React.FC<
  React.PropsWithChildren<{
    className?: string
    enter?: string
    effect?: boolean
    animate?: boolean
  }>
> = ({ enter, className, effect, animate, children }) => {
  const [show, setShow] = useState(!animate)
  useEffect(() => {
    if (!effect || !animate) {
      return
    }

    setShow(true)
  }, [effect, animate])

  if (effect) {
    return (
      <Transition
        className={className}
        enter={clsx(enter, "transition-opacity duration-300")}
        enterFrom="opacity-0"
        enterTo="opacity-100"
        show={show}
      >
        {children}
      </Transition>
    )
  }

  return (
    <Transition
      className={clsx(className, "opacity-0")}
      enter={clsx(enter, "transition-opacity duration-300")}
      enterTo="!opacity-100"
      show
      appear
    >
      {children}
    </Transition>
  )
}

export default FadeIn
