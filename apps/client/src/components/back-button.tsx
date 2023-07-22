import React from "react"

import ArrowLeft from "@/assets/arrows/left-filled.svg"

import Button from "./button"

const BackButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      className="py-3 px-4 text-base uppercase"
      data-testid="back-button"
      icon={<ArrowLeft />}
    >
      Назад
    </Button>
  )
}

export default BackButton
