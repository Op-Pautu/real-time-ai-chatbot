# Real-Time AI Chatbot with Streaming

A modern, real-time AI chatbot built with Next.js 15, React 19, and TypeScript. Features streaming responses using Server-Sent Events (SSE) and integrates with Groq's Llama 3.3 70B model.

## Demo Video

[Watch the demo walkthrough](YOUR_VIDEO_LINK_HERE)

## Features

### Core Features

- [x] **Chat Interface**

  - [x] Message list showing user and AI messages
  - [x] Auto-scroll to latest message
  - [x] Visual distinction between user/AI messages
  - [x] Timestamps on all messages
  - [x] Text input with send button
  - [x] Enter key to send (Shift+Enter for new line)
  - [x] Input disabled while AI is responding
  - [x] Character limit indicator (2000 chars)

- [x] **Real-Time Communication (SSE)**

  - [x] Connection status indicator (Connecting/Connected/Disconnected/Error)
  - [x] Automatic reconnection logic (3 attempts with 2s delay)
  - [x] Manual reconnect button
  - [x] Graceful error handling

- [x] **Streaming AI Responses**

  - [x] Real-time token-by-token display
  - [x] Typing indicator while waiting for first chunk
  - [x] Streaming cursor animation
  - [x] Stream completion handling

- [x] **State Management**
  - [x] Message history with conversation context
  - [x] Loading states
  - [x] Error states with user feedback
  - [x] Connection status tracking

### Bonus Features

- [x] **Message Persistence** - Chat history saved to localStorage
- [x] **Clear Chat** - Delete all messages with one click
- [x] **Copy to Clipboard** - Copy any message with visual feedback
- [x] **Markdown Rendering** - AI responses support markdown formatting
- [x] **Typing Indicator** - Animated dots while waiting for response

## Tech Stack

| Category    | Technology                  |
| ----------- | --------------------------- |
| Framework   | Next.js 16.1.4 (App Router) |
| Language    | TypeScript 5                |
| UI Library  | React 19                    |
| Styling     | Tailwind CSS 4              |
| Icons       | Lucide React                |
| Markdown    | react-markdown              |
| AI Provider | Groq API (Llama 3.3 70B)    |
| Real-Time   | Server-Sent Events (SSE)    |

## Project Structure

```
real-time-ai-chatbot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts        # SSE streaming API endpoint
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page
├── components/
│   ├── chat/
│   │   ├── index.ts            # Barrel exports
│   │   ├── ChatHeader.tsx      # Header with connection status
│   │   ├── ChatMessage.tsx     # Message bubble with markdown
│   │   ├── ChatInput.tsx       # Text input with send button
│   │   ├── TypingIndicator.tsx # Animated typing dots
│   │   └── EmptyState.tsx      # Empty chat placeholder
│   ├── ui/
│   │   └── alert.tsx           # Alert component
│   └── chatbot.tsx             # Main chatbot orchestrator
├── hooks/
│   ├── useMessages.ts          # Message state + localStorage
│   ├── useConnection.ts        # Connection status management
│   └── useChat.ts              # SSE streaming logic
├── types/
│   └── chat.ts                 # TypeScript types & constants
├── lib/
│   └── utils.ts                # Utility functions
├── .env.example                # Environment variables template
├── .env.local                  # Your API key (not committed)
├── package.json
├── tailwind.config.ts
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/real-time-ai-chatbot.git
   cd real-time-ai-chatbot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and add your Groq API key:

   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable       | Description                      | Required |
| -------------- | -------------------------------- | -------- |
| `GROQ_API_KEY` | Your Groq API key for LLM access | Yes      |

## Available Commands

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## Architecture Overview

### Data Flow

```
User Input → ChatBot Component → API Route → Groq API
                 ↑                    ↓
            State Update ← SSE Stream ← Streaming Response
