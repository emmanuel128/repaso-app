---
applyTo: '**'
---
# Repaso App - GitHub Copilot Instructions

## Project Overview
Repaso App is a study and review application designed for psychology exam preparation in Puerto Rico. Built with React, TypeScript, Tailwind CSS, and integrated with AI-powered study tools using Google Gemini API and Supabase for data management.

## 🤖 AI Assistant Context

### Domain Knowledge
- **Subject**: Psychology licensing exam preparation (Puerto Rico)
- **Language**: Spanish for all user-facing content and AI-generated responses
- **Target Users**: Psychology students preparing for licensing exams
- **Cultural Context**: Puerto Rican psychology practice and regulations

### Technical Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom brand colors
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **AI Integration**: Google Gemini API for content generation
- **Charts**: Chart.js + react-chartjs-2
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Markdown**: Marked.js

## 🎨 Design System & Patterns

### Color Palette
Use the centralized color system from `src/constants/colors.ts`:
```typescript
// Import colors for consistency
import { EXAM_COLORS, COLOR_OPTIONS } from '../constants/colors'

// Use predefined palette
backgroundColor: EXAM_COLORS.hex // For charts
className={EXAM_COLORS.default.tailwind} // For components
```

**8-Color Psychology Exam Palette:**
- `#808670` (Olive green) - Primary/Default
- `#A0AB89` (Light olive) - Secondary  
- `#BF8A64` (Warm brown) - Accent
- `#BD612A` (Orange brown) - Emphasis
- `#E89B40` (Golden orange) - Highlight
- `#E6B883` (Light peach) - Soft
- `#F0E1D1` (Cream) - Light
- `#d1d5db` (Light gray) - Neutral

### Component Patterns
```typescript
// Standard component structure
import React from 'react'
import { ComponentProps } from '../types'
import { useAIModal } from '../contexts/AIModalContext'

interface ComponentNameProps {
  // Props with clear TypeScript types
}

const ComponentName: React.FC<ComponentNameProps> = ({ props }) => {
  // Use hooks at the top
  const { modalState, openModal } = useAIModal()
  
  // Event handlers
  const handleAction = async () => {
    // Always include error handling for async operations
    try {
      // Implementation
    } catch (error) {
      console.error('Error:', error)
      // User-friendly error message in Spanish
    }
  }

  return (
    <div className="responsive-container">
      {/* Spanish content */}
    </div>
  )
}

export default ComponentName
```

## 🗄️ Database Patterns

### Supabase Integration
```typescript
// Standard Supabase operations
import { supabase } from '../lib/supabase'

// Fetch with error handling
const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Database error:', error)
    throw error
  }
}

// Insert with RLS in mind
const insertData = async (newData) => {
  const { data, error } = await supabase
    .from('table_name')
    .insert([newData])
    .select()
  
  if (error) throw error
  return data
}
```

### Database Schema
- `study_sections`: Main psychology exam areas
- `study_topics`: Individual topics within sections
- Both tables have RLS enabled (public read, admin write)

## 🤖 AI Content Generation

### Gemini API Patterns
```typescript
// AI modal usage
const { openModal } = useAIModal()

// Generate content types
openModal('question', 'Psicología Clínica', 'DSM-5, Trastornos del Ánimo')
openModal('case', 'Ética Profesional', 'Confidencialidad')
openModal('explain', 'Neuropsicología', 'Lóbulos cerebrales')
openModal('mnemonic', 'Desarrollo', 'Etapas de Piaget')
```

### Content Guidelines
- **Questions**: Multiple choice with clinical scenarios
- **Case Studies**: Puerto Rican cultural context
- **Explanations**: Beginner-friendly with analogies
- **Mnemonics**: Creative memory aids in Spanish

## 📱 Admin Panel Patterns

### Authentication Flow
```typescript
// Protected routes pattern
import { useAuth } from '../hooks/useAuth'

const ProtectedComponent = () => {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/admin/login" />
  
  return <AdminContent />
}
```

### Admin Components
- Use consistent admin layout with sidebar navigation
- Include proper error handling and loading states
- Implement optimistic updates for better UX

