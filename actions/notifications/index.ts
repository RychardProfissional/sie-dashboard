"use server"

import { prisma } from "@/lib/config/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/config/auth"
import { revalidatePath } from "next/cache"

export async function getNotifications({ page = 1, pageSize }: { page: number, pageSize: number }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    skip: page * pageSize,
    take: pageSize,
  })
}

export async function getUnreadCount() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return 0

  return prisma.notification.count({
    where: {
      userId: session.user.id,
      read: false,
    },
  })
}

export async function markAsRead(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.notification.update({
    where: { id, userId: session.user.id },
    data: { read: true },
  })

  revalidatePath("/conta/notificacoes")
}

export async function markAllAsRead() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  revalidatePath("/conta/notificacoes")
}

export async function deleteNotification(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.notification.delete({
    where: { id, userId: session.user.id },
  })

  revalidatePath("/conta/notificacoes")
}