```

### Key Components

1. **ChatBot Component** (`components/chatbot.tsx`)
   - Main orchestrator component (~150 lines)
   - Composes UI from smaller chat components
   - Delegates logic to custom hooks

2. **Chat UI Components** (`components/chat/`)
   - `ChatHeader` - Connection status indicator and action buttons
   - `ChatMessage` - Message bubble with markdown rendering and copy
   - `ChatInput` - Text input with character count and send button
   - `TypingIndicator` - Animated dots while waiting for response
   - `EmptyState` - Placeholder when no messages exist

3. **API Route** (`app/api/chat/route.ts`)
   - Server-side endpoint that proxies to Groq
   - Keeps API key secure (not exposed to client)
   - Streams responses using SSE

### Custom Hooks

The app uses custom hooks for clean separation of concerns:

- **`useMessages`** - Message state management with localStorage persistence
- **`useConnection`** - Connection status tracking and reconnection logic
- **`useChat`** - SSE streaming logic and response handling

## Code Walkthrough (For Video)

### 1. Types & Constants (`types/chat.ts`)

- `Message` interface: Defines the structure of chat messages
- `ConnectionStatus` type: Union type for connection states
- `CHAT_CONFIG`: Configuration constants (storage key, reconnect attempts, etc.)

### 2. Message Management (`hooks/useMessages.ts`)

- Lazy initialization from localStorage (no useEffect needed)
- `saveToStorage` / `loadFromStorage`: Serialization with Date handling
- `addMessage`, `updateStreamingMessage`, `finalizeStreamingMessage`: Message CRUD
- `clearMessages`: Wipes localStorage and state

### 3. Connection Management (`hooks/useConnection.ts`)

- `checkConnection`: Verifies API is working via HEAD request
- `attemptReconnect`: Retry logic with configurable max attempts
- State tracking: connecting, connected, disconnected, error

### 4. Streaming Logic (`hooks/useChat.ts`)

- `streamResponse`: Core SSE streaming implementation
- AbortController for cancellation support
- Parses SSE chunks and extracts content deltas
- Callbacks for stream updates, completion, and errors

### 5. UI Components (`components/chat/`)

- **ChatHeader**: Connection status badge + Clear/Reconnect buttons
- **ChatMessage**: User vs AI styling, markdown rendering, copy to clipboard
- **ChatInput**: Textarea with Enter to send, character counter
- **TypingIndicator**: Three bouncing dots animation
- **EmptyState**: "Start a Conversation" placeholder

### 6. Main Orchestrator (`components/chatbot.tsx`)

- Composes all hooks and components together
- `handleSend`: Validates input, adds user message, triggers stream
- Auto-scroll effect when messages change
- Clean separation: ~150 lines vs original ~740 lines

## Challenges & Solutions

| Challenge              | Solution                                   |
| ---------------------- | ------------------------------------------ |
| API key security       | Server-side API route keeps key hidden     |
| Real-time updates      | SSE with chunked reading and state updates |
| Message persistence    | localStorage with JSON serialization       |
| Connection reliability | Reconnection logic with max attempts       |
| Markdown in responses  | react-markdown with custom components      |

## Trade-offs & Decisions

1. **SSE vs WebSocket**: Chose SSE because it's simpler for unidirectional streaming and the Groq API uses HTTP streaming natively.

2. **localStorage vs Database**: Used localStorage for simplicity and no backend requirements. For production, a database would be better.

3. **Modular Architecture**: Refactored from a single 740-line component into custom hooks and smaller UI components. This improves readability, testability, and maintainability.

4. **Tailwind vs CSS Modules**: Chose Tailwind for rapid development and consistency with the assignment requirements.

## Time Spent

- Initial setup and configuration: ~30 minutes
- Chat UI implementation: ~1 hour
- SSE streaming implementation: ~1 hour
- State management and persistence: ~45 minutes
- Error handling and reconnection: ~30 minutes
- Markdown and bonus features: ~45 minutes
- Documentation and cleanup: ~30 minutes

**Total: ~5 hours**

## License

MIT

---

Built with Next.js, React, and Groq API
