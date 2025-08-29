import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 active:scale-95",
  {
    variants: {
      variant: {
        primary:
          "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-md",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-md dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700",
        ghost:
          "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100 hover:shadow-sm",
        outline:
          "border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:hover:border-gray-600",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg dark:bg-red-600 dark:hover:bg-red-700 shadow-md",
        link: "text-blue-600 underline-offset-4 hover:underline dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
        icon: "rounded-full p-0 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md hover:scale-105",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base font-semibold",
        xl: "h-14 rounded-xl px-12 text-lg font-semibold",
        icon: "h-10 w-10",
        iconSm: "h-8 w-8",
        iconLg: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={clsx("group", buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && leftIcon && (
          <span className="mr-2 transition-transform group-hover:scale-110">
            {leftIcon}
          </span>
        )}
        <span className={loading ? "opacity-70" : ""}>{children}</span>
        {!loading && rightIcon && (
          <span className="ml-2 transition-transform group-hover:scale-110">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
