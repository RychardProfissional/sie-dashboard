"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Bell, Check, Trash2, ExternalLink, Archive, CheckCircle2, AlertCircle, Info, XCircle, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { markAsRead, markAllAsRead, deleteNotification, getNotifications } from "@/actions/notifications"
import Link from "next/link"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isToday, isYesterday, isThisWeek, subDays } from "date-fns"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  url: string | null
  read: boolean
  createdAt: Date
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const router = useRouter()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await getNotifications()
      setNotifications(data as any)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (error) {
      toast.error("Erro ao marcar como lida")
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast.success("Todas as notificações marcadas como lidas")
    } catch (error) {
      toast.error("Erro ao marcar todas como lidas")
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      toast.success("Notificação removida")
    } catch (error) {
      toast.error("Erro ao remover notificação")
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id)
    }
    if (notification.url) {
      router.push(notification.url)
    }
  }

  const getNotificationStyles = (n: Notification) => {
    const { title, type } = n
    if (type !== "PROJECT_STATUS") return { icon: Info, classes: "text-blue-500 bg-blue-50 border-blue-100" }

    if (title.toLowerCase().includes("aprovado")) {
      return { icon: CheckCircle2, classes: "text-green-600 bg-green-50 border-green-100" }
    }
    if (title.toLowerCase().includes("rejeitado")) {
      return { icon: XCircle, classes: "text-red-600 bg-red-50 border-red-100" }
    }
    if (title.toLowerCase().includes("ajustes")) {
      return { icon: AlertCircle, classes: "text-amber-600 bg-amber-50 border-amber-100" }
    }

    return { icon: CheckCircle2, classes: "text-primary bg-primary/5 border-primary/10" }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read
    return true
  })

  const groupNotifications = (notifs: Notification[]) => {
    const groups: { title: string; items: Notification[] }[] = []

    const today = notifs.filter((n) => isToday(new Date(n.createdAt)))
    const yesterday = notifs.filter((n) => isYesterday(new Date(n.createdAt)))
    const thisWeek = notifs.filter((n) => isThisWeek(new Date(n.createdAt)) && !isToday(new Date(n.createdAt)) && !isYesterday(new Date(n.createdAt)))
    const older = notifs.filter((n) => !isThisWeek(new Date(n.createdAt)))

    if (today.length > 0) groups.push({ title: "Hoje", items: today })
    if (yesterday.length > 0) groups.push({ title: "Ontem", items: yesterday })
    if (thisWeek.length > 0) groups.push({ title: "Esta semana", items: thisWeek })
    if (older.length > 0) groups.push({ title: "Mais antigas", items: older })

    return groups
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse bg-muted/30 h-28 border-none" />
        ))}
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const notificationGroups = groupNotifications(filteredNotifications)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2 sm:w-[300px]">
            <TabsTrigger value="all" className="text-xs font-semibold">
              Todas {notifications.length > 0 && `(${notifications.length})`}
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs font-semibold relative">
              Não lidas
              {unreadCount > 0 && <Badge className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] bg-red-500 hover:bg-red-600 border-2 border-background">{unreadCount}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs h-9 hover:bg-primary/5 hover:text-primary transition-colors">
            <Check className="h-4 w-4 mr-2" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      {filteredNotifications.length === 0 ? (
        <Card className="border-dashed bg-muted/10 border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-background rounded-full p-6 shadow-sm mb-4 border border-muted/20">
              <Bell className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{filter === "unread" ? "Nenhuma notificação não lida" : "Nenhuma notificação"}</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-1">{filter === "unread" ? "Parabéns! Você leu tudo o que era importante." : "As notificações dos seus projetos aparecerão aqui conforme o status mudar."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {notificationGroups.map((group) => (
            <div key={group.title} className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 shrink-0">{group.title}</h3>
                <div className="h-px w-full bg-linear-to-r from-muted/50 to-transparent" />
              </div>

              <div className="grid gap-3">
                {group.items.map((n) => {
                  const styles = getNotificationStyles(n)
                  const Icon = styles.icon

                  return (
                    <Card key={n.id} onClick={() => handleNotificationClick(n)} className={cn("group cursor-pointer relative transition-all duration-300 border border-transparent shadow-sm hover:shadow-md hover:border-muted-foreground/10 overflow-hidden", !n.read ? "bg-primary/2 ring-1 ring-primary/5" : "bg-card")}>
                      {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary z-10" />}

                      <CardContent className="p-0">
                        <div className="flex items-stretch min-h-[100px]">
                          {/* Status Icon Area */}
                          <div className={cn("hidden sm:flex items-center justify-center px-4 border-r transition-colors shrink-0 bg-muted/5 border-transparent")}>
                            <div className={cn("p-2 rounded-xl border shadow-xs transition-transform group-hover:scale-110", styles.classes)}>
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>

                          {/* Content Area */}
                          <div className="flex-1 p-4 sm:p-5 flex flex-col min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <h4 className={cn("text-sm font-bold truncate transition-colors", !n.read ? "text-foreground group-hover:text-primary" : "text-muted-foreground group-hover:text-foreground")}>{n.title}</h4>
                                {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider tabular-nums shrink-0">{format(new Date(n.createdAt), "dd MMM, HH:mm", { locale: ptBR })}</span>
                            </div>

                            <p className={cn("text-sm leading-relaxed line-clamp-2 transition-colors", !n.read ? "text-muted-foreground" : "text-muted-foreground/60 group-hover:text-muted-foreground/80")}>{n.message}</p>

                            <div className="flex items-center justify-between mt-auto pt-4">
                              <div className="flex items-center gap-2">
                                {n.url && (
                                  <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-primary/70 group-hover:text-primary transition-colors">
                                    VER DETALHES <ExternalLink className="h-3 w-3 ml-2" />
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, n.id)} className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors" title="Excluir">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
