# ZheroHero UI Components

A comprehensive, accessible, and fully-typed UI component library built specifically for the ZheroHero MindDeck clone. Built with React, TypeScript, Tailwind CSS, and class-variance-authority.

## 🎯 Features

- **Fully Typed**: Complete TypeScript interfaces for all components
- **Accessible**: WCAG-compliant with proper ARIA labels and keyboard navigation
- **Dark Mode**: Native dark mode support with `data-theme` attribute
- **Responsive**: Mobile-first design with responsive breakpoints
- **Customizable**: CVA-powered variants with easy customization
- **Production Ready**: Optimized for performance and bundle size

## 📦 Components

### Core Components

- **Button** - Multiple variants and sizes with loading states
- **Input** - Text inputs with validation and icons
- **Textarea** - Auto-resizing textareas with chat input variant
- **Dialog** - Accessible modal dialogs with focus management
- **Tooltip** - Positioned tooltips with keyboard support
- **Card** - Content containers with model card specialization
- **Badge** - Status indicators and labels
- **Dropdown** - Accessible select dropdown with model selector
- **Skeleton** - Loading states for better UX

### Specialized Components

- **ModelCard** - AI model display cards
- **ChatInput** - Chat interface input with send functionality
- **SearchInput** - Search inputs with clear functionality
- **ModelSelector** - Dropdown specifically for AI model selection

## 🚀 Quick Start

```tsx
import {
  Button,
  Input,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Card,
  ModelCard,
  Badge,
  Tooltip
} from '@/components/ui';

function MyComponent() {
  return (
    <div className="space-y-4">
      <Button variant="primary" size="lg">
        Get Started
      </Button>
      
      <Input
        label="Email"
        placeholder="Enter your email"
        type="email"
      />
      
      <ModelCard
        model={{
          name: "GPT-4",
          provider: "OpenAI",
          contextWindow: "128K tokens",
          isNew: true
        }}
        onConfigure={() => console.log('Configure')}
      />
    </div>
  );
}
```

## 📚 Component Documentation

### Button

Multiple variants and sizes with loading states and icons.

```tsx
// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Destructive</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// With icons and loading
<Button leftIcon={<Plus />}>New Chat</Button>
<Button loading>Processing...</Button>
```

### Input

Text inputs with validation, icons, and clear functionality.

```tsx
// Basic input
<Input placeholder="Enter text..." />

// With label and validation
<Input
  label="Username"
  error="Username is required"
  helperText="Choose a unique username"
/>

// Search input
<SearchInput
  placeholder="Search..."
  onSearch={(value) => console.log(value)}
/>

// With icons and clear
<Input
  leftIcon={<Search />}
  clearable
  onClear={() => setValue("")}
/>
```

### Textarea & ChatInput

Auto-resizing textareas with chat-specific functionality.

```tsx
// Basic textarea
<Textarea
  label="Message"
  placeholder="Enter your message..."
  autoResize
/>

// Chat input with send functionality
<ChatInput
  placeholder="Type a message..."
  onSend={(message) => handleSend(message)}
  sendButton={<Button size="iconSm"><Send /></Button>}
  maxLength={1000}
  showCharCount
/>
```

### Dialog

Accessible modal dialogs with focus management.

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
      <DialogDescription>
        Configure your preferences
      </DialogDescription>
    </DialogHeader>
    
    {/* Dialog content */}
    
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Tooltip

Positioned tooltips with keyboard support.

```tsx
<Tooltip content="This is a helpful tooltip" side="top">
  <Button variant="icon">
    <HelpIcon />
  </Button>
</Tooltip>

// With custom delay and positioning
<Tooltip
  content="Advanced tooltip"
  side="right"
  align="start"
  delayDuration={500}
>
  <span>Hover me</span>
</Tooltip>
```

### Card & ModelCard

Content containers with specialized AI model cards.

```tsx
// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Model card
<ModelCard
  model={{
    name: "Claude-3 Sonnet",
    provider: "Anthropic",
    contextWindow: "200K tokens",
    isNew: true,
    description: "Balanced model for complex tasks"
  }}
  onConfigure={() => openConfig()}
  providerLogo={<AnthropicLogo />}
/>
```

### Badge

Status indicators and labels with multiple variants.

```tsx
// Basic badges
<Badge>Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>

// Specialized badges
<ModelBadge type="new" />
<StatusBadge status="online" />
<ContextBadge tokens="128K" />
<CountBadge count={5} />

// Notification badge overlay
<NotificationBadge count={3}>
  <Button variant="icon">
    <Bell />
  </Button>
</NotificationBadge>
```

