import React, { createContext, useContext, useState, ReactNode } from 'react';
import { marked } from 'marked';
import { generateContent, getContentTitle, ContentType, isApiKeyConfigured } from '../lib/gemini';

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

  const openModal = async (type: string, section: string, topics: string) => {
    // Check if API key is configured
    if (!isApiKeyConfigured()) {
      setModalState(prev => ({
        ...prev,
        isOpen: true,
        loading: false,
        modalTitle: 'Error de Configuración',
        questionContent: '<p class="text-red-500">La clave de API de Gemini no está configurada. Contacta al administrador.</p>',
        answerContent: '',
        showAnswer: false,
      }));
      return;
    }

    setModalState(prev => ({
      ...prev,
      isOpen: true,
      loading: true,
      modalTitle: getContentTitle(type as ContentType, section),
      questionContent: '',
      answerContent: '',
      showAnswer: false,
    }));

    try {
      const result = await generateContent(type as ContentType, section, topics);
      
      setModalState(prev => ({
        ...prev,
        loading: false,
        questionContent: marked.parse(result.question) as string,
        answerContent: result.answer ? marked.parse(result.answer) as string : '',
      }));
    } catch (error) {
      console.error("Error generating AI content:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setModalState(prev => ({
        ...prev,
        loading: false,
        questionContent: `<p class="text-red-500">${errorMessage}</p>`,
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