import React from "react"
import { Transition } from "@headlessui/react"
import clsx from "clsx"

const FadeIn: React.FC<
  React.PropsWithChildren<{
    className?: string
    enter?: string
  }>
> = ({ enter, className, children }) => {
  return (
    // here we have to apply opacity-0 in className due to some strange bug
    // should've been fixed in https://github.com/tailwindlabs/headlessui/issues/2012
    // some cases were fixed but when switching to waiting screen the bug still appears
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
