import nodemailer from "nodemailer"
import { EmailTemplateKey, EmailTemplateVars } from "../emails/types"
import { otpTemplate } from "../emails/templates/otp"
import { projectSubmittedTemplate } from "../emails/templates/project-submitted"
import { projectApprovedTemplate } from "../emails/templates/project-approved"
import { projectRejectedTemplate } from "../emails/templates/project-rejected"
import { projectReturnedTemplate } from "../emails/templates/project-returned"
import { prisma } from "@/lib/config/db"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT!),
  secure: false,
  auth:
    process.env.NODE_ENV !== "production"
      ? undefined
      : {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        },
})

const TEMPLATES = {
  OTP: otpTemplate,
  PROJECT_SUBMITTED: projectSubmittedTemplate,
  PROJECT_APPROVED: projectApprovedTemplate,
  PROJECT_REJECTED: projectRejectedTemplate,
  PROJECT_RETURNED: projectReturnedTemplate,
}

function replaceVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || "")
}

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? "no-reply@ufr.edu.br",
    to,
    subject,
    text,
    html,
  })
}

export async function sendByTemplate<K extends EmailTemplateKey>(key: K, vars: EmailTemplateVars[K], to: string) {
  const template = TEMPLATES[key]

  const logoUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/sie.svg` : "https://raw.githubusercontent.com/maikonb/sie/main/public/sie.svg"

  const globalVars = {
    logoUrl,
    year: new Date().getFullYear().toString(),
  }

  const allVars = { ...globalVars, ...vars } as Record<string, string>

  const html = replaceVariables(template.html, allVars)
  const subject = replaceVariables(template.subject, allVars)

  // Simple text fallback (strips HTML tags)
  const text = html.replace(/<[^>]*>/g, "")

  await sendEmail({
    to,
    subject,
    text,
    html,
  })
}

export async function sendOtpEmail(to: string, code: string) {
  if (process.env.NODE_ENV !== "production") {
    await sendEmail({
      to,
      subject: `Seu código de acesso: ${code}`,
      text: `Seu código é: ${code}`,
      html: `<p>Seu código é: <b>${code}</b></p>`,
    })
  } else {
    await sendByTemplate("OTP", { code }, to)
  }
}

// Helpers: Notifications for project workflow
export async function getEmailsByPermissionSlug(slug: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            rolePermissions: {
              some: {
                permission: { slug },
              },
            },
          },
        },
      },
    },
    select: { email: true },
  })
  return users.map((u) => u.email!).filter(Boolean)
}

export async function notifyUserOfApproval(project: { title: string; slug: string; user: { email?: string | null } }, approver: { name?: string | null }) {
  const to = project.user.email
  if (!to) return
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000"
  const projectUrl = `${baseUrl}/projetos/${project.slug}`
  await sendByTemplate("PROJECT_APPROVED", { projectTitle: project.title, approverName: approver.name ?? "Administrador", projectUrl }, to)
}
