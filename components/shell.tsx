"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal, ArrowLeft } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface PageBackProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function PageBack({ href, children, className }: PageBackProps) {
  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground mb-4", className)}>
      <Button variant="ghost" size="sm" asChild className="-ml-3 h-8 px-2">
        <Link href={href}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {children}
        </Link>
      </Button>
    </div>
  )
}

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PageShell({ children, className, ...props }: PageShellProps) {
  return (
    <div className={cn("flex-1 space-y-8 p-8 pt-6", className)} {...props}>
      {children}
    </div>
  )
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "col"
}

export function PageHeader({ children, direction, className, ...props }: PageHeaderProps) {
  let flexDirection = direction === "col" ? "flex-col justify-between items-start" : "flex-row justify-between items-center"
  return (
    <div
      data-solid="false"
      className={cn(
        "page-header md:sticky md:top-14 md:z-20 -mx-8 px-8 py-4 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 flex space-y-2 transition-all",
        // When merged, we remove the background and blur on desktop to avoid "double blur"
        "data-[solid=true]:md:bg-transparent data-[solid=true]:md:backdrop-blur-none data-[solid=true]:md:border-b-transparent",
        className,
        flexDirection,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface PageSecondaryHeaderPropos extends React.HTMLAttributes<HTMLDivElement> {}

export function PageSecondaryHeader({ children, className, ...props }: PageSecondaryHeaderPropos) {
  const [headerHeight, setHeaderHeight] = useState(0)
  const [isStuck, setIsStuck] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const header = document.querySelector(".page-header") as HTMLElement
    if (!header) return

    header.dataset.solid = "true"

    // Set initial height
    setHeaderHeight(header.getBoundingClientRect().height - 6)

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeaderHeight(entry.target.getBoundingClientRect().height - 6)
      }
    })

    resizeObserver.observe(header)

    // Sticky detection
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(entry.intersectionRatio < 1)
      },
      {
        threshold: [1],
        rootMargin: `-${56 + (window.innerWidth >= 768 ? headerHeight + 8 : 0) + 1}px 0px 0px 0px`,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      header.dataset.solid = "false"
      resizeObserver.disconnect()
      observer.disconnect()
    }
  }, [headerHeight])

  useEffect(() => {
    const header = document.querySelector(".page-header") as HTMLElement
    if (!header) return

    if (isStuck) {
      header.style.borderBottomColor = "transparent"
    } else {
      header.style.borderBottomColor = "var(--border)"
    }
  }, [isStuck])

  return (
    <div ref={ref} className={cn("sticky top-14 -mx-8 px-8 pt-3 md:pt-0 pb-3 border-b bg-transparent transition-colors md:top-[calc(3.5rem+var(--header-height,0px))] z-10", !isStuck ? "border-b-transparent" : "border-b-border", className)} style={{ "--header-height": `${headerHeight}px` } as React.CSSProperties} {...props}>
      <div aria-hidden className="absolute md:inset-x-0 inset-0 -z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 top-0 h-full md:block md:top-[calc(-1*var(--header-height,0px))] md:h-[calc(100%+var(--header-height,0px))]" />

      {/* Conteúdo */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

interface PageHeaderHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function PageHeaderHeading({ children, className, ...props }: PageHeaderHeadingProps) {
  return (
    <h2 className={cn("text-3xl font-bold tracking-tight", className)} {...props}>
      {children}
    </h2>
  )
}

interface PageHeaderDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function PageHeaderDescription({ children, className, ...props }: PageHeaderDescriptionProps) {
  return (
    <p className={cn("text-muted-foreground", className)} {...props}>
      {children}
    </p>
  )
}

interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PageContent({ children, className, ...props }: PageContentProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  )
}

interface PagePaginationProps {
  currentPage: number
  pageCount: number
  totalCount: number
  searchParams: Record<string, string | string[] | undefined>
  itemLabel?: string
  itemLabelPlural?: string
  pageParamName?: string
}

export function PagePagination({ currentPage, pageCount, totalCount, searchParams, itemLabel = "item", itemLabelPlural, pageParamName = "page" }: PagePaginationProps) {
  const labelPlural = itemLabelPlural || `${itemLabel}s`

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || key === pageParamName) continue
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
      else params.set(key, value)
    }
    params.set(pageParamName, pageNumber.toString())
    return `?${params.toString()}`
  }

  if (pageCount <= 1) return null

  // Numerical pagination logic
  const pages = []
  const maxVisible = 3

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let endPage = Math.min(pageCount, startPage + maxVisible - 1)

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground order-2 sm:order-1">
        Mostrando <span className="font-medium text-foreground">{currentPage}</span> de <span className="font-medium text-foreground">{pageCount}</span> páginas (<span className="font-medium text-foreground">{totalCount}</span> {totalCount === 1 ? itemLabel : labelPlural})
      </p>

      <nav className="flex items-center gap-1.5 order-1 sm:order-2" aria-label="Paginação">
        {/* Ir para Primeira */}
        <Button variant="outline" size="icon" className="h-8 w-8 hidden sm:flex" asChild disabled={currentPage <= 1}>
          {currentPage > 1 ? (
            <Link href={createPageUrl(1)}>
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">Primeira página</span>
            </Link>
          ) : (
            <span>
              <ChevronsLeft className="h-4 w-4" />
            </span>
          )}
        </Button>

        {/* Anterior */}
        <Button variant="outline" size="icon" className="h-8 w-8" asChild disabled={currentPage <= 1}>
          {currentPage > 1 ? (
            <Link href={createPageUrl(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Página anterior</span>
            </Link>
          ) : (
            <span>
              <ChevronLeft className="h-4 w-4" />
            </span>
          )}
        </Button>

        {/* Números */}
        {startPage > 1 && (
          <>
            <Button variant="outline" size="icon" className="h-8 w-8 hidden sm:flex" asChild>
              <Link href={createPageUrl(1)}>1</Link>
            </Button>
            {startPage > 2 && <MoreHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />}
          </>
        )}

        {pages.map((p) => (
          <Button key={p} variant={p === currentPage ? "default" : "outline"} size="icon" className={cn("h-8 w-8 text-sm", p === currentPage && "pointer-events-none shadow-sm")} asChild>
            {p === currentPage ? <span>{p}</span> : <Link href={createPageUrl(p)}>{p}</Link>}
          </Button>
        ))}

        {endPage < pageCount && (
          <>
            {endPage < pageCount - 1 && <MoreHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />}
            <Button variant="outline" size="icon" className="h-8 w-8 hidden sm:flex" asChild>
              <Link href={createPageUrl(pageCount)}>{pageCount}</Link>
            </Button>
          </>
        )}

        {/* Próxima */}
        <Button variant="outline" size="icon" className="h-8 w-8" asChild disabled={currentPage >= pageCount}>
          {currentPage < pageCount ? (
            <Link href={createPageUrl(currentPage + 1)}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Próxima página</span>
            </Link>
          ) : (
            <span>
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </Button>

        {/* Ir para Última */}
        <Button variant="outline" size="icon" className="h-8 w-8 hidden sm:flex" asChild disabled={currentPage >= pageCount}>
          {currentPage < pageCount ? (
            <Link href={createPageUrl(pageCount)}>
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Última página</span>
            </Link>
          ) : (
            <span>
              <ChevronsRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </nav>
    </div>
  )
}
interface PageFiltersProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function PageFilters({ open, onOpenChange, trigger, title, description, children, footer }: PageFiltersProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col h-full p-0 md:w-[400px]">
        <SheetHeader className="p-6 border-b text-left">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-8">{children}</div>
        {footer && <SheetFooter className="mt-auto border-t p-6 bg-muted/20">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}

interface PageFilterGroupProps {
  label: string
  children: React.ReactNode
  className?: string
}

export function PageFilterGroup({ label, children, className }: PageFilterGroupProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-left block">{label}</Label>
      {children}
    </div>
  )
}

interface PageFilterRowProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function PageFilterRow({ label, checked, onCheckedChange, className }: PageFilterRowProps) {
  return (
    <label className={cn("flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded-md transition-colors", className)}>
      <input type="checkbox" className="h-4 w-4 rounded border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} />
      <span className="text-foreground select-none">{label}</span>
    </label>
  )
}
