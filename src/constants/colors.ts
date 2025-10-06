// Brand colors and theme constants for the Repaso App

// Exam weight chart colors - used across the app for consistency
export const EXAM_COLORS = {
  // Original hex values from ExamWeightsChart
  hex: [
    '#808670', // Olive green
    '#A0AB89', // Light olive
    '#BF8A64', // Warm brown
    '#BD612A', // Orange brown
    '#E89B40', // Golden orange
    '#E6B883', // Light peach
    '#F0E1D1', // Cream
    '#d1d5db'  // Light gray
  ],
  
  // Tailwind CSS classes for backgrounds
  tailwind: [
    'bg-[#808670]',
    'bg-[#A0AB89]',
    'bg-[#BF8A64]',
    'bg-[#BD612A]',
    'bg-[#E89B40]',
    'bg-[#E6B883]',
    'bg-[#F0E1D1]',
    'bg-[#d1d5db]'
  ],

  // Default color (first in the palette)
  default: {
    hex: '#808670',
    tailwind: 'bg-[#808670]'
  }
}

// Psychology section labels that correspond to colors
export const SECTION_LABELS = [
  'Ética/Legal',
  'Evaluación', 
  'Tratamiento',
  'Cognitivo-Afectivo',
  'Biológicas',
  'Social/Multicultural',
  'Desarrollo',
  'Investigación'
]

// Color picker options for admin
export const COLOR_OPTIONS = EXAM_COLORS.tailwind

// Helper function to get color by index
export const getColorByIndex = (index: number) => {
  const safeIndex = index % EXAM_COLORS.tailwind.length
  return {
    hex: EXAM_COLORS.hex[safeIndex],
    tailwind: EXAM_COLORS.tailwind[safeIndex]
  }
}

// Helper function to get random color
export const getRandomColor = () => {
  const randomIndex = Math.floor(Math.random() * EXAM_COLORS.tailwind.length)
  return getColorByIndex(randomIndex)
}