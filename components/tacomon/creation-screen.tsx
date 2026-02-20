'use client'

import { useState, useCallback } from 'react'
import {
  TacoType,
  Gender,
  TacomonData,
  TACO_CONFIG,
  NAME_SUGGESTIONS,
} from '@/lib/tacomon-types'
import { HatchingScene } from './hatching-scene'
import { ThemeToggle } from './theme-toggle'

interface CreationScreenProps {
  onCreated: (data: TacomonData) => void
}

export function CreationScreen({ onCreated }: CreationScreenProps) {
  const [name, setName] = useState('')
  const [selectedType, setSelectedType] = useState<TacoType | null>(null)
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null)
  const [isHatching, setIsHatching] = useState(false)
  const [createdData, setCreatedData] = useState<TacomonData | null>(null)

  const isNameValid = name.trim().length >= 2 && name.trim().length <= 10
  const canCreate = isNameValid && selectedType !== null && selectedGender !== null

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 10) {
      setName(value)
    }
  }, [])

  const handleCreate = useCallback(() => {
    if (!canCreate || !selectedType || !selectedGender) return

    const data: TacomonData = {
      name: name.trim(),
      type: selectedType,
      gender: selectedGender,
      happiness: 50,
      energy: 50,
      hunger: 50,
      createdAt: new Date().toISOString(),
      lastFed: null,
      lastChatted: null,
      lastPlayed: null,
    }

    setCreatedData(data)
    setIsHatching(true)
  }, [canCreate, name, selectedType, selectedGender])

  const handleHatchComplete = useCallback(() => {
    if (createdData) {
      onCreated(createdData)
    }
  }, [createdData, onCreated])

  if (isHatching && createdData) {
    return <HatchingScene tacomon={createdData} onComplete={handleHatchComplete} />
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-6 md:py-10"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Theme Toggle - top right */}
      <div className="w-full max-w-lg flex justify-end mb-3">
        <ThemeToggle />
      </div>

      {/* Title */}
      <div className="nes-container is-rounded mb-6 md:mb-8 text-center w-full max-w-lg">
        <h1 className="leading-relaxed" style={{ fontSize: 'var(--text-lg)', color: 'var(--foreground)' }}>
          {'Crea tu Tacomon'}
        </h1>
        <p className="mt-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
          {'Elige un nombre, tipo y genero para tu taco'}
        </p>
      </div>

      {/* Name Input Section */}
      <div className="nes-container with-title is-rounded w-full max-w-lg mb-6">
        <p className="title" style={{ fontSize: 'var(--text-sm)' }}>{'Nombre'}</p>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            className="nes-input"
            placeholder="Escribe un nombre..."
            value={name}
            onChange={handleNameChange}
            maxLength={10}
            style={{ fontSize: 'var(--text-sm)' }}
          />
          <div className="flex justify-between items-center">
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: isNameValid ? 'var(--taco-green)' : name.length > 0 && name.trim().length < 2 ? 'var(--taco-red)' : 'var(--muted-foreground)',
              }}
            >
              {name.trim().length < 2 && name.length > 0
                ? 'Minimo 2 letras'
                : isNameValid
                  ? 'Nombre valido!'
                  : ''}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              {name.length}/10
            </span>
          </div>

          {/* Name Suggestions */}
          <div className="flex flex-wrap gap-2 mt-1">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              {'Sugerencias:'}
            </span>
            {NAME_SUGGESTIONS.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setName(suggestion)}
                className="px-2 py-1 transition-all duration-200 hover:scale-110"
                style={{
                  fontSize: 'var(--text-xs)',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--secondary-foreground)',
                  border: '2px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Type Selection */}
      <div className="nes-container with-title is-rounded w-full max-w-lg mb-6">
        <p className="title" style={{ fontSize: 'var(--text-sm)' }}>{'Tipo de Taco'}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.entries(TACO_CONFIG) as [TacoType, typeof TACO_CONFIG[TacoType]][]).map(
            ([type, config]) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`type-card nes-container is-rounded p-3 text-center ${selectedType === type ? 'selected' : ''}`}
                style={{
                  backgroundColor: selectedType === type ? config.bgColor : 'var(--card)',
                  color: 'var(--foreground)',
                  borderColor: selectedType === type ? config.color : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <span className="text-2xl block mb-2">{config.emoji}</span>
                <span className="block leading-relaxed" style={{ fontSize: 'var(--text-xs)' }}>{config.label}</span>
                <span
                  className="block mt-1 leading-relaxed"
                  style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}
                >
                  {config.description}
                </span>
                {selectedType === type && (
                  <span className="block mt-2" style={{ fontSize: 'var(--text-xs)', color: config.color }}>
                    {'Seleccionado!'}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      </div>

      {/* Gender Selection */}
      <div className="nes-container with-title is-rounded w-full max-w-lg mb-6">
        <p className="title" style={{ fontSize: 'var(--text-sm)' }}>{'Genero'}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setSelectedGender('masculino')}
            className={`gender-option nes-container is-rounded flex flex-col items-center gap-2 ${selectedGender === 'masculino' ? 'selected-male' : ''}`}
            style={{
              backgroundColor: selectedGender === 'masculino' ? 'var(--gender-male-bg)' : 'var(--card)',
              color: selectedGender === 'masculino' ? '#fff' : 'var(--foreground)',
              borderColor: selectedGender === 'masculino' ? 'var(--gender-male)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            <span className="text-2xl" style={{ color: '#4A90D9' }}>{'♂'}</span>
            <span style={{ fontSize: 'var(--text-xs)' }}>{'Masculino'}</span>
          </button>
          <button
            onClick={() => setSelectedGender('femenino')}
            className={`gender-option nes-container is-rounded flex flex-col items-center gap-2 ${selectedGender === 'femenino' ? 'selected-female' : ''}`}
            style={{
              backgroundColor: selectedGender === 'femenino' ? 'var(--gender-female-bg)' : 'var(--card)',
              color: selectedGender === 'femenino' ? '#fff' : 'var(--foreground)',
              borderColor: selectedGender === 'femenino' ? 'var(--gender-female)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            <span className="text-2xl" style={{ color: '#D94A8A' }}>{'♀'}</span>
            <span style={{ fontSize: 'var(--text-xs)' }}>{'Femenino'}</span>
          </button>
        </div>
      </div>

      {/* Create Button */}
      <div className="w-full max-w-lg">
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className={`nes-btn w-full py-3 ${canCreate ? 'is-warning animate-pulse-glow' : 'is-disabled'}`}
          style={{
            cursor: canCreate ? 'pointer' : 'not-allowed',
            fontSize: 'var(--text-base)',
          }}
        >
          {'Cocinar!'}
        </button>
        {!canCreate && (
          <p className="text-center mt-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
            {!isNameValid && name.length === 0
              ? 'Escribe un nombre para tu Tacomon'
              : !isNameValid
                ? 'El nombre debe tener entre 2 y 10 letras'
                : !selectedType
                  ? 'Selecciona un tipo de taco'
                  : 'Selecciona el genero'}
          </p>
        )}
      </div>
    </main>
  )
}
