'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { TacomonData } from '@/lib/tacomon-types'
import { useSalsa } from '@/hooks/use-salsa'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface FloatingText {
  id: number
  text: string
  x: number
}

interface ChatSectionProps {
  tacomon: TacomonData
  onUpdateStats: (stat: 'happiness' | 'energy' | 'hunger', amount: number) => void
}

const CHAT_STORAGE_KEY = 'tacomon-chat-history'
const MEMORIES_STORAGE_KEY = 'tacomon-memories'
const MAX_MESSAGES = 20

export function ChatSection({ tacomon, onUpdateStats }: ChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [memories, setMemories] = useState<string[]>([])
  const [consecutiveCount, setConsecutiveCount] = useState(0)
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const floatIdRef = useRef(0)
  const { earnFromChat } = useSalsa()

  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY)
      if (savedMessages) setMessages(JSON.parse(savedMessages))
      const savedMemories = localStorage.getItem(MEMORIES_STORAGE_KEY)
      if (savedMemories) setMemories(JSON.parse(savedMemories))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)))
    }
  }, [messages])

  useEffect(() => {
    if (memories.length > 0) {
      localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(memories))
    }
  }, [memories])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const addFloatingText = useCallback((text: string) => {
    const id = ++floatIdRef.current
    setFloatingTexts(prev => [...prev, { id, text, x: 30 + Math.random() * 40 }])
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(f => f.id !== id))
    }, 1500)
  }, [])

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isTyping) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg].slice(-MAX_MESSAGES))
    setInput('')
    setIsTyping(true)

    onUpdateStats('happiness', 5)
    addFloatingText('+5 💚')

    // Earn $SALSA from chatting
    const earned = earnFromChat()
    if (earned > 0) {
      setTimeout(() => addFloatingText(`+${earned} 🍅 $SALSA`), 150)
    }
    
    setTimeout(() => {
      onUpdateStats('energy', -3)
      addFloatingText('-3 ⚡')
    }, 300)

    const newCount = consecutiveCount + 1
    setConsecutiveCount(newCount)
    if (newCount >= 5) {
      setTimeout(() => {
        onUpdateStats('energy', -5)
        addFloatingText('-5 ⚡ cansancio')
      }, 600)
      setConsecutiveCount(0)
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          tacomonName: tacomon.name,
          tacomonType: tacomon.type,
          tacomonSpecialty: tacomon.specialty,
          stats: {
            happiness: tacomon.happiness,
            energy: tacomon.energy,
            hunger: tacomon.hunger,
          },
          memories,
        }),
      })

      const data = await res.json()

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.message || '...🌮',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg].slice(-MAX_MESSAGES))

      if (data.newMemories?.length > 0) {
        setMemories(prev => {
          const updated = [...prev, ...data.newMemories]
          return updated.slice(-20)
        })
      }
    } catch {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: '¡Ups! No puedo hablar ahora... 😵',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMsg].slice(-MAX_MESSAGES))
    } finally {
      setIsTyping(false)
    }
  }, [input, isTyping, tacomon, memories, consecutiveCount, onUpdateStats, addFloatingText])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="w-full relative">
      {/* Floating stat texts */}
      {floatingTexts.map(ft => (
        <div
          key={ft.id}
          className="absolute pointer-events-none animate-float-up"
          style={{
            left: `${ft.x}%`,
            top: '-10px',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            zIndex: 50,
          }}
        >
          {ft.text}
        </div>
      ))}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-primary w-full mb-2"
        style={{ fontSize: 'var(--text-xs)', cursor: 'pointer' }}
      >
        💬 {isOpen ? 'Cerrar Chat' : 'Chatear con ' + tacomon.name}
      </button>

      {isOpen && (
        <div
          className="modern-card"
          style={{ padding: '12px' }}
        >
          {/* Messages area */}
          <div
            ref={scrollRef}
            className="overflow-y-auto mb-2 space-y-2"
            style={{ maxHeight: '200px', minHeight: '80px' }}
          >
            {messages.length === 0 && (
              <p className="text-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', padding: '16px 0' }}>
                ¡Saluda a {tacomon.name}! 👋
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-bounce-in`}
              >
                <div
                  className="max-w-[80%] px-3 py-2"
                  style={{
                    backgroundColor: msg.role === 'user' ? 'var(--taco-blue)' : 'var(--taco-green)',
                    color: '#fff',
                    borderRadius: '16px',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 1.4,
                    ...(msg.role === 'user'
                      ? { borderBottomRightRadius: '4px' }
                      : { borderBottomLeftRadius: '4px' }),
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div
                  className="px-3 py-2 typing-dots"
                  style={{
                    backgroundColor: 'var(--taco-green)',
                    color: '#fff',
                    borderRadius: '16px',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Habla con ${tacomon.name}...`}
              className="modern-input flex-1"
              style={{ fontSize: 'var(--text-xs)', padding: '8px 12px' }}
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={isTyping || !input.trim()}
              className={`btn ${isTyping || !input.trim() ? 'btn-disabled' : 'btn-success'}`}
              style={{ fontSize: 'var(--text-xs)', cursor: isTyping ? 'not-allowed' : 'pointer', padding: '8px 12px' }}
            >
              📤
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
