# Constants

This folder contains shared constants used across the Repaso App.

## Colors (`colors.ts`)

Centralized color management for consistent theming throughout the application.

### Usage Examples

#### In React Components (Admin)
```typescript
import { COLOR_OPTIONS, EXAM_COLORS } from '../constants/colors'

// Use in color picker
const colorOptions = COLOR_OPTIONS

// Use default color
const defaultColor = EXAM_COLORS.default.tailwind // 'bg-[#808670]'
```

#### In Chart.js Components
```typescript
import { EXAM_COLORS } from '../constants/colors'

// Use hex colors for charts
backgroundColor: EXAM_COLORS.hex
```

#### Helper Functions
```typescript
import { getColorByIndex, getRandomColor } from '../constants/colors'

// Get color by index (cycles through palette)
const color = getColorByIndex(2) // { hex: '#BF8A64', tailwind: 'bg-[#BF8A64]' }

// Get random color
const randomColor = getRandomColor() // Returns random color from palette
```

### Color Palette

The app uses a consistent 8-color palette derived from the exam weights chart:

| Color | Hex | Usage |
|-------|-----|--------|
| Olive Green | `#808670` | Primary/Default |
| Light Olive | `#A0AB89` | Secondary |
| Warm Brown | `#BF8A64` | Accent |
| Orange Brown | `#BD612A` | Emphasis |
| Golden Orange | `#E89B40` | Highlight |
| Light Peach | `#E6B883` | Soft |
| Cream | `#F0E1D1` | Light |
| Light Gray | `#d1d5db` | Neutral |

### Adding New Colors

To add new colors to the palette:

1. Add hex value to `EXAM_COLORS.hex` array
2. Add corresponding Tailwind class to `EXAM_COLORS.tailwind` array
3. Update `SECTION_LABELS` if needed
4. Colors will automatically be available in all components

### Benefits

- ✅ **Consistency** - Same colors across all components
- ✅ **Maintainability** - Change colors in one place
- ✅ **Type Safety** - TypeScript support for color constants
- ✅ **Flexibility** - Support for both hex and Tailwind formats
- ✅ **Helper Functions** - Easy color selection utilities