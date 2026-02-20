import type { Specialty } from './tacomon-types'

export interface TacodexEntry {
  ingrediente: string
  acompanamiento: string
  datoCurioso: string
}

export const TACODEX_DATA: Record<Specialty, TacodexEntry> = {
  pastor: {
    ingrediente: 'Cerdo al achiote',
    acompanamiento: 'Piña, cebolla, cilantro',
    datoCurioso: 'El método de cocción vertical llegó con inmigrantes libaneses en la década de 1920.',
  },
  asada: {
    ingrediente: 'Res al carbón',
    acompanamiento: 'Guacamole, cebollas cambray, limones',
    datoCurioso: 'Es el platillo social por excelencia en el norte de México y EE. UU.',
  },
  carnitas: {
    ingrediente: 'Cerdo en manteca',
    acompanamiento: 'Salsa verde, rábano',
    datoCurioso: 'Se usan partes como maciza, buche y cuerito para variar texturas en cazo de cobre.',
  },
  pescado: {
    ingrediente: 'Filete blanco capeado',
    acompanamiento: 'Col, aderezo de chipotle',
    datoCurioso: 'El estilo Ensenada es reconocido internacionalmente como joya gastronómica de la Baja California.',
  },
  camaron: {
    ingrediente: 'Crustáceo salteado',
    acompanamiento: 'Queso, pimiento morrón',
    datoCurioso: 'El taco gobernador surgió en Sinaloa específicamente para un político local en el año 1987.',
  },
  pulpo: {
    ingrediente: 'Tentáculos asados',
    acompanamiento: 'Puré de camote, mayo-habanero',
    datoCurioso: 'Requiere técnica de asustado para romper el colágeno y asegurar una textura muy suave.',
  },
  frijoles: {
    ingrediente: 'Refritos en tortilla',
    acompanamiento: 'Queso fresco, aguacate',
    datoCurioso: 'Esta combinación ofrece una proteína completa de alta calidad comparable a la carne roja.',
  },
  nopal: {
    ingrediente: 'Pencas asadas',
    acompanamiento: 'Queso panela, orégano',
    datoCurioso: 'Es un superalimento con propiedades hipoglucemiantes comprobadas por la ciencia para regular la glucosa sanguínea.',
  },
  champinones: {
    ingrediente: 'Hongos al epazote',
    acompanamiento: 'Queso Oaxaca, cebolla morada',
    datoCurioso: 'Liberan umami al cocinarse, proporcionando una sensación de saciedad similar a la proteína animal.',
  },
}
