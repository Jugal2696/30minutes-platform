"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const DialogContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null)

export const Dialog = ({ children, open, onOpenChange }: any) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const isControlled = open !== undefined
  const finalOpen = isControlled ? open : isOpen
  const finalSetOpen = isControlled ? onOpenChange : setIsOpen

  return (
    <DialogContext.Provider value={{ open: finalOpen, setOpen: finalSetOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

export const DialogTrigger = ({ children, asChild }: any) => {
  const context = React.useContext(DialogContext)
  if (!context) return null
  return React.cloneElement(children, { onClick: () => context.setOpen(true) })
}

export const DialogContent = ({ children, className }: any) => {
  const context = React.useContext(DialogContext)
  if (!context || !context.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className={cn("relative z-50 w-full max-w-lg gap-4 border bg-white p-6 shadow-lg sm:rounded-lg md:w-full", className)}>
        {children}
        <button className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100" onClick={() => context.setOpen(false)}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  )
}

export const DialogHeader = ({ className, ...props }: any) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
export const DialogFooter = ({ className, ...props }: any) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
export const DialogTitle = ({ className, ...props }: any) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
)
export const DialogDescription = ({ className, ...props }: any) => (
  <p className={cn("text-sm text-slate-500", className)} {...props} />
)