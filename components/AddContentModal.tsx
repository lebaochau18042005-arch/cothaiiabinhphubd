import React, { useState, useEffect, useMemo } from 'react';
import { curriculumData } from '../data/curriculum';
import CompetencySelector from './CompetencySelector';
import type { PointSettings, QuestionFormat, CognitiveLevel, CompetencyCode } from '../types';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    topic: string;
    content: string;
    format: QuestionFormat;
    level: CognitiveLevel;
    competencyCodes: CompetencyCode[];
    count: number;
  }) => void;
  currentPointSettings: PointSettings;
  grade: '10' | '11' | '12';
}

type ModalView = 'form' | 'picker';

const levelNames: Record<CognitiveLevel, string> = {
    knowledge: "Nhận biết",
    comprehension: "Thông hiểu",
    application: "Vận dụng",
};
  
const questionTypeNames: Record<QuestionFormat, string> = {
    multiple_choice: "Nhiều lựa chọn",
    true_false: "Đúng - Sai",
    short_answer: "Trả lời ngắn",
    essay: "Tự luận"
};

const AddContentModal: React.FC<AddContentModalProps> = ({ isOpen, onClose, onAdd, currentPointSettings, grade }) => {
  const [view, setView] = useState<ModalView>('form');
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<QuestionFormat>('multiple_choice');
  const [level, setLevel] = useState<CognitiveLevel>('knowledge');
  const [competencyCodes, setCompetencyCodes] = useState<CompetencyCode[]>(['NL1']);
  const [count, setCount] = useState<number | ''>(1);
  const [pointsPerQuestion, setPointsPerQuestion] = useState<number>(0.25);
  const [searchTerm, setSearchTerm] = useState('');

  const gradeCurriculum = useMemo(() => 
    curriculumData.find(c => c.grade === grade),
    [grade]
  );
  
  const filteredChapters = useMemo(() => {
      if (!gradeCurriculum) return [];
      if (!searchTerm.trim()) return gradeCurriculum.chapters;
      const lowerCaseSearch = searchTerm.toLowerCase();
      return gradeCurriculum.chapters
        .map(chapter => ({
          ...chapter,
          units: chapter.units.filter(unit => unit.name.toLowerCase().includes(lowerCaseSearch))
        }))
        .filter(chapter => chapter.units.length > 0);
  }, [gradeCurriculum, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      // Reset form on open
      setTopic('');
      setContent('');
      setFormat('multiple_choice');
      setLevel('knowledge');
      setCompetencyCodes(['NL1']);
      setCount(1);
      setView('form');
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    // Update point value when format or level changes
    if (currentPointSettings[format] && currentPointSettings[format][level]) {
      setPointsPerQuestion(currentPointSettings[format][level]);
    }
  }, [format, level, currentPointSettings]);

  if (!isOpen) return null;

  const isFormValid = (topic.trim() || content.trim()) && typeof count === 'number' && count > 0 && competencyCodes.length > 0;

  const handleAddClick = () => {
    if (!isFormValid) return;
    onAdd({
      topic,
      content,
      format,
      level,
      competencyCodes,
      count: Number(count),
    });
  };

  const handleUnitSelect = (selectedTopic: string, selectedContent: string) => {
    setTopic(selectedTopic);
    setContent(selectedContent);
    setView('form');
  }

  const renderFormView = () => (
    <>
      <div className="p-6 border-b flex justify-between items-center flex-wrap gap-2">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Thêm nội dung vào Ma trận</h2>
           <p className="text-gray-500 mt-1">Nhập thông tin chi tiết hoặc chọn từ chương trình học.</p>
        </div>
         <button 
            onClick={() => setView('picker')}
            className="inline-flex items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md shadow-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2-2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h4a1 1 0 100-2H7zm0 4a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
            Chọn từ chương trình học
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Chủ đề / Chương</label>
          <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ví dụ: Địa lí các vùng kinh tế Việt Nam" className="w-full border-gray-300 rounded-md shadow-sm bg-gray-50"/>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nội dung / Đơn vị kiến thức</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Ví dụ: Bài 8: Vấn đề khai thác thế mạnh ở Trung du và miền núi Bắc Bộ" rows={2} className="w-full border-gray-300 rounded-md shadow-sm bg-gray-50 resize-y"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mã Năng lực (NL)</label>
            <CompetencySelector
                selected={competencyCodes}
                onChange={setCompetencyCodes}
            />
          </div>
           <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mức độ nhận thức</label>
            <select value={level} onChange={e => setLevel(e.target.value as CognitiveLevel)} className="w-full border-gray-300 rounded-md shadow-sm">
              {Object.entries(levelNames).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Dạng câu hỏi</label>
            <select value={format} onChange={e => setFormat(e.target.value as QuestionFormat)} className="w-full border-gray-300 rounded-md shadow-sm">
              {Object.entries(questionTypeNames).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Số lượng câu</label>
              <input type="number" min="1" value={count} onChange={e => setCount(e.target.value ? parseInt(e.target.value) : '')} className="w-full border-gray-300 rounded-md shadow-sm"/>
            </div>
        </div>
         <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Điểm cho mỗi câu</label>
            <input type="number" value={pointsPerQuestion} disabled className="w-full border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"/>
            <p className="text-xs text-gray-500 mt-1">
            Để thay đổi điểm, hãy dùng nút "Cài đặt thang điểm" ở màn hình chính.
            </p>
        </div>
      </div>
       <div className="p-6 border-t flex justify-end items-center bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 mr-3">Hủy</button>
          <button onClick={handleAddClick} type="button" disabled={!isFormValid} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
            Thêm
          </button>
        </div>
    </>
  );

  const renderPickerView = () => (
    <>
      <div className="p-6 border-b">
        <div className="flex items-center mb-4">
          <button onClick={() => setView('form')} className="p-2 rounded-full hover:bg-gray-100 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Chọn Nội dung/Đơn vị kiến thức (Lớp {grade})</h2>
        </div>
         <input
              type="text"
              placeholder="Tìm kiếm tên bài học..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredChapters.map((chapter, chapterIndex) => (
            <div key={chapterIndex} className="bg-gray-50 rounded-lg border">
              <div className="p-4">
                <h3 className="font-semibold text-gray-700">{chapter.name}</h3>
              </div>
              <div className="border-t border-gray-200 pl-4 pr-4 py-2 space-y-1">
                {chapter.units.map((unit, unitIndex) => (
                  <button 
                    key={unitIndex}
                    onClick={() => handleUnitSelect(chapter.name, unit.name)}
                    className="flex items-center p-2 rounded-md hover:bg-indigo-50 cursor-pointer w-full text-left"
                  >
                    <span className="text-gray-600">{unit.name}</span>
                  </button>
                ))}
              </div>
            </div>
        ))}
        {filteredChapters.length === 0 && (
              <div className="text-center py-10">
                  <p className="text-gray-500">Không tìm thấy bài học nào phù hợp.</p>
              </div>
        )}
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all" onClick={e => e.stopPropagation()}>
        {view === 'form' ? renderFormView() : renderPickerView()}
      </div>
    </div>
  );
};

export default AddContentModal;