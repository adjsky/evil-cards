import React from "react"
import ArrowLeft from "@/assets/arrow-left.svg"

const BackButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 rounded-lg border border-gray-100 py-3 px-4 transition-colors hover:bg-gray-100"
    >
      <ArrowLeft className="transition-colors group-hover:fill-gray-900" />
      <span className="text-base leading-none text-gray-100 transition-colors group-hover:text-gray-900">
        НАЗАД
      </span>
    </button>
  )
}

export default BackButton
