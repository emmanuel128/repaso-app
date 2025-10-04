import React from 'react';

const IntroSection: React.FC = () => {
  return (
    <section className="mb-12 text-center bg-brand-bg p-6 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-brand-rust mb-2">
        ¡Hola, futuro colega!
      </h2>
      <p className="text-brand-dark max-w-3xl mx-auto">
        Soy <strong className="text-brand-accent-1">Alexandra Olivencia Torres</strong>, 
        Psicóloga Licenciada y tu guía en este camino hacia la reválida. He creado esta 
        herramienta interactiva para acompañarte y facilitar tu proceso de estudio. 
        ¡Vamos a lograrlo juntos!
      </p>
    </section>
  );
};

export default IntroSection;