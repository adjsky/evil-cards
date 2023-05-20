import React from "react"
import useAvailableSessionsSocket from "@/lib/hooks/use-available-sessions-socket"

const AvailableSessions: React.FC = () => {
  useAvailableSessionsSocket({
    onJsonMessage(data) {
      console.log(data)
    }
  })

  return null
}

export default AvailableSessions
