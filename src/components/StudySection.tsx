import React from 'react';
import { studySections } from '../data/studySections';
import StudySectionCard from './StudySectionCard';

const StudySection: React.FC = () => {
  return (
    <>
      {studySections.map((section) => (
        <StudySectionCard key={section.id} section={section} />
      ))}
    </>
  );
};

export default StudySection;