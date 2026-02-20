import type { QuizQuestion } from './tacomon-types'

export const quizQuestions: QuizQuestion[] = [
  // ALIMENTAR questions
  {
    question: 'Cual es el ingrediente principal de los tacos al pastor?',
    options: ['Carne de cerdo marinada', 'Pollo asado', 'Carne de res', 'Pescado frito'],
    correctIndex: 0,
    category: 'alimentar',
  },
  {
    question: 'De donde es originario el taco?',
    options: ['Estados Unidos', 'Espana', 'Mexico', 'Argentina'],
    correctIndex: 2,
    category: 'alimentar',
  },
  {
    question: 'Que tipo de tortilla se usa en los tacos de canasta?',
    options: ['De harina', 'De maiz', 'De nopal', 'De trigo integral'],
    correctIndex: 1,
    category: 'alimentar',
  },
  {
    question: 'Cual es la salsa tipica verde de los tacos?',
    options: ['Salsa de tomate', 'Salsa de tomatillo', 'Salsa de mango', 'Ketchup'],
    correctIndex: 1,
    category: 'alimentar',
  },
  {
    question: 'Que fruta se usa para hacer guacamole?',
    options: ['Mango', 'Papaya', 'Aguacate', 'Platano'],
    correctIndex: 2,
    category: 'alimentar',
  },
  {
    question: 'Cual es un condimento esencial en los tacos mexicanos?',
    options: ['Mostaza', 'Mayonesa', 'Limon', 'Vinagre'],
    correctIndex: 2,
    category: 'alimentar',
  },
  // CHARLAR questions
  {
    question: 'Cual es la capital de Mexico?',
    options: ['Guadalajara', 'Monterrey', 'Ciudad de Mexico', 'Cancun'],
    correctIndex: 2,
    category: 'charlar',
  },
  {
    question: 'Que se celebra el Dia de Muertos?',
    options: ['Halloween', 'La vida de los difuntos', 'El anio nuevo', 'La independencia'],
    correctIndex: 1,
    category: 'charlar',
  },
  {
    question: 'Como se llama la piramide mas famosa de Mexico?',
    options: ['Piramide de Giza', 'Chichen Itza', 'Machu Picchu', 'Piramide del Louvre'],
    correctIndex: 1,
    category: 'charlar',
  },
  {
    question: 'Que civilizacion antigua construyo Teotihuacan?',
    options: ['Los Mayas', 'Los Incas', 'Los Teotihuacanos', 'Los Aztecas'],
    correctIndex: 2,
    category: 'charlar',
  },
  {
    question: 'Cual es la bebida tipica mexicana hecha de agave?',
    options: ['Ron', 'Vodka', 'Tequila', 'Whisky'],
    correctIndex: 2,
    category: 'charlar',
  },
  {
    question: 'Que animal aparece en la bandera de Mexico?',
    options: ['Un jaguar', 'Un aguila', 'Un serpiente', 'Un quetzal'],
    correctIndex: 1,
    category: 'charlar',
  },
  // JUGAR questions
  {
    question: 'Cual es el deporte mas popular en Mexico?',
    options: ['Beisbol', 'Basketball', 'Futbol', 'Tenis'],
    correctIndex: 2,
    category: 'jugar',
  },
  {
    question: 'Como se llama el juego mexicano donde rompes una figura con dulces?',
    options: ['Loteria', 'Pinata', 'Serpientes y escaleras', 'Dominó'],
    correctIndex: 1,
    category: 'jugar',
  },
  {
    question: 'Cual es el chile mas picante de Mexico?',
    options: ['Jalapeno', 'Serrano', 'Habanero', 'Poblano'],
    correctIndex: 2,
    category: 'jugar',
  },
  {
    question: 'Que instrumento es tipico de los mariachis?',
    options: ['Piano', 'Trompeta', 'Bateria', 'Saxofon'],
    correctIndex: 1,
    category: 'jugar',
  },
  {
    question: 'En que estado de Mexico se hacen los mejores tacos al pastor?',
    options: ['Jalisco', 'Nuevo Leon', 'Ciudad de Mexico', 'Yucatan'],
    correctIndex: 2,
    category: 'jugar',
  },
  {
    question: 'Que significa la palabra taco en espanol antiguo?',
    options: ['Comida rapida', 'Bocado ligero', 'Tortilla rellena', 'Trozo o pedazo'],
    correctIndex: 3,
    category: 'jugar',
  },
]

export function getRandomQuestion(category: 'alimentar' | 'charlar' | 'jugar'): QuizQuestion {
  const categoryQuestions = quizQuestions.filter((q) => q.category === category)
  return categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)]
}
