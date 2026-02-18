
import React from 'react';
import type { Page } from '../types';
import HomeIcon from './icons/HomeIcon';
import MatrixIcon from './icons/MatrixIcon';
import QuizIcon from './icons/QuizIcon';
import StudentsIcon from './icons/StudentsIcon';
import GamesIcon from './icons/GamesIcon';
import FormBuilderIcon from './icons/FormBuilderIcon';
import AIGraderIcon from './icons/AIGraderIcon';
import MapIcon from './icons/MapIcon';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NavItem: React.FC<{
  page: Page;
  label: string;
  icon: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}> = ({ page, label, icon, currentPage, onNavigate }) => {
  const isActive = currentPage === page;
  return (
    <button
      onClick={() => onNavigate(page)}
      className={`relative flex items-center w-full px-4 py-3 text-left transition-all duration-300 rounded-lg group ${isActive
        ? 'bg-white/10 text-white shadow-lg'
        : 'text-indigo-200 hover:bg-white/5 hover:text-white'
        }`}
    >
      {isActive && <span className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></span>}
      {icon}
      <span className="ml-4 font-medium tracking-wide">{label}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps & { isOpen: boolean; onClose: () => void }> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-30
        w-72 h-full flex flex-col p-4 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} style={{ backgroundColor: 'var(--sidebar-bg)' }}>

        <div className="flex items-center justify-between mb-10 px-2 pt-4">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white ml-4 uppercase tracking-tight">Geography Thai</h1>
          </div>
          <button onClick={onClose} className="md:hidden text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
          <NavItem
            page="dashboard"
            label="Bảng điều khiển"
            icon={<HomeIcon />}
            currentPage={currentPage}
            onNavigate={(p) => { onNavigate(p); onClose(); }}
          />
          <NavItem
            page="matrix-creator"
            label="Tạo Ma Trận Đề"
            icon={<MatrixIcon />}
            currentPage={currentPage}
            onNavigate={(p) => { onNavigate(p); onClose(); }}
          />
          <NavItem
            page="exam-generator"
            label="Tạo Đề Thi AI"
            icon={<QuizIcon />}
            currentPage={currentPage}
            onNavigate={(p) => { onNavigate(p); onClose(); }}
          />
          <NavItem
            page="ai-grader"
            label="Chấm điểm AI"
            icon={<AIGraderIcon />}
            currentPage={currentPage}
            onNavigate={(p) => { onNavigate(p); onClose(); }}
          />
          <NavItem
            page="classroom-management"
            label="Quản Lý Lớp Học"
            icon={<StudentsIcon />}
            currentPage={currentPage}
            onNavigate={(p) => { onNavigate(p); onClose(); }}
          />
          <NavItem
            page="student-zone"
            label="Góc Học Sinh"
            icon={<GamesIcon />}
            currentPage={currentPage}
            onNavigate={(p) => { onNavigate(p); onClose(); }}
          />
          <NavItem
            page="form-builder"
            label="Thư viện Prompt"
            icon={<FormBuilderIcon />}
            currentPage={currentPage}
            onNavigate={(p) => { onNavigate(p); onClose(); }}
          />
          <NavItem
            page="map-tool"
            label="Bản đồ Địa Lý"
            icon={<MapIcon />}
            currentPage={currentPage}
            onNavigate={(p) => { onNavigate(p); onClose(); }}
          />
        </nav>

        <div className="mt-auto p-5 bg-white/5 rounded-lg text-center backdrop-blur-sm">
          <h3 className="font-bold text-white">Nâng cấp Pro</h3>
          <p className="text-sm text-indigo-200 mt-1 mb-4">Mở khóa tất cả tính năng và tiềm năng giảng dạy của bạn.</p>
          <button className="w-full bg-indigo-500 text-white py-2.5 rounded-lg hover:bg-indigo-400 transition-all duration-200 shadow-lg hover:shadow-indigo-500/50 font-semibold ring-1 ring-white/10">Nâng cấp ngay</button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;