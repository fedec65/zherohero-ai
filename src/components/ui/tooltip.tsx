import * as React from "react";
import { clsx } from "clsx";
import { createPortal } from "react-dom";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  disabled?: boolean;
  className?: string;
  sideOffset?: number;
}

const Tooltip = ({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 700,
  disabled = false,
  className,
  sideOffset = 8,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const triggerRef = React.useRef<HTMLElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const showTooltip = React.useCallback(() => {
    if (disabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayDuration);
  }, [disabled, delayDuration]);

  const hideTooltip = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Position calculation
  const getTooltipPosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) {
      return { top: 0, left: 0, opacity: 0 };
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    // Calculate position based on side
    switch (side) {
      case "top":
        top = triggerRect.top - tooltipRect.height - sideOffset;
        break;
      case "bottom":
        top = triggerRect.bottom + sideOffset;
        break;
      case "left":
        left = triggerRect.left - tooltipRect.width - sideOffset;
        break;
      case "right":
        left = triggerRect.right + sideOffset;
        break;
    }

    // Calculate alignment
    if (side === "top" || side === "bottom") {
      switch (align) {
        case "start":
          left = triggerRect.left;
          break;
        case "center":
          left =
            triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case "end":
          left = triggerRect.right - tooltipRect.width;
          break;
      }
    } else {
      switch (align) {
        case "start":
          top = triggerRect.top;
          break;
        case "center":
          top =
            triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case "end":
          top = triggerRect.bottom - tooltipRect.height;
          break;
      }
    }

    // Viewport boundary checks
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Horizontal boundary checks
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > viewport.width - 8) {
      left = viewport.width - tooltipRect.width - 8;
    }

    // Vertical boundary checks
    if (top < 8) {
      top = 8;
    } else if (top + tooltipRect.height > viewport.height - 8) {
      top = viewport.height - tooltipRect.height - 8;
    }

    return {
      top: top + window.scrollY,
      left: left + window.scrollX,
      opacity: 1,
    };
  }, [side, align, sideOffset]);

  // Arrow position calculation
  const getArrowClasses = () => {
    const baseClasses =
      "absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45";

    switch (side) {
      case "top":
        return `${baseClasses} -bottom-1 left-1/2 -translate-x-1/2`;
      case "bottom":
        return `${baseClasses} -top-1 left-1/2 -translate-x-1/2`;
      case "left":
        return `${baseClasses} -right-1 top-1/2 -translate-y-1/2`;
      case "right":
        return `${baseClasses} -left-1 top-1/2 -translate-y-1/2`;
      default:
        return baseClasses;
    }
  };

  const triggerElement = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      showTooltip();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      hideTooltip();
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      showTooltip();
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      hideTooltip();
    },
    "aria-describedby": isVisible ? "tooltip" : undefined,
  });

  const tooltipContent = mounted && isVisible && (
    <div
      ref={tooltipRef}
      id="tooltip"
      role="tooltip"
      className={clsx(
        "fixed z-50 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md shadow-md pointer-events-none transition-opacity duration-150",
        "dark:bg-gray-700 dark:text-gray-100",
        isVisible ? "opacity-100" : "opacity-0",
        className,
      )}
      style={getTooltipPosition()}
    >
      {content}
      <div className={getArrowClasses()} />
    </div>
  );

  return (
    <>
      {triggerElement}
      {mounted && createPortal(tooltipContent, document.body)}
    </>
  );
};

// Simple tooltip hook for programmatic usage
export const useTooltip = () => {
  const [isVisible, setIsVisible] = React.useState(false);

  const show = React.useCallback(() => setIsVisible(true), []);
  const hide = React.useCallback(() => setIsVisible(false), []);
  const toggle = React.useCallback(() => setIsVisible((prev) => !prev), []);

  return {
    isVisible,
    show,
    hide,
    toggle,
  };
};

export { Tooltip };
