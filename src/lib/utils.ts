import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Replace all non-alphanumeric and non-hyphen characters with hyphens
    .replace(/-+/g, '-') // Replace multiple consecutive hyphens with a single hyphen
    .replace(/^(-+)|(-+)$/g, ''); // Remove leading and trailing hyphens
}