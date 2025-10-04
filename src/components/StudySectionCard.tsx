import React from 'react';
import { StudySectionData } from '../data/studySections';
import { useGeminiModal } from '../contexts/GeminiModalContext';

interface StudySectionCardProps {
  section: StudySectionData;
}

const StudySectionCard: React.FC<StudySectionCardProps> = ({ section }) => {
  const { openModal } = useGeminiModal();

  const handleButtonClick = (
    type: string,
    sectionName: string,
    topics: string
  ) => {
    openModal(type, sectionName, topics);
  };

  return (
    <section>
      <div className="flex items-center mb-6">
        <div className="bg-brand-rust text-white rounded-full h-12 w-12 flex-shrink-0 flex items-center justify-center text-2xl font-bold mr-4 shadow-lg">
          {section.id}
        </div>
        <div>
          <h2 className="text-3xl font-bold text-brand-main">{section.title}</h2>
          <p className="text-xl font-semibold text-brand-dark">{section.subtitle}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {section.cards.map((card, index) => (
          <div key={index} className="card">
            <h3 className="font-bold text-center text-lg text-brand-dark mb-2">
              {card.title}
            </h3>
            <div 
              className="text-sm" 
              dangerouslySetInnerHTML={{ 
                __html: card.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br>')
              }} 
            />
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
        {section.buttons.map((button, index) => (
          <button
            key={index}
            className={`gemini-button w-full sm:w-auto ${button.bgColor} ${button.textColor} font-bold py-2 px-4 rounded-lg`}
            onClick={() => handleButtonClick(button.type, button.section, button.topics)}
          >
            {button.label}
          </button>
        ))}
      </div>
    </section>
  );
};

export default StudySectionCard;