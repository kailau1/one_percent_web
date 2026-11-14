import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, Ref } from 'react'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-action text-on-action hover:bg-action-hover',
        secondary: 'border border-line bg-surface text-ink hover:bg-sunken',
        ghost: 'text-ink-muted hover:bg-sunken hover:text-ink',
        danger: 'bg-danger text-surface hover:opacity-90',
        link: 'text-action underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-[0.9375rem]',
        lg: 'h-12 px-6 text-base',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render the child element (e.g. a router Link) with button styling instead of a <button>. */
  asChild?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({ className, variant, size, asChild, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      // a bare <button> inside a form submits it; make that opt-in
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  )
}
