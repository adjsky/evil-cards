import React from "react"
import useHasMounted from "../hooks/use-has-mounted"

const ClientOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mounted = useHasMounted()

  if (!mounted) {
    return null
  }

  return <>{children}</>
}

export default ClientOnly