### Dropdown & ModelSelector

Accessible dropdowns with keyboard navigation.

```tsx
// Basic dropdown
<Dropdown
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2', disabled: true },
    { value: '3', label: 'Option 3', icon: <Icon /> }
  ]}
  value={selected}
  onChange={setSelected}
  placeholder="Select an option..."
/>

// Model selector
<ModelSelector
  models={[
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      contextWindow: '128K tokens',
      isNew: true
    }
  ]}
  selectedModel={activeModel}
  onModelChange={setActiveModel}
/>
```

### Skeleton

Loading states for better user experience.

```tsx
// Basic skeleton
<Skeleton width="200px" height="20px" />

// Specialized skeletons
<AvatarSkeleton size="lg" />
<TextSkeleton lines={3} />
<CardSkeleton showAvatar textLines={2} />
<ChatMessageSkeleton isUser={false} />
<ModelGridSkeleton itemCount={12} columns={3} />
```

## 🎨 Styling & Theming

### Dark Mode

All components support dark mode automatically:

```tsx
// Components automatically adapt to dark mode
<div data-theme="dark">
  <Button>Dark mode button</Button>
  <Input placeholder="Dark mode input" />
</div>
```

### Customization

Use className prop for custom styling:

```tsx
<Button className="bg-gradient-to-r from-purple-500 to-pink-500">
  Custom Button
</Button>

<Card className="border-blue-200 shadow-blue-100">
  Custom Card
</Card>
```

### CVA Variants

Extend component variants using class-variance-authority:

```tsx
import { buttonVariants } from '@/components/ui';
import { cva } from 'class-variance-authority';

const customButtonVariants = cva(buttonVariants(), {
  variants: {
    customVariant: {
      rainbow: "bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"
    }
  }
});
```

## ♿ Accessibility

All components follow WCAG guidelines:

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and roles
- **Focus Management**: Visible focus states and logical tab order
- **Color Contrast**: Meets WCAG AA standards
- **Semantic HTML**: Proper heading hierarchy and landmarks

## 🔧 TypeScript

Full type safety with comprehensive interfaces:

```tsx
import type { ButtonProps, InputProps, ModelCardProps } from '@/components/ui';

// All props are fully typed
const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />;
};

// Model data is strongly typed
interface Model {
  name: string;
  provider: string;
  contextWindow: string;
  isNew?: boolean;
}
```

## 🏗️ Architecture

### Component Structure
```
components/ui/
├── button.tsx         # Button variants and loading states
├── input.tsx          # Input with icons and validation
├── textarea.tsx       # Auto-resize textarea and chat input
├── dialog.tsx         # Modal dialogs with focus trap
├── tooltip.tsx        # Positioned tooltips
├── card.tsx           # Cards and model cards
├── badge.tsx          # Status badges and indicators
├── dropdown.tsx       # Select dropdown and model selector
├── skeleton.tsx       # Loading states
├── index.ts          # Centralized exports
├── examples.tsx      # Usage examples (dev only)
└── README.md         # This documentation
```

### Dependencies

- `class-variance-authority` - Variant management
- `clsx` - Conditional class names
- `lucide-react` - Icon library
- `react` - UI framework
- `tailwindcss` - Styling

### Performance

- **Tree Shaking**: Individual component imports
- **Bundle Size**: Optimized for minimal footprint
- **Memoization**: Expensive operations are memoized
- **Lazy Loading**: Components load on demand

## 🛠️ Development

### Adding New Components

1. Create component file in `/src/components/ui/`
2. Follow TypeScript and accessibility patterns
3. Add to index.ts exports
4. Update examples.tsx with usage examples
5. Add tests if needed

### Testing Components

```bash
# Run component tests
npm run test

# Test accessibility
npm run test:a11y

# Visual regression testing
npm run test:visual
```

## 📝 Best Practices

1. **Always use TypeScript interfaces**
2. **Include proper ARIA labels**
3. **Support keyboard navigation**
4. **Test in dark mode**
5. **Verify responsive behavior**
6. **Use semantic HTML elements**
7. **Include loading states**
8. **Handle error cases gracefully**

## 🤝 Contributing

1. Follow existing patterns and naming conventions
2. Ensure accessibility compliance
3. Add comprehensive TypeScript types
4. Include usage examples
5. Test thoroughly across devices and screen readers

---

Built with ❤️ for the ZheroHero MindDeck clone. For questions or issues, please refer to the main project documentation.