
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ExamMatrixCreator from './pages/ExamMatrixCreator';
import ExamGenerator from './pages/ExamGenerator';
import ClassroomManagement from './pages/ClassroomManagement';
import StudentZone from './pages/StudentZone';
import FormBuilder from './pages/FormBuilder';
import AIGrader from './pages/AIGrader';
import MapTool from './pages/MapTool';
import type { Page, MatrixData, ExamQuestion } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [generatedExam, setGeneratedExam] = useState<ExamQuestion[] | null>(null);

  // Deep linking logic: Tự động chuyển trang khi có params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    const pinParam = params.get('pin');

    if (pageParam === 'student-zone' || pinParam) {
      setCurrentPage('student-zone');
    }
  }, []);

  const handleNavigate = useCallback((page: Page) => {
    if (currentPage === 'exam-generator' && page !== 'exam-generator') {
      setGeneratedExam(null);
    }
    setCurrentPage(page);
  }, [currentPage]);

  const handleMatrixCreated = (data: MatrixData) => {
    setMatrixData(data);
    setGeneratedExam(null);
    setCurrentPage('exam-generator');
  };

  const handleExamQuickGenerated = (questions: ExamQuestion[], matrix: MatrixData) => {
    setMatrixData(matrix);
    setGeneratedExam(questions);
    setCurrentPage('exam-generator');
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'matrix-creator':
        return <ExamMatrixCreator
          onMatrixCreated={handleMatrixCreated}
          onExamQuickGenerated={handleExamQuickGenerated}
        />;
      case 'exam-generator':
        return <ExamGenerator
          initialMatrix={matrixData}
          initialExam={generatedExam}
        />;
      case 'ai-grader':
        return <AIGrader />;
      case 'classroom-management':
        return <ClassroomManagement />;
      case 'student-zone':
        return <StudentZone />;
      case 'form-builder':
        return <FormBuilder />;
      case 'map-tool':
        return <MapTool />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen text-gray-800">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 md:p-10">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
