import { User, type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/config/db"
import { compare } from "bcryptjs"
import { APP_ERRORS } from "@/lib/errors"
import { getSystemDefaultId } from "../services/defaults"
import { PROFILE_COLORS } from "@/lib/constrants/profile-colors"

const ALLOWED_DOMAINS =
  process.env.ALLOWED_EMAIL_DOMAINS?.toLowerCase()
    .split(",")
    .map((d) => d.trim()) ?? []

const JWT_MAX_AGE = 24 * 60 * 60

function isUfr(email?: string | null) {
  if (!email) return false

  const domain = email.substring(email.indexOf("@") + 1).toLowerCase()

  if (ALLOWED_DOMAINS.length > 0) {
    return ALLOWED_DOMAINS.includes(domain)
  }

  return domain === "ufr.edu.br"
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: JWT_MAX_AGE,
  },

  jwt: {
    maxAge: JWT_MAX_AGE,
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Login por CÓDIGO (OTP) via Credentials: { email, code }
    Credentials({
      name: "Email + Código",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Código", type: "text" },
      },
      authorize: async (creds) => {
        const email = creds?.email?.toLowerCase().trim()
        const code = creds?.code?.trim()

        if (!email || !code || !isUfr(email)) {
          throw new Error(APP_ERRORS.AUTH_INVALID_DOMAIN.code)
        }

        // busca OTP válido
        const otp = await prisma.otpCode.findFirst({
          where: {
            email,
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { sentAt: "desc" }, // pega o último
        })

        if (!otp) {
          throw new Error(APP_ERRORS.AUTH_INVALID_CODE.code)
        }

        const ok = await compare(code, otp.codeHash)
        if (!ok) {
          // opcional: incrementa tentativas
          await prisma.otpCode.update({
            where: { id: otp.id },
            data: { attempts: { increment: 1 } },
          })
          throw new Error(APP_ERRORS.AUTH_INCORRECT_CODE.code)
        }

        // marca como usado
        await prisma.otpCode.update({
          where: { id: otp.id },
          data: { usedAt: new Date() },
        })

        // encontra ou cria o usuário
        let user = await prisma.user.findUnique({
          where: { email },
          include: { imageFile: true },
        })
        if (!user) {
          // Generate random color from central PROFILE_COLORS
          const colorValues = PROFILE_COLORS.map((c) => c.value)
          const randomColor = colorValues[Math.floor(Math.random() * colorValues.length)]

          // Cria o usuário com a role default
          user = await prisma.user.create({
            data: {
              email,
              emailVerified: new Date(),
              firstAccess: true,
              color: randomColor,
              userRoles: {
                create: {
                  role: {
                    connect: { id: await getSystemDefaultId("user_role") },
                  },
                },
              },
            },
            include: { imageFile: true },
          })
        } else {
          // Se já existe, atualiza emailVerified se ainda não estiver
          if (!user.emailVerified) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { emailVerified: new Date() },
              include: { imageFile: true },
            })
          }
        }

        let imageUrl: string | null | undefined = null
        if (user.imageFile) {
          imageUrl = user.imageFile.url
        }

        return {
          id: user.id,
          name: user.name || undefined,
          email: user.email,
          image: imageUrl,
          firstAccess: user.firstAccess,
          color: user.color || undefined,
        } as User
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile, user }) {
      console.log("signin", "account: ", account, "profile: ", profile, "user: ", user)

      const email = profile?.email ?? user?.email

      if (!email) return false

      if (!isUfr(email)) return false

      return true
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.uid = user.id
        token.firstAccess = user.firstAccess
        token.color = user.color
        token.name = user.name
        token.image = user.image
      }

      if (trigger === "update" && token.uid) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.uid },
          include: { imageFile: true },
        })
        if (freshUser) {
          token.firstAccess = freshUser.firstAccess
          token.color = freshUser.color || undefined
          token.name = freshUser.name || undefined

          let imageUrl: string | null | undefined = null
          if (freshUser.imageFile) {
            imageUrl = freshUser.imageFile.url
          }
          token.image = imageUrl || undefined
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token.uid) {
        const user = await prisma.user.findUnique({
          where: { id: token.uid },
          select: { id: true, name: true, email: true, imageFile: { select: { url: true } }, color: true, firstAccess: true },
        })

        if (!user) {
          // User deleted from DB but token is valid -> Invalidate session user
          session.user = undefined as any
          return session
        }

        if (session.user) {
          session.user.id = user.id
          session.user.firstAccess = user.firstAccess
          session.user.color = user.color || undefined
          session.user.name = user.name || undefined
          session.user.image = user.imageFile?.url || undefined
        }
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(`${baseUrl}/conta/primeiro-acesso`)) return url
      return `${baseUrl}/projetos/`
    },
  },

  pages: {
    // signIn: "/entrar",
    // verifyRequest: "/verificar-email",
    // error: "/erro-auth",
    newUser: "/conta/primeiro-acesso",
    signIn: "/auth/login",
  },
}
