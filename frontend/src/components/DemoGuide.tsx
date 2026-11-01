import React, { useState } from 'react';
import { Presentation, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DemoGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: "Submit Question", desc: "Submit a Tamil or English agricultural question in the AI Assistant.", link: "/chat" },
    { title: "NLP Processing", desc: "Show the detected language and extracted crop/symptom information.", link: "/chat" },
    { title: "RAG Retrieval", desc: "Show relevant retrieved document passages acting as evidence.", link: "/knowledge" },
    { title: "Grounded Answer", desc: "Show the generated answer with citations appended below it.", link: "/chat" },
    { title: "Computer Vision", desc: "Upload a crop image and inspect model predictions or honest fallback status.", link: "/disease" },
    { title: "Weather Context", desc: "Check localized weather data (using safe mock data for demo).", link: "/weather" },
    { title: "Recommendations", desc: "Inspect sustainable farming guidance and its limitations.", link: "/chat" },
    { title: "Test Lab Validation", desc: "Open the Test Lab to inspect backend execution results and metrics.", link: "/test-lab" },
  ];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-agrigreen-600 text-white p-4 rounded-full shadow-lg hover:bg-agrigreen-700 transition flex items-center space-x-2 z-50"
      >
        <Presentation className="w-5 h-5" />
        <span className="font-semibold">Faculty Demo Mode</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col max-h-[80vh]">
      <div className="bg-agrigreen-800 p-4 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Presentation className="w-5 h-5" />
          <h3 className="font-bold">Faculty Demo Guide</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-agrigreen-200 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-4 bg-yellow-50 border-b border-yellow-100">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> Some ML models are run in fallback mode to guarantee demonstration stability on standard hardware.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className={`relative flex space-x-3 p-3 rounded-lg border ${currentStep === idx ? 'bg-agrigreen-50 border-agrigreen-200' : 'bg-white border-gray-100'} cursor-pointer hover:bg-gray-50`} onClick={() => setCurrentStep(idx)}>
            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border text-xs flex-shrink-0 ${currentStep > idx ? 'bg-agrigreen-600 border-agrigreen-600 text-white' : currentStep === idx ? 'border-agrigreen-600 text-agrigreen-600 font-bold' : 'border-gray-300 text-gray-400'}`}>
              {currentStep > idx ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
            </div>
            <div>
              <h4 className={`font-semibold text-sm ${currentStep === idx ? 'text-agrigreen-800' : 'text-gray-700'}`}>{step.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
              {currentStep === idx && (
                <Link to={step.link} className="mt-2 inline-flex items-center text-xs text-agrigreen-600 font-semibold hover:underline">
                  Go to page <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t bg-gray-50 flex justify-between">
        <button 
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="text-sm px-3 py-1.5 text-gray-600 disabled:opacity-50"
        >
          Previous
        </button>
        <button 
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="text-sm px-3 py-1.5 bg-agrigreen-600 text-white rounded hover:bg-agrigreen-700 disabled:opacity-50"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}
