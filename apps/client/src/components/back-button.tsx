import React from "react"

import { ReactComponent as ArrowLeft } from "@/assets/arrows/left-filled.svg"

import Button from "./button"

const BackButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      className="text-base uppercase"
      data-testid="back-button"
      icon={<ArrowLeft />}
    >
      Назад
    </Button>
  )
}

export default BackButton
