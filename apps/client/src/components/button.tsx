import clsx from "clsx"
import React from "react"
import { twMerge } from "tailwind-merge"

type Variant = "filled" | "filledBorder" | "outlined" | "outlinedReverse"

type ButtonProps = {
  variant: Variant
  icon?: JSX.Element
} & React.ComponentProps<"button">

const variantClasses: Record<Variant, string> = {
  filled:
    "bg-red-500 text-gray-100 enabled:hover:bg-gray-100 enabled:hover:text-red-500",
  filledBorder:
    "border border-red-500 bg-red-500 text-gray-100 enabled:hover:bg-gray-100 enabled:hover:text-red-500",
  outlined:
    "border border-gray-100 bg-gray-900 text-gray-100 hover:bg-gray-100 hover:text-gray-900",
  outlinedReverse:
    "border border-gray-900 bg-gray-100 text-gray-900 hover:bg-gray-900 hover:text-gray-100"
}

const iconVariantClasses: Record<Variant, string> = {
  filled: "transition-colors group-hover:fill-gray-100",
  filledBorder: "transition-colors group-hover:fill-gray-100",
  outlined: "transition-colors group-hover:fill-gray-900",
  outlinedReverse: "transition-colors group-hover:fill-gray-100"
}

const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({
  icon,
  children,
  variant,
  className,
  ...props
}) => {
  return (
    <button
      className={twMerge(
        "flex items-center justify-center",
        "rounded-lg text-xl leading-none transition-colors sm:leading-none",
        variantClasses[variant],
        icon && "group gap-2",
        props.disabled && "opacity-80",
        className
      )}
      {...props}
    >
      {icon &&
        React.cloneElement(icon, {
          className: clsx(icon.props.className, iconVariantClasses[variant])
        })}
      {children}
    </button>
  )
}

export default Button
