import { useReducer } from "react"

const useToggle = (initialValue = false) =>
  useReducer((toggled) => !toggled, initialValue)

export default useToggle
