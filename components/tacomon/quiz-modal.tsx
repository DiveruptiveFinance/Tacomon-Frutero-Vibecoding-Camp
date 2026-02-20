'use client'

import { useState, useCallback } from 'react'
import type { QuizQuestion } from '@/lib/tacomon-types'

interface QuizModalProps {
  question: QuizQuestion
  actionType: 'alimentar' | 'charlar' | 'jugar'
  onResult: (correct: boolean) => void
  onClose: () => void
}

const ACTION_CONFIG = {
  alimentar: {
    title: 'Hora de Comer!',
    emoji: '\u{1F34E}',
    correctMsg: 'Respuesta correcta! Tu Tacomon come con gusto!',
    wrongMsg: 'Respuesta incorrecta... Tu Tacomon come un poquito.',
    color: 'var(--taco-red)',
    bgColor: 'var(--taco-red-bg)',
  },
  charlar: {
    title: 'Hora de Charlar!',
    emoji: '\u{1F4AC}',
    correctMsg: 'Respuesta correcta! Tu Tacomon esta muy feliz!',
    wrongMsg: 'Respuesta incorrecta... Pero tu Tacomon se divirtio.',
    color: 'var(--taco-green)',
    bgColor: 'var(--taco-green-bg)',
  },
  jugar: {
    title: 'Hora de Jugar!',
    emoji: '\u{26A1}',
    correctMsg: 'Respuesta correcta! Tu Tacomon gana mucha energia!',
    wrongMsg: 'Respuesta incorrecta... Pero se ejercito un poco.',
    color: 'var(--taco-gold)',
    bgColor: 'var(--taco-gold-bg)',
  },
}

export function QuizModal({ question, actionType, onResult, onClose }: QuizModalProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const config = ACTION_CONFIG[actionType]
  const isCorrect = selectedAnswer === question.correctIndex

  const handleAnswer = useCallback((index: number) => {
    if (showResult) return
    setSelectedAnswer(index)
    setShowResult(true)

    setTimeout(() => {
      onResult(index === question.correctIndex)
    }, 2500)
  }, [showResult, question.correctIndex, onResult])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="nes-container is-rounded w-full max-w-md animate-slide-up"
        style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <span className="text-2xl">{config.emoji}</span>
          <h2 className="mt-2" style={{ fontSize: 'var(--text-sm)', color: config.color }}>
            {config.title}
          </h2>
        </div>

        {/* Question */}
        <div
          className="nes-container is-rounded mb-4"
          style={{ backgroundColor: config.bgColor, color: 'var(--foreground)' }}
        >
          <p className="leading-relaxed" style={{ fontSize: 'var(--text-xs)' }}>
            {question.question}
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2 mb-4">
          {question.options.map((option, index) => {
            let btnStyle: React.CSSProperties = {
              cursor: showResult ? 'default' : 'pointer',
              backgroundColor: 'var(--secondary)',
              color: 'var(--foreground)',
              border: '3px solid var(--border)',
              borderRadius: '8px',
            }

            if (showResult) {
              if (index === question.correctIndex) {
                btnStyle = {
                  ...btnStyle,
                  backgroundColor: 'var(--taco-green-bg)',
                  borderColor: 'var(--taco-green)',
                  color: 'var(--foreground)',
                }
              } else if (index === selectedAnswer && !isCorrect) {
                btnStyle = {
                  ...btnStyle,
                  backgroundColor: 'var(--taco-red-bg)',
                  borderColor: 'var(--taco-red)',
                  color: 'var(--foreground)',
                }
              }
            } else if (index === selectedAnswer) {
              btnStyle = {
                ...btnStyle,
                backgroundColor: config.bgColor,
                borderColor: config.color,
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className="text-left p-2 md:p-3 transition-all duration-200 hover:scale-[1.02]"
                style={btnStyle}
                disabled={showResult}
              >
                <span className="leading-relaxed" style={{ fontSize: 'var(--text-xs)' }}>
                  {String.fromCharCode(65 + index)}{'. '}{option}
                </span>
                {showResult && index === question.correctIndex && (
                  <span className="ml-2" style={{ fontSize: 'var(--text-xs)' }}>{'  Correcto!'}</span>
                )}
                {showResult && index === selectedAnswer && !isCorrect && index !== question.correctIndex && (
                  <span className="ml-2" style={{ fontSize: 'var(--text-xs)' }}>{'  X'}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Result message */}
        {showResult && (
          <div className="text-center animate-slide-up">
            <p
              className="leading-relaxed mb-3"
              style={{ fontSize: 'var(--text-xs)', color: isCorrect ? 'var(--taco-green)' : 'var(--taco-red)' }}
            >
              {isCorrect ? config.correctMsg : config.wrongMsg}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              {isCorrect ? '+15 stats!' : '+5 stats'}
            </p>
          </div>
        )}

        {/* Close button (only if not answered yet) */}
        {!showResult && (
          <button
            onClick={onClose}
            className="nes-btn w-full mt-2"
            style={{ cursor: 'pointer', fontSize: 'var(--text-xs)' }}
          >
            {'Cancelar'}
          </button>
        )}
      </div>
    </div>
  )
}
