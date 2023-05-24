import React from "react"
import Button from "./button"
import ArrowLeft from "@/assets/arrows/left-filled.svg"

const BackButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      className="py-3 px-4 uppercase sm:text-base"
      data-testid="back-button"
      icon={<ArrowLeft />}
    >
      Назад
    </Button>
  )
}

export default BackButton
