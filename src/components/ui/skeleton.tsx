import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-gray-100 dark:bg-gray-800",
  {
    variants: {
      variant: {
        default: "bg-gray-100 dark:bg-gray-800",
        light: "bg-gray-50 dark:bg-gray-700",
        medium: "bg-gray-200 dark:bg-gray-800",
        dark: "bg-gray-300 dark:bg-gray-900",
      },
      speed: {
        slow: "animate-pulse",
        normal: "animate-pulse",
        fast: "animate-ping",
      },
    },
    defaultVariants: {
      variant: "default",
      speed: "normal",
    },
  },
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant,
      speed,
      width,
      height,
      circle = false,
      style,
      ...props
    },
    ref,
  ) => {
    const skeletonStyle = {
      width,
      height,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={clsx(
          skeletonVariants({ variant, speed }),
          circle && "rounded-full",
          className,
        )}
        style={skeletonStyle}
        {...props}
      />
    );
  },
);

Skeleton.displayName = "Skeleton";

// Avatar Skeleton
export interface AvatarSkeletonProps
  extends Omit<SkeletonProps, "circle" | "width" | "height"> {
  size?: "sm" | "md" | "lg" | "xl";
}

const AvatarSkeleton = React.forwardRef<HTMLDivElement, AvatarSkeletonProps>(
  ({ size = "md", className, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
      xl: "w-16 h-16",
    };

    return (
      <Skeleton
        ref={ref}
        circle
        className={clsx(sizeClasses[size], className)}
        {...props}
      />
    );
  },
);

AvatarSkeleton.displayName = "AvatarSkeleton";

// Text Skeleton
export interface TextSkeletonProps
  extends Omit<SkeletonProps, "width" | "height"> {
  lines?: number;
  lineHeight?: string;
  lastLineWidth?: string;
}

const TextSkeleton = React.forwardRef<HTMLDivElement, TextSkeletonProps>(
  (
    {
      lines = 1,
      lineHeight = "1.25rem",
      lastLineWidth = "75%",
      className,
      ...props
    },
    ref,
  ) => {
    if (lines === 1) {
      return (
        <Skeleton
          ref={ref}
          height={lineHeight}
          className={clsx("w-full", className)}
          {...props}
        />
      );
    }

    return (
      <div ref={ref} className={clsx("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            height={lineHeight}
            width={index === lines - 1 ? lastLineWidth : "100%"}
            {...props}
          />
        ))}
      </div>
    );
  },
);

TextSkeleton.displayName = "TextSkeleton";

// Card Skeleton - for model cards and other card layouts
export interface CardSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  showAvatar?: boolean;
  showFooter?: boolean;
  avatarSize?: "sm" | "md" | "lg";
  textLines?: number;
}

const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(
  (
    {
      showAvatar = false,
      showFooter = true,
      avatarSize = "md",
      textLines = 3,
      className,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={clsx(
        "rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {showAvatar && <AvatarSkeleton size={avatarSize} />}
        <div className="flex-1 space-y-2">
          <Skeleton height="1.25rem" width="60%" />
          <Skeleton height="1rem" width="40%" />
        </div>
        <Skeleton height="1.5rem" width="3rem" />
      </div>

      {/* Content */}
      {textLines > 0 && (
        <div className="mt-4">
          <TextSkeleton lines={textLines} />
        </div>
      )}

      {/* Footer */}
      {showFooter && (
        <div className="mt-4 flex justify-end">
          <Skeleton height="2rem" width="5rem" />
        </div>
      )}
    </div>
  ),
);

CardSkeleton.displayName = "CardSkeleton";

// Chat Message Skeleton
export interface ChatMessageSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  isUser?: boolean;
  hasAvatar?: boolean;
  messageLines?: number;
}

const ChatMessageSkeleton = React.forwardRef<
  HTMLDivElement,
  ChatMessageSkeletonProps
>(
  (
    { isUser = false, hasAvatar = true, messageLines = 2, className, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={clsx(
        "flex gap-3 p-4",
        isUser && "flex-row-reverse",
        className,
      )}
      {...props}
    >
      {hasAvatar && <AvatarSkeleton size="sm" />}
      <div className="flex-1 space-y-2 max-w-[80%]">
        <TextSkeleton lines={messageLines} lastLineWidth="60%" />
        <Skeleton height="0.875rem" width="5rem" />
      </div>
    </div>
  ),
);

ChatMessageSkeleton.displayName = "ChatMessageSkeleton";

// Model Grid Skeleton - for the models page
export interface ModelGridSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  itemCount?: number;
  columns?: number;
}

const ModelGridSkeleton = React.forwardRef<
  HTMLDivElement,
  ModelGridSkeletonProps
>(({ itemCount = 12, columns = 3, className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx(
      "grid gap-4",
      {
        "grid-cols-1": columns === 1,
        "grid-cols-1 md:grid-cols-2": columns === 2,
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3": columns === 3,
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4":
          columns === 4,
      },
      className,
    )}
    {...props}
  >
    {Array.from({ length: itemCount }).map((_, index) => (
      <CardSkeleton key={index} showFooter textLines={1} />
    ))}
  </div>
));

ModelGridSkeleton.displayName = "ModelGridSkeleton";

// Chat List Skeleton - for sidebar chat list
export interface ChatListSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  itemCount?: number;
}

const ChatListSkeleton = React.forwardRef<
  HTMLDivElement,
  ChatListSkeletonProps
>(({ itemCount = 5, className, ...props }, ref) => (
  <div ref={ref} className={clsx("space-y-2", className)} {...props}>
    {Array.from({ length: itemCount }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 p-2 rounded-md">
        <div className="w-2 h-2 rounded-full">
          <Skeleton circle width="0.5rem" height="0.5rem" />
        </div>
        <div className="flex-1">
          <Skeleton height="1rem" width={`${60 + Math.random() * 30}%`} />
        </div>
      </div>
    ))}
  </div>
));

ChatListSkeleton.displayName = "ChatListSkeleton";

export {
  Skeleton,
  AvatarSkeleton,
  TextSkeleton,
  CardSkeleton,
  ChatMessageSkeleton,
  ModelGridSkeleton,
  ChatListSkeleton,
  skeletonVariants,
};
