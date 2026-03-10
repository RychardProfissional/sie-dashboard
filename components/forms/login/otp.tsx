"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notifications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

import { getSession } from "next-auth/react"
import { APP_ERRORS } from "@/lib/errors"
import { requestOtp } from "@/actions/user"
import { checkPermission } from "@/actions/permissions"

export function OTPForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [code, setCode] = useState("")
  const [timeLeft, setTimeLeft] = useState(25)

  const params = useSearchParams()
  const router = useRouter()

  const email = params.get("email") ?? ""

  useEffect(() => {
    if (timeLeft <= 0) return

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [timeLeft])

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) return notify.error(APP_ERRORS.AUTH_EMAIL_REQUIRED.code)

    const res = await signIn("credentials", {
      email,
      code,
      redirect: false,
    })

    if (res?.error) {
      console.error(res.error)

      if (res.error === "CredentialsSignin") {
        notify.error(APP_ERRORS.AUTH_INCORRECT_CODE.code)
      } else {
        notify.error(res.error)
      }
      return
    }

    const session = await getSession()
    if (session?.user?.firstAccess) {
      router.push("/conta/primeiro-acesso")
    } else if (session?.user) {
      const { can } = await checkPermission('projects.approve')
      router.push(can ? "/admin/projetos" : "/projetos")
    }
  }

  const handleResend = async () => {
    if (!email || timeLeft > 0) return

    try {
      const res = await requestOtp(email)
      if (!res.success) throw new Error(res.error)
      notify.success("Código reenviado com sucesso!")
      setTimeLeft(25)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      notify.error(message || APP_ERRORS.AUTH_SEND_FAILED.code)
    }
  }

  return (
    <Card {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Entre com o código de verificação</CardTitle>
        <CardDescription>
          Enviamos um código para <b>{email || "seu e-mail"}</b>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="otp" className="sr-only">
                Código de Verificação
              </FieldLabel>
              <InputOTP maxLength={6} id="otp" required value={code} onChange={setCode}>
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <FieldDescription className="text-center">Digite o número recebido em seu e-mail.</FieldDescription>
            </Field>
            <Button type="submit">Verificar</Button>
            <FieldDescription className="text-center">
              Não recebeu?{" "}
              <button type="button" onClick={handleResend} className="underline disabled:opacity-50 disabled:cursor-not-allowed" disabled={timeLeft > 0}>
                {timeLeft > 0 ? `Reenviar em ${timeLeft}s` : "Reenviar"}
              </button>
            </FieldDescription>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
