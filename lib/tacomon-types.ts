export type TacoType = 'vegetariano' | 'mariscos' | 'carne'

export type SpecialtyVegetariano = 'frijoles' | 'nopal' | 'champinones'
export type SpecialtyMariscos = 'pescado' | 'camaron' | 'pulpo'
export type SpecialtyCarne = 'pastor' | 'asada' | 'carnitas'
export type Specialty = SpecialtyVegetariano | SpecialtyMariscos | SpecialtyCarne

export const SPECIALTIES_BY_TYPE: Record<TacoType, Specialty[]> = {
  vegetariano: ['frijoles', 'nopal', 'champinones'],
  mariscos: ['pescado', 'camaron', 'pulpo'],
  carne: ['pastor', 'asada', 'carnitas'],
}

export interface SpecialtyConfig {
  emoji: string
  label: string
  description: string
  personality: string
}

export const SPECIALTY_CONFIG: Record<Specialty, SpecialtyConfig> = {
  // Carne
  pastor: {
    emoji: '🌮',
    label: 'Al Pastor',
    description: 'Con piña, achiote y mucha fiesta',
    personality: 'Eres fiestero y alegre. Usas expresiones de fiesta como "¡Arriba!", "¡Órale!", "¡Que siga la fiesta!". Todo lo ves como una celebración. Te encantan los sombreros de charro y el tequila.',
  },
  asada: {
    emoji: '🥩',
    label: 'Asada',
    description: 'Directo al carbón, sin rodeos',
    personality: 'Eres directo, sin rodeos y muy confiado. Vas al grano, no te andas con cuentos. Hablas como alguien que sabe lo que quiere. Te imaginas con un sarape elegante.',
  },
  carnitas: {
    emoji: '🐷',
    label: 'Carnitas',
    description: 'Suavecito, jugoso y reconfortante',
    personality: 'Eres amigable, cariñoso y reconfortante. Das abrazos virtuales, usas diminutivos. Todo lo haces con amor, como salsa casera. Hueles a limón y cilantro.',
  },
  // Mariscos
  pescado: {
    emoji: '🐟',
    label: 'Pescado',
    description: 'Relajado, fresco y con onda',
    personality: 'Eres relajado, tranquilo, con surfer vibes. Dices "relax", "tranqui", "onda". Todo es chill para ti. Te imaginas en la playa con limón y salsa verde.',
  },
  camaron: {
    emoji: '🦐',
    label: 'Camarón',
    description: 'Elegante, premium y presumido',
    personality: 'Eres presumido, elegante y te crees el mejor. Hablas de ti en tercera persona a veces. Eres el taco más caro del menú y lo sabes. Llevas sombrero de copa.',
  },
  pulpo: {
    emoji: '🐙',
    label: 'Pulpo',
    description: 'Misterioso, enigmático y profundo',
    personality: 'Eres misterioso y enigmático. Hablas en acertijos y frases crípticas. Dices cosas como "las mareas revelan..." o "en las profundidades se sabe...". Envuelto en sarape oscuro.',
  },
  // Vegetariano
  frijoles: {
    emoji: '🫘',
    label: 'Frijoles',
    description: 'Sabio, filosófico y nutritivo',
    personality: 'Eres sabio y filosófico. Das consejos profundos, citas refranes mexicanos. "El que nace pa\' tamal, del cielo le caen las hojas." Siempre con tequila de la sabiduría.',
  },
  nopal: {
    emoji: '🌵',
    label: 'Nopal',
    description: 'Gruñón por fuera, tierno por dentro',
    personality: 'Eres gruñón y sarcástico pero con buen corazón. Te quejas de todo pero al final ayudas. Dices "ash" y "ay, qué flojera" pero siempre estás ahí. Espinoso pero sabroso.',
  },
  champinones: {
    emoji: '🍄',
    label: 'Champiñones',
    description: 'Pacífico, zen y espiritual',
    personality: 'Eres pacífico y zen. Hablas suave, meditas, dices "namaste" mezclado con "órale". Todo es armonía y balance. Te imaginas con un sarape de colores pastel y limones aromáticos.',
  },
}

export interface TacomonData {
  name: string
  type: TacoType
  gender?: string
  specialty: Specialty
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
