import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import IntroSection from './components/IntroSection';
import ExamWeightsChart from './components/ExamWeightsChart';
import StudySection from './components/StudySection';
import Footer from './components/Footer';
import AIModal from './components/AIModal';
import { AIModalProvider } from './contexts/AIModalContext';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

// Main Study App Component
const StudyApp: React.FC = () => (
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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Study App */}
        <Route path="/" element={<StudyApp />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;