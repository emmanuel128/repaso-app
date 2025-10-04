# Repaso App

A study and review app built with React, TypeScript, and Tailwind CSS for psychology exam preparation in Puerto Rico.

## Features
- **AI-Powered Study Tools**: Question generation, case studies, explanations, and mnemonics
- **Interactive Study Sections**: Organized psychology topics with visual cards
- **Exam Weights Chart**: Visual representation of exam section importance
- **Responsive Design**: Works on desktop and mobile devices
- **Spanish Language Support**: Tailored for Puerto Rico psychology students

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Google Gemini API key (for AI features)

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/emmanuel128/repaso-app.git
cd repaso-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit the `.env` file and add your Google Gemini API key:
```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**🔑 How to get a Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

**⚠️ Security Note:** 
- Never commit your `.env` file to version control
- Keep your API key private and secure
- The `.env` file is already included in `.gitignore`

### 4. Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure
```
repaso-app/
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── README.md             # Project documentation
├── INSTRUCTIONS.md       # Detailed development guide
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
├── context/              # HTML context files
├── src/
│   ├── components/       # React components
│   │   ├── AIModal.tsx   # AI-powered modal
│   │   ├── ExamWeightsChart.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── IntroSection.tsx
│   │   ├── StudySection.tsx
│   │   └── StudySectionCard.tsx
│   ├── contexts/         # React contexts
│   │   └── AIModalContext.tsx  # AI modal state management
│   ├── data/            # Data configuration
│   │   └── studySections.ts    # Study sections data
│   ├── App.tsx          # Main app component
│   ├── index.css        # Global styles
│   └── main.tsx         # App entry point
└── public/              # Static assets (if any)
```

## Tech Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Charts**: Chart.js + react-chartjs-2
- **AI Integration**: Google Gemini API
- **Markdown**: Marked.js for content rendering
- **Icons**: Lucide React

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_GEMINI_API_KEY`: Your Gemini API key
3. Deploy automatically on push to main branch

### Deploy to Netlify
1. Build: `npm run build`
2. Upload `dist/` folder
3. Set environment variables in Netlify dashboard

## Troubleshooting

### Common Issues

**API Key Not Working:**
- Verify API key is set in `.env` file
- Check API key permissions in Google AI Studio
- Ensure key format is correct (starts with `AIza`)

**Build Errors:**
- Run `npm run lint` to check for errors
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (v16+ required)

**Environment Variables Not Loading:**
- Restart development server after changing `.env`
- Ensure variable name starts with `VITE_`
- Check that `.env` file is in project root

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run linting: `npm run lint`
5. Commit: `git commit -m "Description"`
6. Push: `git push origin feature-name`
7. Submit a pull request

For detailed development guidelines, see [INSTRUCTIONS.md](./INSTRUCTIONS.md)

## License
MIT
