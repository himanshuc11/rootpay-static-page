"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { z } from "zod"
import { useDebouncedCallback } from "use-debounce"
import { addYears, isBefore, isAfter } from "date-fns"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CreditCard, Calendar } from "lucide-react"
import { Mode } from "@/types"
import { MOCK_RESPONSES } from "@/constants"
import { createMockResponse } from "@/utils/mock-respone"
import { publishEvent } from "@/utils/publish-events"

// Luhn algorithm for card validation
function validateCardWithLuhn(cardNumber: string): boolean {
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

// Format card number with spaces
function formatCardNumber(value: string): string {
  const sanitized = value.replace(/\D/g, "")
  const groups = []

  for (let i = 0; i < sanitized.length; i += 4) {
    groups.push(sanitized.slice(i, i + 4))
  }

  return groups.join(" ")
}

// Format expiry date with slash
function formatExpiryDate(value: string): string {
  const sanitized = value.replace(/\D/g, "")

  if (sanitized.length <= 2) {
    return sanitized
  }

  return `${sanitized.slice(0, 2)}/${sanitized.slice(2, 4)}`
}

// Validation schema using Zod
const cardSchema = z.object({
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
          console.error(e)
          return false
        }
      },
      {
        message: "Expiry date must be between now and 8 years from now",
      },
    ),
})

type FormErrors = {
  cardNumber?: string
  expiryDate?: string
}

type Props = {
  mode: Mode;
  origin: string;
}

export function DebitCardCheckout({ mode, origin }: Props) {
  const [cardNumber, setCardNumber] = useState("5555 5555 5555 4444")
  const [expiryDate, setExpiryDate] = useState("12/28")
  const [errors, setErrors] = useState<FormErrors>({})
  const [isValid, setIsValid] = useState(false)

  // Debounced validation function
  const validateForm = useDebouncedCallback(() => {
    const result = cardSchema.safeParse({
      cardNumber,
      expiryDate,
    })

    if (!result.success) {
      const formattedErrors: FormErrors = {}
      result.error.errors.forEach((error) => {
        const path = error.path[0] as keyof FormErrors
        formattedErrors[path] = error.message
      })
      setErrors(formattedErrors)
      setIsValid(false)
    } else {
      setErrors({})
      setIsValid(true)
    }
  }, 300)

  useEffect(() => {
    if (cardNumber || expiryDate) {
      validateForm()
    }
  }, [cardNumber, expiryDate, validateForm])

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 16) {
      setCardNumber(formatCardNumber(value))
    }
  }

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d/]/g, "")
    const sanitized = value.replace(/\//g, "")

    if (sanitized.length <= 4) {
      setExpiryDate(formatExpiryDate(sanitized))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Get the button that was clicked
    const button = document.activeElement as HTMLButtonElement
    const buttonValue = button?.value as keyof typeof MOCK_RESPONSES 

    if(!isValid) {
      validateForm.flush() // Force immediate validation
      publishEvent({status: MOCK_RESPONSES.FAILURE, message: `${errors.cardNumber} error and ${errors.expiryDate}` }, origin)
      return
    }

    // Actual submit the data
    if(buttonValue === MOCK_RESPONSES.PRODUCTION) {
      // Process payment with button value
      console.log("Payment processed with:", { cardNumber, expiryDate, buttonValue })
      alert("Payment successful!")
      return;
    }
    
    // Mock submission
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(MOCK_RESPONSES.TIMEOUT), 5000)
      );
      const data = createMockResponse(buttonValue);
      const response = await Promise.race([data, timeoutPromise]) as string;

      publishEvent({status: MOCK_RESPONSES.SUCCESS, message: response }, origin)
    } catch (err) {
      const errorMsg = err as string
      publishEvent({status: MOCK_RESPONSES.FAILURE, message: errorMsg }, origin)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>Card Number</span>
            </Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              aria-describedby="cardNumberError"
              aria-invalid={!!errors.cardNumber}
              className={errors.cardNumber ? "border-red-500" : ""}
            />
            {errors.cardNumber && (
              <p id="cardNumberError" className="text-sm text-red-500" aria-live="polite">
                {errors.cardNumber}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Expiry Date (MM/YY)</span>
            </Label>
            <Input
              id="expiryDate"
              value={expiryDate}
              onChange={handleExpiryDateChange}
              placeholder="MM/YY"
              aria-describedby="expiryDateError"
              aria-invalid={!!errors.expiryDate}
              className={errors.expiryDate ? "border-red-500" : ""}
            />
            {errors.expiryDate && (
              <p id="expiryDateError" className="text-sm text-red-500" aria-live="polite">
                {errors.expiryDate}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="mt-4 w-full gap-y-2">
            {mode === "production" && (
              <Button type="submit" className="w-full" disabled={!isValid} value={MOCK_RESPONSES.PRODUCTION}>
                Pay Now
              </Button>
            )}

            {mode === "dev" && (
              <div className="gap-y-2">
                <Button type="submit" className="w-full bg-green-500 mt-2" disabled={!isValid} value={MOCK_RESPONSES.SUCCESS}>
                  Success
                </Button>
                <Button type="submit" className="w-full bg-red-500 mt-2" disabled={!isValid} value={MOCK_RESPONSES.FAILURE}>
                  Failure
                </Button>
                <Button type="submit" className="w-full bg-orange-500 mt-2" disabled={!isValid} value={MOCK_RESPONSES.TIMEOUT}>
                  Timeout
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
