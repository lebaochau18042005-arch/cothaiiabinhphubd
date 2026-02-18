
import React from 'react';
import type { Page } from '../types';
import MatrixIcon from '../components/icons/MatrixIcon';
import QuizIcon from '../components/icons/QuizIcon';
import StudentsIcon from '../components/icons/StudentsIcon';
import GamesIcon from '../components/icons/GamesIcon';
import AIGraderIcon from '../components/icons/AIGraderIcon';
import FormBuilderIcon from '../components/icons/FormBuilderIcon';


interface DashboardProps {
    onNavigate: (page: Page) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="card flex items-center p-5">
        <div className="p-3 bg-indigo-100 rounded-full">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);


const ActionCard: React.FC<{ title: string; description: string; icon: React.ReactNode; page: Page; onNavigate: (page: Page) => void;}> = ({ title, description, icon, page, onNavigate }) => (
    <button onClick={() => onNavigate(page)} className="card text-left w-full h-full p-6">
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
        </div>
    </button>
);

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900">Chào mừng trở lại, Cô Thái!</h1>
        <p className="mt-2 text-gray-600 text-lg">Đây là tổng quan nhanh về hoạt động giảng dạy của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Lớp học" value="4" icon={<StudentsIcon className="text-indigo-600"/>} />
        <StatCard title="Học sinh" value="120" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatCard title="Đề thi đã tạo" value="8" icon={<QuizIcon className="text-blue-600"/>} />
        <StatCard title="Tỉ lệ hoàn thành" value="85%" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

       <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Bắt đầu nhanh</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionCard 
                title="Tạo Ma Trận Đề Thi" 
                description="Thiết kế cấu trúc đề thi theo chuẩn CV 7791."
                icon={<MatrixIcon />}
                page="matrix-creator"
                onNavigate={onNavigate}
            />
            <ActionCard 
                title="Soạn Đề Thi với AI" 
                description="Tự động tạo câu hỏi từ ma trận đã có."
                icon={<QuizIcon />}
                page="exam-generator"
                onNavigate={onNavigate}
            />
             <ActionCard 
                title="Chấm điểm AI" 
                description="Chấm câu trả lời tự luận và đưa ra phản hồi chi tiết."
                icon={<AIGraderIcon />}
                page="ai-grader"
                onNavigate={onNavigate}
            />
            <ActionCard 
                title="Quản Lý Lớp Học" 
                description="Theo dõi tiến độ, điểm số của học sinh."
                icon={<StudentsIcon />}
                page="classroom-management"
                onNavigate={onNavigate}
            />
            <ActionCard 
                title="Góc Học Sinh" 
                description="Khám phá các trò chơi và bài kiểm tra tương tác."
                icon={<GamesIcon />}
                page="student-zone"
                onNavigate={onNavigate}
            />
            <ActionCard 
                title="Thư viện Prompt" 
                description="Lấy ý tưởng và câu lệnh cho các công cụ AI khác."
                icon={<FormBuilderIcon />}
                page="form-builder"
                onNavigate={onNavigate}
            />
         </div>
       </div>
    </div>
  );
};

export default Dashboard;