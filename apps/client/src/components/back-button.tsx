import React from "react"
import Button from "./button"
import ArrowLeft from "@/assets/arrow-left.svg"

const BackButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      className="py-3 px-4 sm:text-base"
      data-testid="back-button"
      icon={<ArrowLeft />}
    >
      НАЗАД
    </Button>
  )
}

export default BackButton
