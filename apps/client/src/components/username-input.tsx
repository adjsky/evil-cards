import React from "react"
import useToggle from "../hooks/use-toggle"
import { Pencil } from "./icons"

const UsernameInput: React.FC<{
  value?: string
  onChange?: (value: string) => void
}> = ({ value, onChange }) => {
  const [toggled, toggle] = useToggle()

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = ({
    target: { value }
  }) => {
    if (value.length > 12) {
      return
    }

    onChange && onChange(value)
  }

  if (toggled) {
    return (
      <div className="w-full px-3">
        <input
          autoFocus
          value={value}
          onChange={handleChange}
          onBlur={toggle}
          onKeyDown={(event) => event.code == "Enter" && toggle()}
          className="flex w-full rounded-lg border-2 border-gray-900 bg-transparent py-1 text-center text-lg font-medium text-gray-900 focus:outline-none"
        />
      </div>
    )
  }

  return (
    <button className="flex h-10 items-center px-1" onClick={toggle}>
      <span className="flex items-baseline gap-2">
        <span className="text-center text-lg font-medium text-gray-900">
          {value}
        </span>
        <Pencil />
      </span>
    </button>
  )
}

export default UsernameInput