## 🎯 Coding Guidelines

### TypeScript Best Practices
- Define interfaces for all props and data structures
- Use proper typing for Supabase operations
- Avoid `any` types - use proper type definitions

### React Patterns
- Functional components with hooks
- Custom hooks for reusable logic
- Context API for global state (AIModalContext)
- Proper error boundaries

### Styling Guidelines
```css
/* Use Tailwind utility classes */
.card-base { @apply bg-white rounded-lg shadow-lg p-6; }
.button-primary { @apply bg-brand-main text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90; }
.input-base { @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main; }

/* Responsive design patterns */
.container-responsive { @apply container mx-auto p-4 md:p-8; }
.grid-responsive { @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6; }
```

### File Organization
```
src/
├── components/         # Reusable UI components
├── pages/             # Route components
├── contexts/          # React Context providers
├── hooks/             # Custom React hooks
├── lib/               # External service integrations
├── constants/         # Shared constants and config
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## 🌐 Internationalization

### Spanish Content Guidelines
- All user-facing text in Spanish
- Professional psychology terminology
- Puerto Rican cultural references when appropriate
- Error messages in Spanish with clear instructions

### Content Examples
```typescript
// Button labels
"Generar Pregunta" // Generate Question
"Caso Clínico" // Clinical Case  
"Explicación Sencilla" // Simple Explanation
"Crear Mnemotecnia" // Create Mnemonic

// Error messages
"Error al guardar los datos. Intenta de nuevo." // Error saving data
"No se pudo conectar con el servidor." // Could not connect to server
```

## 🚀 Development Workflow

### Environment Setup
```env
# Required environment variables
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url  
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Testing Patterns
- Test API integrations with proper error handling
- Verify Spanish content in all user-facing components
- Ensure responsive design across devices
- Test admin authentication flows

### Performance Considerations
- Lazy load admin routes
- Optimize Supabase queries with proper indexing
- Use React.memo for expensive chart components
- Implement proper loading states

## 📋 Common Prompt Patterns

### When Adding New Features
```
Following the existing AIModal pattern in this React psychology app, create a new [feature] that:
- Uses Spanish language for UI text
- Integrates with Supabase for data persistence
- Follows the established color scheme from EXAM_COLORS
- Includes proper TypeScript interfaces
- Handles errors gracefully with user-friendly messages
```

### When Working with Database
```
Based on the existing Supabase integration patterns, create a new [database operation] that:
- Respects Row Level Security policies
- Includes proper error handling
- Uses TypeScript interfaces from src/lib/supabase.ts
- Follows the existing async/await patterns
```

### When Styling Components
```
Using the Tailwind classes and brand colors defined in this psychology study app:
- Apply the professional color scheme (olive greens, warm browns)
- Ensure mobile-responsive design
- Follow the existing component patterns
- Use Spanish labels and content
```

## 🔧 Debugging & Troubleshooting

### Common Issues
- **Supabase RLS**: Ensure proper authentication for admin operations
- **Environment Variables**: Verify VITE_ prefix for client-side access
- **Color Classes**: Use arbitrary values `bg-[#808670]` for custom colors
- **Spanish Content**: Always verify AI-generated content is in Spanish

### Development Tools
- Use TypeScript strict mode for better type checking
- Enable ESLint for code quality
- Use browser dev tools for Supabase debugging
- Test admin flows with different user roles

## 📚 Key Files for Context

When working with AI assistants, reference these files for project understanding:
- `src/constants/colors.ts` - Color system and design tokens
- `src/contexts/AIModalContext.tsx` - AI integration patterns
- `src/lib/supabase.ts` - Database integration patterns
- `database/database-setup.sql` - Database schema and sample data
- `src/pages/admin/SectionManager.tsx` - Admin CRUD patterns
- This instructions file - Overall project context

## 🎯 Success Criteria

Generated code should:
✅ Use TypeScript with proper interfaces
✅ Follow React functional component patterns  
✅ Include Spanish language content
✅ Use the established color system
✅ Handle errors gracefully
✅ Be responsive and accessible
✅ Follow existing file organization
✅ Include proper documentation