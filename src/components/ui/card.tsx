import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

const cardVariants = cva(
  'rounded-lg border bg-white text-gray-950 shadow transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50',
  {
    variants: {
      variant: {
        default: 'border-gray-200',
        outline: 'border-gray-200 dark:border-gray-700',
        ghost: 'border-transparent shadow-none',
        elevated: 'border-gray-200 shadow-lg',
      },
      size: {
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-md transition-shadow',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      interactive: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, variant, size, interactive, asChild = false, ...props },
    ref
  ) => {
    const Comp = asChild ? 'div' : 'div'

    return (
      <Comp
        ref={ref}
        className={clsx(
          cardVariants({ variant, size, interactive, className })
        )}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

// Card Header Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('flex flex-col space-y-1.5', className)}
      {...props}
    />
  )
)

CardHeader.displayName = 'CardHeader'

// Card Title Component
export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Comp = 'h3', ...props }, ref) => (
    <Comp
      ref={ref}
      className={clsx(
        'font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    />
  )
)

CardTitle.displayName = 'CardTitle'

// Card Description Component
export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={clsx('text-sm text-gray-500 dark:text-gray-400', className)}
    {...props}
  />
))

CardDescription.displayName = 'CardDescription'

// Card Content Component
export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('pt-0', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

// Card Footer Component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('flex items-center pt-0', className)}
      {...props}
    />
  )
)

CardFooter.displayName = 'CardFooter'

// Model Card - specialized for AI model cards
export interface ModelCardProps extends Omit<CardProps, 'variant'> {
  model: {
    name: string
    provider: string
    contextWindow: string
    isNew?: boolean
    description?: string
  }
  onConfigure?: () => void
  configureButtonText?: string
  providerLogo?: React.ReactNode
  badge?: React.ReactNode
}

const ModelCard = React.forwardRef<HTMLDivElement, ModelCardProps>(
  (
    {
      model,
      onConfigure,
      configureButtonText = 'Configure',
      providerLogo,
      badge,
      className,
      children,
      ...props
    },
    ref
  ) => (
    <Card
      ref={ref}
      variant="outline"
      size="default"
      interactive={!!onConfigure}
      className={clsx('transition-all duration-200 hover:shadow-lg', className)}
      {...props}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-sm font-medium">
              {model.name}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              {model.contextWindow}
            </CardDescription>
          </div>

          <div className="ml-2 flex items-center gap-2">
            {badge}
            {model.isNew && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                New
              </span>
            )}
            {providerLogo && (
              <div className="h-6 w-6 flex-shrink-0">{providerLogo}</div>
            )}
          </div>
        </div>
      </CardHeader>

      {(model.description || children) && (
        <CardContent>
          {model.description && (
            <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-300">
              {model.description}
            </p>
          )}
          {children}
        </CardContent>
      )}

      {onConfigure && (
        <CardFooter className="justify-end">
          <button
            onClick={onConfigure}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-blue-700"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {configureButtonText}
          </button>
        </CardFooter>
      )}
    </Card>
  )
)

ModelCard.displayName = 'ModelCard'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  ModelCard,
  cardVariants,
}
