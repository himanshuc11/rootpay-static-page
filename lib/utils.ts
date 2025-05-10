import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"
import { addYears, isBefore, isAfter } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Luhn algorithm for card validation
export function validateCardWithLuhn(cardNumber: string): boolean {
  const sanitizedNumber = cardNumber.replace(/\s/g, "")
  if (!/^\d+$/.test(sanitizedNumber)) return false

  let sum = 0
  let shouldDouble = false

  // Loop through values starting from the rightmost digit
  for (let i = sanitizedNumber.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(sanitizedNumber.charAt(i))

    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

// Card validation schema
export const cardSchema = z.object({
  cardNumber: z
    .string()
    .min(19, "Card number must be 16 digits")
    .refine((val) => validateCardWithLuhn(val), {
      message: "Invalid card number",
    }),
  expiryDate: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, "Expiry date must be in MM/YY format")
    .refine(
      (val) => {
        try {
          const [month, year] = val.split("/")
          const monthNum = Number.parseInt(month, 10)

          // Check if month is valid (1-12)
          if (monthNum < 1 || monthNum > 12) return false

          const fullYear = 2000 + Number.parseInt(year, 10)
          const expiryDate = new Date(fullYear, monthNum - 1, 1)
          const today = new Date()
          today.setDate(1)
          today.setHours(0, 0, 0, 0)

          const eightYearsFromNow = addYears(new Date(), 8)

          return !isBefore(expiryDate, today) && !isAfter(expiryDate, eightYearsFromNow)
        } catch (e) {
          console.log(e)
          return false
        }
      },
      {
        message: "Expiry date must be between now and 8 years from now",
      },
    ),
})

export type CardFormErrors = {
  cardNumber?: string
  expiryDate?: string
}
