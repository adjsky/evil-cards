import React, { createContext, useContext } from "react"
import { useRouter } from "next/router"

import { usePreviousN2 } from "../hooks"

const PreviousPathnameContext = createContext<string | undefined>(undefined)

export const PreviousPathnameProvider: React.FC<React.PropsWithChildren> = ({
  children
}) => {
  const router = useRouter()
  const previousPathnames = usePreviousN2(router.pathname)

  const previousPathname = previousPathnames.every(Boolean)
    ? previousPathnames[1]
    : undefined

  return (
    <PreviousPathnameContext.Provider value={previousPathname}>
      {children}
    </PreviousPathnameContext.Provider>
  )
}

export const usePreviousPathname = () => {
  const previousPathname = useContext(PreviousPathnameContext)

  return previousPathname
}
