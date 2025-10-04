import React, { createContext, useContext, useState, ReactNode } from 'react';
import { marked } from 'marked';

interface AIModalState {
  isOpen: boolean;
  loading: boolean;
  modalTitle: string;
  questionContent: string;
  answerContent: string;
  showAnswer: boolean;
}

interface AIModalContextType {
  modalState: AIModalState;
  openModal: (type: string, section: string, topics: string) => void;
  closeModal: () => void;
  revealAnswer: () => void;
}

const AIModalContext = createContext<AIModalContextType | undefined>(undefined);

export const useAIModal = () => {
  const context = useContext(AIModalContext);
  if (!context) {
    throw new Error('useAIModal must be used within an AIModalProvider');
  }
  return context;
};

interface AIModalProviderProps {
  children: ReactNode;
}

export const AIModalProvider: React.FC<AIModalProviderProps> = ({ children }) => {
  const [modalState, setModalState] = useState<AIModalState>({
    isOpen: false,
    loading: false,
    modalTitle: 'Práctica Generada por IA',
    questionContent: '',
    answerContent: '',
    showAnswer: false,
  });

  const apiKey = "***REMOVED_API_KEY***";

  const systemPrompts = {
    question: "Actúas como un experto creador de preguntas para el examen de reválida de psicología en Puerto Rico, siguiendo el estilo del manual de la Junta Examinadora. Eres preciso, claro y enfocado en la aplicación del conocimiento.",
    case: "Actúas como un supervisor clínico de psicología en Puerto Rico. Creas viñetas clínicas realistas y culturalmente relevantes para entrenar a futuros psicólogos.",
    explain: "Actúas como un tutor de psicología amigable y paciente, experto en simplificar conceptos complejos. Usas analogías y lenguaje sencillo y claro.",
    mnemonic: "Eres un creativo experto en técnicas de memorización. Tu especialidad es crear mnemotecnias efectivas y memorables en español."
  };

  const userPrompts = {
    question: (section: string, topics: string) => 
      `Basado en los siguientes temas del área de '${section}': ${topics}. Genera UNA pregunta de práctica de selección múltiple. La pregunta debe ser un escenario o requerir la aplicación de conocimiento. Después del enunciado de la pregunta, presenta cuatro opciones de respuesta etiquetadas como a, b, c, y d. Importante: Cada opción de respuesta debe estar en una nueva línea para facilitar la lectura. Después de las cuatro opciones, incluye el delimitador '---RESPUESTA---'. Finalmente, provee la letra de la respuesta correcta y una explicación concisa y clara de por qué es correcta y por qué las otras son incorrectas.`,
    
    case: (section: string, topics: string) => 
      `Crea un breve caso de estudio (viñeta clínica) relevante al área de '${section}' y los temas: ${topics}. El caso debe involucrar a un paciente ficticio y presentar un dilema o una pregunta diagnóstica/ética/de tratamiento. Incluye detalles socioculturales de Puerto Rico. Después del caso, plantea una pregunta clara para el estudiante. Luego, incluye el delimitador '---RESPUESTA---'. Finalmente, provee una discusión detallada de cómo un psicólogo licenciado abordaría la pregunta, aplicando los conceptos relevantes.`,
    
    explain: (section: string, topics: string) => 
      `Explica los siguientes conceptos del área '${section}' como si yo fuera un principiante: ${topics}. Usa un lenguaje muy sencillo, viñetas (bullet points) y analogías para que sea fácil de entender. Formatea la respuesta en Markdown.`,
    
    mnemonic: (section: string, topics: string) => 
      `Crea una mnemotecnia original y útil en español para recordar los siguientes conceptos clave del área '${section}': ${topics}. Presenta la mnemotecnia en negrita y luego explica brevemente cómo funciona cada parte. Formatea la respuesta en Markdown.`
  };

  const titles = {
    question: (section: string) => `Pregunta: ${section}`,
    case: (section: string) => `Caso Clínico: ${section}`,
    explain: (section: string) => `Explicación Sencilla: ${section}`,
    mnemonic: (section: string) => `Mnemotecnia: ${section}`
  };

  const fetchWithExponentialBackoff = async (apiUrl: string, payload: any, retries = 5, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`API Error Response: ${errorBody}`);
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`, error);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          throw error;
        }
      }
    }
  };

  const openModal = async (type: string, section: string, topics: string) => {
    setModalState(prev => ({
      ...prev,
      isOpen: true,
      loading: true,
      modalTitle: titles[type as keyof typeof titles](section),
      questionContent: '',
      answerContent: '',
      showAnswer: false,
    }));

    try {
      const payload = {
        contents: [{
          parts: [{ text: userPrompts[type as keyof typeof userPrompts](section, topics) }]
        }],
        systemInstruction: {
          parts: [{ text: systemPrompts[type as keyof typeof systemPrompts] }]
        }
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const result = await fetchWithExponentialBackoff(apiUrl, payload);
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar contenido. Inténtalo de nuevo.";

      if (type === 'question' || type === 'case') {
        const parts = text.split(/---RESPUESTA---/i);
        setModalState(prev => ({
          ...prev,
          loading: false,
          questionContent: marked.parse(parts[0] || '') as string,
          answerContent: marked.parse(parts[1] || '') as string,
        }));
      } else {
        setModalState(prev => ({
          ...prev,
          loading: false,
          questionContent: marked.parse(text) as string,
          answerContent: '',
        }));
      }
    } catch (error) {
      console.error("Error fetching from Gemini API:", error);
      setModalState(prev => ({
        ...prev,
        loading: false,
        questionContent: '<p class="text-red-500">Hubo un error al generar el contenido. Por favor, intenta de nuevo más tarde.</p>',
        answerContent: '',
      }));
    }
  };

  const closeModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
      questionContent: '',
      answerContent: '',
      showAnswer: false,
    }));
  };

  const revealAnswer = () => {
    setModalState(prev => ({
      ...prev,
      showAnswer: !prev.showAnswer,
    }));
  };

  return (
    <AIModalContext.Provider value={{ modalState, openModal, closeModal, revealAnswer }}>
      {children}
    </AIModalContext.Provider>
  );
};