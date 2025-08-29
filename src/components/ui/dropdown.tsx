import * as React from "react";
import { clsx } from "clsx";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}

const Dropdown = React.forwardRef<HTMLButtonElement, DropdownProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select an option...",
      disabled = false,
      error,
      label,
      className,
      triggerClassName,
      menuClassName,
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const dropdownId = React.useId();
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => triggerRef.current!);

    const selectedOption = options.find((option) => option.value === value);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (isOpen) {
            if (focusedIndex >= 0) {
              const option = options[focusedIndex];
              if (!option.disabled) {
                onChange?.(option.value);
                setIsOpen(false);
                setFocusedIndex(-1);
              }
            }
          } else {
            setIsOpen(true);
          }
          break;

        case "Escape":
          if (isOpen) {
            e.preventDefault();
            setIsOpen(false);
            setFocusedIndex(-1);
            triggerRef.current?.focus();
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(0);
          } else {
            const nextIndex = Math.min(focusedIndex + 1, options.length - 1);
            setFocusedIndex(nextIndex);
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(options.length - 1);
          } else {
            const prevIndex = Math.max(focusedIndex - 1, 0);
            setFocusedIndex(prevIndex);
          }
          break;

        case "Home":
          if (isOpen) {
            e.preventDefault();
            setFocusedIndex(0);
          }
          break;

        case "End":
          if (isOpen) {
            e.preventDefault();
            setFocusedIndex(options.length - 1);
          }
          break;
      }
    };

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node) &&
          !triggerRef.current?.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    // Scroll focused option into view
    React.useEffect(() => {
      if (isOpen && focusedIndex >= 0 && menuRef.current) {
        const focusedElement = menuRef.current.children[
          focusedIndex
        ] as HTMLElement;
        focusedElement?.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }, [focusedIndex, isOpen]);

    const handleOptionClick = (option: DropdownOption) => {
      if (option.disabled) return;

      onChange?.(option.value);
      setIsOpen(false);
      setFocusedIndex(-1);
      triggerRef.current?.focus();
    };

    return (
      <div className={clsx("relative w-full", className)}>
        {label && (
          <label
            htmlFor={dropdownId}
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        <button
          ref={triggerRef}
          id={dropdownId}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={label ? `${dropdownId}-label` : undefined}
          className={clsx(
            "flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm ring-offset-white transition-colors",
            "hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:ring-offset-gray-950",
            error
              ? "border-red-500 focus-visible:ring-red-500"
              : "border-gray-200",
            triggerClassName,
          )}
          {...props}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedOption?.icon && (
              <span className="flex-shrink-0 text-gray-500">
                {selectedOption.icon}
              </span>
            )}
            <span
              className={clsx(
                "block truncate text-left",
                selectedOption
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-500 dark:text-gray-400",
              )}
            >
              {selectedOption?.label || placeholder}
            </span>
          </div>

          <ChevronDown
            className={clsx(
              "h-4 w-4 flex-shrink-0 text-gray-400 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        {isOpen && (
          <div
            ref={menuRef}
            role="listbox"
            aria-labelledby={dropdownId}
            className={clsx(
              "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg",
              "dark:border-gray-700 dark:bg-gray-900",
              "animate-scale-in",
              menuClassName,
            )}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                role="option"
                aria-selected={value === option.value}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={clsx(
                  "relative cursor-default select-none py-2 pl-3 pr-9 text-sm transition-colors",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  index === focusedIndex && "bg-gray-100 dark:bg-gray-800",
                  option.disabled && "opacity-50 cursor-not-allowed",
                  !option.disabled && "cursor-pointer",
                )}
              >
                <div className="flex items-center gap-2">
                  {option.icon && (
                    <span className="flex-shrink-0 text-gray-500">
                      {option.icon}
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <span
                      className={clsx(
                        "block truncate font-medium",
                        option.disabled
                          ? "text-gray-400 dark:text-gray-500"
                          : "text-gray-900 dark:text-gray-100",
                      )}
                    >
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </span>
                    )}
                  </div>

                  {value === option.value && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600 dark:text-blue-400">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

Dropdown.displayName = "Dropdown";

// Model Selector - specialized dropdown for AI models
export interface ModelSelectorProps extends Omit<DropdownProps, "options"> {
  models: Array<{
    id: string;
    name: string;
    provider: string;
    contextWindow?: string;
    isNew?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
  }>;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  groupByProvider?: boolean;
}

const ModelSelector = React.forwardRef<HTMLButtonElement, ModelSelectorProps>(
  (
    {
      models,
      selectedModel,
      onModelChange,
      groupByProvider = false,
      placeholder = "Select a model...",
      ...props
    },
    ref,
  ) => {
    // Convert models to dropdown options
    const options: DropdownOption[] = models.map((model) => ({
      value: model.id,
      label: model.name,
      description: model.contextWindow,
      disabled: model.disabled,
      icon: model.icon,
    }));

    return (
      <Dropdown
        ref={ref}
        options={options}
        value={selectedModel}
        onChange={onModelChange}
        placeholder={placeholder}
        {...props}
      />
    );
  },
);

ModelSelector.displayName = "ModelSelector";

export { Dropdown, ModelSelector };
