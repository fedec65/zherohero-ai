import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-900 text-gray-50 hover:bg-gray-900/80 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/80",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80",
        destructive:
          "border-transparent bg-red-500 text-gray-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-gray-50 dark:hover:bg-red-900/80",
        outline: "text-gray-950 dark:text-gray-50",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-500/80 dark:bg-green-600 dark:hover:bg-green-600/80",
        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80 dark:bg-yellow-600 dark:hover:bg-yellow-600/80",
        info: "border-transparent bg-blue-500 text-white hover:bg-blue-500/80 dark:bg-blue-600 dark:hover:bg-blue-600/80",
        new: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-900/80",
        beta: "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-100/80 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-900/80",
        premium:
          "border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600",
        custom:
          "border-transparent bg-gray-100 text-gray-700 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-800/80",
      },
      size: {
        xs: "px-1.5 py-0.5 text-xs rounded-sm",
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs rounded-md",
        lg: "px-3 py-1 text-sm",
        icon: "h-6 w-6 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function Badge({
  className,
  variant,
  size,
  leftIcon,
  rightIcon,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={clsx(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {leftIcon && <span className="mr-1 -ml-0.5">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-1 -mr-0.5">{rightIcon}</span>}
    </div>
  );
}

// Status Badge Component - for different states
export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: "online" | "offline" | "away" | "busy" | "idle";
}

const statusConfig = {
  online: { variant: "success" as const, label: "Online" },
  offline: { variant: "secondary" as const, label: "Offline" },
  away: { variant: "warning" as const, label: "Away" },
  busy: { variant: "destructive" as const, label: "Busy" },
  idle: { variant: "info" as const, label: "Idle" },
};

function StatusBadge({ status, children, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      leftIcon={<div className="w-2 h-2 rounded-full bg-current" />}
      {...props}
    >
      {children || config.label}
    </Badge>
  );
}

// Count Badge Component - for numbers/counts
export interface CountBadgeProps extends Omit<BadgeProps, "children"> {
  count: number;
  max?: number;
  showZero?: boolean;
}

function CountBadge({
  count,
  max = 99,
  showZero = false,
  className,
  ...props
}: CountBadgeProps) {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      variant="destructive"
      size="sm"
      className={clsx(
        "min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center",
        className,
      )}
      {...props}
    >
      {displayCount}
    </Badge>
  );
}

// Model Badge Component - specialized for AI models
export interface ModelBadgeProps extends Omit<BadgeProps, "variant"> {
  type: "new" | "beta" | "premium" | "deprecated" | "popular";
}

const modelBadgeConfig = {
  new: { variant: "new" as const, label: "New" },
  beta: { variant: "beta" as const, label: "Beta" },
  premium: { variant: "premium" as const, label: "Premium" },
  deprecated: { variant: "secondary" as const, label: "Deprecated" },
  popular: { variant: "info" as const, label: "Popular" },
};

function ModelBadge({ type, children, ...props }: ModelBadgeProps) {
  const config = modelBadgeConfig[type];

  return (
    <Badge variant={config.variant} size="sm" {...props}>
      {children || config.label}
    </Badge>
  );
}

// Context Window Badge - specifically for showing context windows
export interface ContextBadgeProps extends Omit<BadgeProps, "children"> {
  tokens: string;
  showLabel?: boolean;
}

function ContextBadge({
  tokens,
  showLabel = true,
  ...props
}: ContextBadgeProps) {
  return (
    <Badge variant="outline" size="sm" {...props}>
      {showLabel && "Context: "}
      {tokens}
    </Badge>
  );
}

// Notification Badge - for overlay notifications
export interface NotificationBadgeProps
  extends Omit<BadgeProps, "size" | "children"> {
  count?: number;
  dot?: boolean;
  children: React.ReactElement;
}

function NotificationBadge({
  count,
  dot = false,
  children,
  className,
  ...props
}: NotificationBadgeProps) {
  const showBadge = dot || (count !== undefined && count > 0);

  return (
    <div className="relative inline-flex">
      {children}
      {showBadge && (
        <Badge
          variant="destructive"
          size="icon"
          className={clsx(
            "absolute -top-2 -right-2 flex items-center justify-center",
            dot ? "h-2 w-2 p-0" : "h-5 w-5 text-xs",
            className,
          )}
          {...props}
        >
          {!dot && count !== undefined && (count > 99 ? "99+" : count)}
        </Badge>
      )}
    </div>
  );
}

export {
  Badge,
  StatusBadge,
  CountBadge,
  ModelBadge,
  ContextBadge,
  NotificationBadge,
  badgeVariants,
};
