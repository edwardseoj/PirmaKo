import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Combines clsx (class name builder) and tailwind-merge (deduplicates Tailwind classes)
// cn("px-4 py-2", condition && "bg-red-500") => properly merged class string
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
