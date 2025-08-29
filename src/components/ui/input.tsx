import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { Search, X } from "lucide-react";

const inputVariants = cva(
  "flex w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-white transition-all duration-200 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:border-blue-500 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:hover:border-gray-600 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400 shadow-sm focus-visible:shadow-md",
  {
    variants: {
      variant: {
        default: "border-gray-200 dark:border-gray-700",
        error: "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500 bg-red-50/50 dark:bg-red-900/10 dark:border-red-500",
        success: "border-green-500 focus-visible:ring-green-500 focus-visible:border-green-500 bg-green-50/50 dark:bg-green-900/10 dark:border-green-500",
      },
      inputSize: {
        default: "h-10 px-3",
        sm: "h-8 text-xs px-2.5",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  error?: string;
  label?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = "text",
    variant, 
    inputSize,
    leftIcon,
    rightIcon,
    clearable = false,
    onClear,
    error,
    label,
    helperText,
    value,
    id,
    ...props 
  }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const showClearButton = clearable && value && value !== "";
    const hasError = error || variant === "error";

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
          >
            {label}
          </label>
        )}
        
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors duration-200">
              {leftIcon}
            </div>
          )}
          
          <input
            id={inputId}
            type={type}
            className={clsx(
              inputVariants({ 
                variant: hasError ? "error" : variant, 
                inputSize, 
                className 
              }),
              leftIcon && "pl-10",
              (rightIcon || showClearButton) && "pr-10"
            )}
            ref={ref}
            value={value}
            {...props}
          />
          
          {(rightIcon || showClearButton) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {showClearButton ? (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded-full transition-all duration-200 hover:scale-110"
                  aria-label="Clear input"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : rightIcon ? (
                <div className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors duration-200">
                  {rightIcon}
                </div>
              ) : null}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p className={clsx(
            "mt-2 text-xs transition-colors duration-200",
            hasError 
              ? "text-red-600 dark:text-red-400 font-medium" 
              : "text-gray-600 dark:text-gray-400"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Search Input Component
export interface SearchInputProps extends Omit<InputProps, "leftIcon" | "type"> {
  onSearch?: (value: string) => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onSearch?.(e.target.value);
    };

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Search className="h-4 w-4" />}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";

export { Input, SearchInput, inputVariants };