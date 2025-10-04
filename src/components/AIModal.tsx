import React from 'react';
import { X } from 'lucide-react';
import { useAIModal } from '../contexts/AIModalContext';

const AIModal: React.FC = () => {
  const { modalState, closeModal, revealAnswer } = useAIModal();

  if (!modalState.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold text-brand-main">{modalState.modalTitle}</h3>
          <button 
            onClick={closeModal} 
            className="text-gray-500 hover:text-gray-800 text-2xl"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {modalState.loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="loader"></div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <div id="questionArea" dangerouslySetInnerHTML={{ __html: modalState.questionContent }} />
              {modalState.answerContent && (
                <div 
                  id="answerArea" 
                  className={`mt-4 p-4 bg-gray-50 border-l-4 border-brand-main rounded-r-lg ${modalState.showAnswer ? '' : 'hidden'}`}
                  dangerouslySetInnerHTML={{ __html: modalState.answerContent }}
                />
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end gap-4">
          {modalState.answerContent && (
            <button 
              onClick={revealAnswer}
              className="bg-brand-accent-2 text-brand-dark font-bold py-2 px-4 rounded-lg"
            >
              Revelar Respuesta
            </button>
          )}
          <button 
            onClick={closeModal}
            className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIModal;