export type TacoType = 'vegetariano' | 'mariscos' | 'carne'
export type Gender = 'masculino' | 'femenino'

export interface TacomonData {
  name: string
  type: TacoType
  gender: Gender
  happiness: number
  energy: number
  hunger: number
  createdAt: string
  lastFed: string | null
  lastChatted: string | null
  lastPlayed: string | null
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  category: 'alimentar' | 'charlar' | 'jugar'
}

export const TACO_CONFIG = {
  vegetariano: {
    emoji: '\u{1F331}',
    label: 'Taco Vegetariano',
    sprite: '/sprites/taco-vegetariano.jpg',
    bgColor: 'var(--taco-green-bg)',
    color: 'var(--taco-green)',
    description: 'Lleno de verduras frescas y mucho aguacate',
  },
  mariscos: {
    emoji: '\u{1F4A7}',
    label: 'Taco de Mariscos',
    sprite: '/sprites/taco-mariscos.jpg',
    bgColor: 'var(--taco-blue-bg)',
    color: 'var(--taco-blue)',
    description: 'Con camarones, pescado y salsa de habanero',
  },
  carne: {
    emoji: '\u{1F969}',
    label: 'Taco de Carne',
    sprite: '/sprites/taco-carne.jpg',
    bgColor: 'var(--taco-red-bg)',
    color: 'var(--taco-red)',
    description: 'Carne asada con cilantro y cebollita',
  },
} as const

export const COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes

export const NAME_SUGGESTIONS = [
  'Chispita',
  'Salcita',
  'Limoncin',
  'Picosito',
  'Tortilla',
  'Guacamol',
  'Chilito',
  'Cebollín',
]
