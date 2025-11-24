'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatProps {
  onClose: () => void
}

export default function AIChat({ onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI music assistant. I can help you discover music, create playlists, and answer questions about songs. What would you like to know?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    const userInput = input
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput }),
      })

      const data = await response.json()
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response },
      ])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble right now. Please try again later." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-spotify-dark border-l border-gray-800 flex flex-col shadow-2xl z-50 animate-slide-in">
      <div className="p-3 sm:p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-spotify-green rounded-full flex items-center justify-center flex-shrink-0">
            <Bot size={18} className="sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm sm:text-base truncate">AI Assistant</h3>
            <p className="text-gray-400 text-xs">Online</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white active:scale-95 transition-all p-1 flex-shrink-0"
          aria-label="Close chat"
        >
          <X size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-spotify-green text-white'
                  : 'bg-spotify-light text-gray-100'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-spotify-light rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 sm:p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about music..."
            className="flex-1 bg-spotify-light text-white px-3 sm:px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-spotify-green text-sm sm:text-base"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 bg-spotify-green hover:bg-green-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all flex-shrink-0"
            aria-label="Send message"
          >
            <Send size={16} className="sm:w-[18px] sm:h-[18px] text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Free AI Assistant • Powered by OpenAI
        </p>
      </div>
    </div>
  )
}

