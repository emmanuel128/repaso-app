import React from 'react';
import Header from './components/Header';
import IntroSection from './components/IntroSection';
import ExamWeightsChart from './components/ExamWeightsChart';
import StudySection from './components/StudySection';
import Footer from './components/Footer';
import AIModal from './components/AIModal';
import { AIModalProvider } from './contexts/AIModalContext';

const App: React.FC = () => {
  return (
    <AIModalProvider>
      <div className="text-brand-dark">
        <div className="container mx-auto p-4 md:p-8">
          <Header />
          <IntroSection />
          <ExamWeightsChart />
          
          <main className="space-y-16">
            <StudySection />
          </main>
          
          <Footer />
        </div>
        <AIModal />
      </div>
    </AIModalProvider>
  );
};

export default App;