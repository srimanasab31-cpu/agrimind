import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import ChatAssistant from './pages/ChatAssistant';
import DiseaseDetection from './pages/DiseaseDetection';
import KnowledgeBase from './pages/KnowledgeBase';
import Weather from './pages/Weather';
import ErrorBoundary from './components/ErrorBoundary';

import TestLab from './pages/TestLab';
import HowItWorks from './pages/HowItWorks';
import SustainableGuide from './pages/SustainableGuide';
import QueryHistory from './pages/QueryHistory';
import ModelEvaluation from './pages/ModelEvaluation';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<ChatAssistant />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route 
            path="/crop-health" 
            element={
              <ErrorBoundary fallbackTitle="Crop Health Module Error">
                <DiseaseDetection />
              </ErrorBoundary>
            } 
          />
          <Route 
            path="/crop-health/tamil" 
            element={
              <ErrorBoundary fallbackTitle="Crop Health Module Error">
                <DiseaseDetection defaultLang="ta" />
              </ErrorBoundary>
            } 
          />
          <Route 
            path="/disease" 
            element={
              <ErrorBoundary fallbackTitle="Crop Health Module Error">
                <DiseaseDetection />
              </ErrorBoundary>
            } 
          />
          <Route 
            path="/disease/tamil" 
            element={
              <ErrorBoundary fallbackTitle="Crop Health Module Error">
                <DiseaseDetection defaultLang="ta" />
              </ErrorBoundary>
            } 
          />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/test-lab" element={<TestLab />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/sustainable" element={<SustainableGuide />} />
          <Route path="/history" element={<QueryHistory />} />
          <Route path="/evaluation" element={<ModelEvaluation />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
