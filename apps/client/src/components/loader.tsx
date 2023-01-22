import React from "react"

type LoaderProps = {
  width?: number
  height?: number
  color?: string
}

const Loader: React.FC<LoaderProps> = ({
  width = 20,
  height = 20,
  color = "#fff"
}) => (
  <svg
    className="animate-spin"
    style={{ width, height }}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      className="opacity-75"
      fill={color}
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
)

export default Loader
