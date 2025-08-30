import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 resize-none',
  {
    variants: {
      variant: {
        default: 'border-gray-200',
        error: 'border-red-500 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      textareaSize: {
        sm: 'text-xs py-1.5',
        default: 'text-sm py-2',
        lg: 'text-base py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      textareaSize: 'default',
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: string
  label?: string
  helperText?: string
  autoResize?: boolean
  maxRows?: number
  minRows?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      textareaSize,
      error,
      label,
      helperText,
      autoResize = false,
      maxRows = 10,
      minRows = 3,
      id,
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
    const generatedId = React.useId()
    const inputId = id || generatedId
    const hasError = error || variant === 'error'

    // Auto-resize functionality
    const adjustHeight = React.useCallback(() => {
      if (!autoResize || !textareaRef.current) return

      const textarea = textareaRef.current
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
      const minHeight = lineHeight * minRows
      const maxHeight = lineHeight * maxRows

      // Reset height to calculate scroll height
      textarea.style.height = 'auto'

      const scrollHeight = textarea.scrollHeight
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)

      textarea.style.height = `${newHeight}px`
    }, [autoResize, maxRows, minRows])

    React.useEffect(() => {
      adjustHeight()
    }, [value, adjustHeight])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e)
      adjustHeight()
    }

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        textareaRef.current = node
        if (ref) {
          if (typeof ref === 'function') {
            ref(node)
          } else {
            ref.current = node
          }
        }
      },
      [ref]
    )

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        <textarea
          id={inputId}
          className={clsx(
            textareaVariants({
              variant: hasError ? 'error' : variant,
              textareaSize,
              className,
            }),
            autoResize && 'overflow-hidden'
          )}
          ref={setRefs}
          value={value}
          onChange={handleChange}
          style={{
            minHeight: autoResize ? `${minRows * 1.5}rem` : undefined,
          }}
          {...props}
        />

        {(error || helperText) && (
          <p
            className={clsx(
              'mt-1 text-xs',
              hasError
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Chat Input Component - specialized for chat interface
export interface ChatInputProps
  extends Omit<TextareaProps, 'autoResize' | 'minRows' | 'maxRows'> {
  onSend?: (message: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  sendButton?: React.ReactNode
  maxLength?: number
  showCharCount?: boolean
}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  (
    {
      onSend,
      onKeyDown,
      sendButton,
      maxLength,
      showCharCount = false,
      value = '',
      onChange,
      placeholder = 'Type your message...',
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter, new line on Shift+Enter
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (typeof value === 'string' && value.trim() && onSend) {
          onSend(value.trim())
        }
      }
      onKeyDown?.(e)
    }

    const charCount = typeof value === 'string' ? value.length : 0
    const isOverLimit = maxLength && charCount > maxLength

    return (
      <div className="relative">
        <Textarea
          ref={ref}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoResize={true}
          minRows={1}
          maxRows={8}
          className="pr-12" // Space for send button
          {...props}
        />

        {sendButton && (
          <div className="absolute bottom-2 right-2">{sendButton}</div>
        )}

        {showCharCount && maxLength && (
          <div
            className={clsx(
              'mt-1 text-right text-xs',
              isOverLimit
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'

export { Textarea, ChatInput, textareaVariants }
