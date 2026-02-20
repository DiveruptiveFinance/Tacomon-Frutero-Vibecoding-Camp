'use client'

import { useState, useCallback } from 'react'
import {
  TacoType,
  Specialty,
  TacomonData,
  TACO_CONFIG,
  SPECIALTIES_BY_TYPE,
  SPECIALTY_CONFIG,
} from '@/lib/tacomon-types'
import { HatchingScene } from './hatching-scene'
import { ThemeToggle } from './theme-toggle'
import { TacoSprite } from './taco-sprite'

interface CreationScreenProps {
  onCreated: (data: TacomonData) => void
}

export function CreationScreen({ onCreated }: CreationScreenProps) {
  const [name, setName] = useState('')
  const [selectedType, setSelectedType] = useState<TacoType | null>(null)
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null)
  const [isHatching, setIsHatching] = useState(false)
  const [createdData, setCreatedData] = useState<TacomonData | null>(null)

  const isNameValid = name.trim().length >= 2 && name.trim().length <= 10
  const canCreate = isNameValid && selectedType !== null && selectedSpecialty !== null

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 10) {
      setName(value)
    }
  }, [])

  const handleTypeSelect = useCallback((type: TacoType) => {
    setSelectedType(type)
    setSelectedSpecialty(null)
  }, [])

  const handleCreate = useCallback(() => {
    if (!canCreate || !selectedType || !selectedSpecialty) return

    const data: TacomonData = {
      name: name.trim(),
      type: selectedType,
      specialty: selectedSpecialty,
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
  }, [canCreate, name, selectedType, selectedSpecialty])

  const handleHatchComplete = useCallback(() => {
    if (createdData) {
      onCreated(createdData)
    }
  }, [createdData, onCreated])

  if (isHatching && createdData) {
    return <HatchingScene tacomon={createdData} onComplete={handleHatchComplete} />
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-6 md:py-10"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Theme Toggle */}
      <div className="w-full max-w-lg flex justify-end mb-3">
        <ThemeToggle />
      </div>

      {/* Title */}
      <div className="modern-card mb-6 md:mb-8 text-center w-full max-w-lg">
        <h1 className="leading-relaxed" style={{ fontSize: 'var(--text-lg)', color: 'var(--foreground)' }}>
          {'🌮 Crea tu Tacomon'}
        </h1>
        <p className="mt-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
          {'Elige un nombre, tipo y especialidad para tu taco'}
        </p>
      </div>

      {/* Name Input */}
      <div className="modern-card w-full max-w-lg mb-6">
        <p className="mb-3 font-semibold" style={{ fontSize: 'var(--text-sm)' }}>{'Nombre'}</p>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            className="modern-input"
            placeholder="Escribe un nombre..."
            value={name}
            onChange={handleNameChange}
            maxLength={10}
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
        </div>
      </div>

      {/* Type Selection */}
      <div className="modern-card w-full max-w-lg mb-6">
        <p className="mb-3 font-semibold" style={{ fontSize: 'var(--text-sm)' }}>{'Tipo de Taco'}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.entries(TACO_CONFIG) as [TacoType, typeof TACO_CONFIG[TacoType]][]).map(
            ([type, config]) => (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className={`type-card text-center ${selectedType === type ? 'selected' : ''}`}
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

      {/* Specialty Selection */}
      {selectedType && (
        <div className="modern-card w-full max-w-lg mb-6 animate-slide-up">
          <p className="mb-3 font-semibold" style={{ fontSize: 'var(--text-sm)' }}>{'🌶️ Especialidad'}</p>

          {/* Specialty preview sprite */}
          {selectedSpecialty && (
            <div className="flex justify-center mb-4">
              <TacoSprite specialty={selectedSpecialty} size="sm" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SPECIALTIES_BY_TYPE[selectedType].map((spec) => {
              const cfg = SPECIALTY_CONFIG[spec]
              return (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`type-card text-center ${selectedSpecialty === spec ? 'selected' : ''}`}
                  style={{
                    backgroundColor: selectedSpecialty === spec ? 'var(--taco-pink-bg)' : 'var(--card)',
                    color: 'var(--foreground)',
                    borderColor: selectedSpecialty === spec ? 'var(--taco-pink)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span className="text-2xl block mb-2">{cfg.emoji}</span>
                  <span className="block leading-relaxed" style={{ fontSize: 'var(--text-xs)', color: 'var(--taco-amarillo)' }}>{cfg.label}</span>
                  <span
                    className="block mt-1 leading-relaxed"
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}
                  >
                    {cfg.description}
                  </span>
                  {selectedSpecialty === spec && (
                    <span className="block mt-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--taco-pink)' }}>
                      {'✨ Seleccionado!'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Create Button */}
      <div className="w-full max-w-lg">
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className={`btn w-full py-3 ${canCreate ? 'btn-warning animate-pulse-glow' : 'btn-disabled'}`}
          style={{
            cursor: canCreate ? 'pointer' : 'not-allowed',
            fontSize: 'var(--text-base)',
            opacity: canCreate ? 1 : 0.5,
          }}
        >
          {'🔥 Cocinar!'}
        </button>
        {!canCreate && (
          <p className="text-center mt-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
            {!isNameValid && name.length === 0
              ? 'Escribe un nombre para tu Tacomon'
              : !isNameValid
                ? 'El nombre debe tener entre 2 y 10 letras'
                : !selectedType
                  ? 'Selecciona un tipo de taco'
                  : 'Selecciona una especialidad'}
          </p>
        )}
      </div>
    </main>
  )
}
