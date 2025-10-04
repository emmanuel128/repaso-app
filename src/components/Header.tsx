import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold text-brand-main mb-2">
        Guía Interactiva para la Reválida
      </h1>
      <p className="text-lg md:text-xl text-brand-dark">
        Una herramienta de estudio diseñada para futuros psicólogos en Puerto Rico.
      </p>
    </header>
  );
};

export default Header;