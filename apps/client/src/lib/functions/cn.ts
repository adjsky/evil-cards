import clsx from "clsx"
import { twMerge } from "tailwind-merge"

import type { ClassValue } from "clsx"

function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}

export default cn
