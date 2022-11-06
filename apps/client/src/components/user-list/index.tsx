import React from "react"
import DesktopUserList from "./desktop"
import MobileUserList from "./mobile"

import type { User } from "@evil-cards/server/src/lib/ws/send"

const UserList: React.FC<{ users: User[]; variant: "game" | "waiting" }> = ({
  users,
  variant
}) => {
  return (
    <>
      <DesktopUserList users={users} variant={variant} />
      <MobileUserList users={users} variant={variant} />
    </>
  )
}

export default UserList
