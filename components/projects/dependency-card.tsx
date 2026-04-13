import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DependencyCardProps {
  title: string
  description: string
  icon: LucideIcon
  actionLabel: string
  actionLink: string
  variant?: "default" | "warning" | "success"
  className?: string
  readOnly?: boolean
  disabled?: boolean
  blockedReason?: string
}

export function DependencyCard({ title, description, icon: Icon, actionLabel, actionLink, variant = "default", className, readOnly = false, disabled = false, blockedReason }: DependencyCardProps) {
  const variantStyles = {
    default: "border-border bg-card",
    warning: "border-orange-200 bg-orange-50 dark:bg-orange-950/10 dark:border-orange-900",
    success: "border-green-200 bg-green-50 dark:bg-green-950/10 dark:border-green-900",
  }

  const iconStyles = {
    default: "text-primary",
    warning: "text-orange-600 dark:text-orange-400",
    success: "text-green-600 dark:text-green-400",
  }

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md relative", variantStyles[variant], className)}>
      {disabled && (
        <div className="absolute inset-0 bg-background/50 z-10 pointer-events-none" />
      )}
      <CardContent className={cn("px-4 py-2 flex items-center gap-3", disabled && "opacity-80")}>
        <div className={cn("p-1.5 rounded-md bg-background/50 backdrop-blur-sm shrink-0 relative z-20", disabled ? "text-muted-foreground grayscale" : iconStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-0.5 relative z-20">
          <h3 className="text-sm font-semibold leading-none tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {!readOnly && disabled && (
            <TooltipProvider>
              <div className="relative z-20">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" disabled variant={variant === "warning" ? "outline" : "default"} className={cn("shrink-0 h-7 px-2 text-xs", variant === "warning" && "border-orange-200 dark:border-orange-800")}>
                      {actionLabel}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{blockedReason ?? "Complete as dependências anteriores antes de acessar esta etapa."}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
        )}
        {!readOnly && !disabled && (
            <TooltipProvider>
              <div className="relative z-20">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant={variant === "warning" ? "outline" : "default"} className={cn("shrink-0 h-7 px-2 text-xs", variant === "warning" && "border-orange-200 hover:bg-orange-100 dark:border-orange-800 dark:hover:bg-orange-900/50")} asChild>
                      <Link href={actionLink}>{actionLabel}</Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Clique para {actionLabel.toLowerCase()}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
