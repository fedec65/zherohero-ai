/**
 * UI Components Usage Examples
 *
 * This file demonstrates how to use all the UI components in the MindDeck clone.
 * Remove this file before production or use it for development testing.
 */
import React from "react";
import {
  Button,
  Input,
  SearchInput,
  Textarea,
  ChatInput,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Tooltip,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  ModelCard,
  Badge,
  StatusBadge,
  CountBadge,
  ModelBadge,
  ContextBadge,
  NotificationBadge,
} from "./index";
import {
  Search,
  Settings,
  Plus,
  MessageSquare,
  Send,
  Bell,
  User,
} from "lucide-react";

export function UIComponentExamples() {
  const [inputValue, setInputValue] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [chatMessage, setChatMessage] = React.useState("");

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          ZheroHero UI Components
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete UI component library for the MindDeck clone
        </p>
      </div>

      {/* Button Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Buttons
        </h2>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button leftIcon={<Plus className="h-4 w-4" />}>New Chat</Button>
            <Button
              variant="secondary"
              rightIcon={<Settings className="h-4 w-4" />}
            >
              Configure
            </Button>
            <Button variant="icon" size="icon">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button loading>Loading...</Button>
          </div>
        </div>
      </section>

      {/* Input Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Inputs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Standard Input"
            placeholder="Enter text here..."
            helperText="This is a helper text"
          />

          <Input
            label="Input with Error"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            error="This field is required"
            placeholder="Required field"
          />

          <SearchInput
            placeholder="Search conversations..."
            onSearch={(value) => console.log("Searching:", value)}
          />

          <Input
            label="Clearable Input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            clearable
            onClear={() => setInputValue("")}
            placeholder="Clearable input"
          />
        </div>
      </section>

      {/* Textarea Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Textareas
        </h2>

        <div className="space-y-4">
          <Textarea
            label="Standard Textarea"
            placeholder="Enter your message here..."
          />

          <ChatInput
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onSend={(message) => {
              console.log("Sending:", message);
              setChatMessage("");
            }}
            sendButton={
              <Button size="iconSm" variant="icon">
                <Send className="h-4 w-4" />
              </Button>
            }
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            maxLength={1000}
            showCharCount
          />
        </div>
      </section>

      {/* Card Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Cards
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
              <CardDescription>
                This is a simple card with basic content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Card content goes here. You can put any elements inside.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm">
                Action
              </Button>
            </CardFooter>
          </Card>

          <ModelCard
            model={{
              name: "GPT-4 Turbo",
              provider: "OpenAI",
              contextWindow: "128K tokens",
              isNew: true,
              description:
                "Most capable GPT-4 model with improved instruction following",
            }}
            onConfigure={() => console.log("Configure GPT-4")}
            badge={<ContextBadge tokens="128K" showLabel={false} />}
            providerLogo={
              <div className="w-6 h-6 bg-black rounded text-white flex items-center justify-center text-xs font-bold">
                AI
              </div>
            }
          />

          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle as="h4">Interactive Card</CardTitle>
              <CardDescription>
                This card has hover effects and elevated shadow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="new">New Feature</Badge>
                <p className="text-sm">Click me!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Badge Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Badges
        </h2>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatusBadge status="online" />
            <StatusBadge status="away" />
            <StatusBadge status="busy" />
            <StatusBadge status="offline" />
          </div>

          <div className="flex flex-wrap gap-3">
            <ModelBadge type="new" />
            <ModelBadge type="beta" />
            <ModelBadge type="premium" />
            <ModelBadge type="popular" />
            <ModelBadge type="deprecated" />
          </div>

          <div className="flex flex-wrap gap-3">
            <ContextBadge tokens="8K" />
            <ContextBadge tokens="32K" />
            <ContextBadge tokens="128K" />
            <CountBadge count={5} />
            <CountBadge count={99} />
            <CountBadge count={100} max={99} />
          </div>

          <div className="flex gap-4">
            <NotificationBadge count={3}>
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </NotificationBadge>

            <NotificationBadge dot>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </NotificationBadge>
          </div>
        </div>
      </section>

      {/* Tooltip Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Tooltips
        </h2>

        <div className="flex flex-wrap gap-4">
          <Tooltip content="This is a tooltip on top" side="top">
            <Button variant="outline">Hover me (Top)</Button>
          </Tooltip>

          <Tooltip content="This is a tooltip on the right" side="right">
            <Button variant="outline">Hover me (Right)</Button>
          </Tooltip>

          <Tooltip content="This is a tooltip on bottom" side="bottom">
            <Button variant="outline">Hover me (Bottom)</Button>
          </Tooltip>

          <Tooltip content="This is a tooltip on the left" side="left">
            <Button variant="outline">Hover me (Left)</Button>
          </Tooltip>

          <Tooltip
            content="Chat with AI models"
            side="right"
            delayDuration={300}
          >
            <Button variant="icon" size="icon">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </section>

      {/* Dialog Example */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Dialogs
        </h2>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Model Configuration</DialogTitle>
              <DialogDescription>
                Configure your AI model settings. You can adjust parameters and
                preferences here.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Input
                label="Model Name"
                placeholder="Enter model name"
                defaultValue="GPT-4"
              />
              <Input
                label="API Key"
                type="password"
                placeholder="Enter your API key"
              />
              <Textarea
                label="System Prompt"
                placeholder="You are a helpful AI assistant..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Save Configuration</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* Component Integration Example */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Component Integration
        </h2>

        <Card variant="elevated" className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Chat Interface</CardTitle>
              <NotificationBadge count={2}>
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
              </NotificationBadge>
            </div>
            <CardDescription>
              Complete chat interface with all components
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <SearchInput placeholder="Search messages..." />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StatusBadge status="online" />
                <span className="text-sm font-medium">GPT-4</span>
                <ModelBadge type="new" />
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                Hello! How can I assist you today?
              </div>
            </div>

            <ChatInput
              placeholder="Type your message..."
              sendButton={
                <Tooltip content="Send message" side="left">
                  <Button size="iconSm" variant="icon">
                    <Send className="h-3 w-3" />
                  </Button>
                </Tooltip>
              }
            />
          </CardContent>

          <CardFooter className="justify-between">
            <Badge variant="outline" size="sm">
              Connected
            </Badge>
            <Button variant="ghost" size="sm">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
