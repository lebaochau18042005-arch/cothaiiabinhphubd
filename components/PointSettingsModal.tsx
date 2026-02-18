import React, { useState, useEffect } from 'react';
import type { PointSettings, QuestionFormat, CognitiveLevel } from '../types';

interface PointSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: PointSettings) => void;
  initialSettings: PointSettings;
}

const questionFormatKeys: QuestionFormat[] = ['multiple_choice', 'true_false', 'short_answer', 'essay'];
const cognitiveLevelKeys: CognitiveLevel[] = ['knowledge', 'comprehension', 'application'];

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

const PointSettingsModal: React.FC<PointSettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings }) => {
  const [settings, setSettings] = useState<PointSettings>(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings, isOpen]);

  if (!isOpen) return null;

  const handlePointChange = (format: QuestionFormat, level: CognitiveLevel, value: string) => {
    const pointValue = parseFloat(value);
    if (!isNaN(pointValue)) {
      setSettings(prev => ({
        ...prev,
        [format]: {
          ...prev[format],
          [level]: pointValue
        }
      }));
    }
  };

  const handleSaveClick = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Cài đặt Thang điểm</h2>
          <p className="text-gray-500 mt-1">Điều chỉnh điểm cho từng loại câu hỏi và mức độ nhận thức.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
            <table className="min-w-full border-collapse">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-3 border text-left font-semibold text-sm">Dạng câu hỏi</th>
                        {cognitiveLevelKeys.map(level => (
                             <th key={level} className="p-3 border text-center font-semibold text-sm">{levelNames[level]}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {questionFormatKeys.map(format => (
                        <tr key={format}>
                            <td className="p-3 border font-medium">{questionTypeNames[format]}</td>
                            {cognitiveLevelKeys.map(level => (
                                <td key={level} className="p-2 border">
                                    <input
                                        type="number"
                                        step="0.05"
                                        min="0"
                                        value={settings[format]?.[level] || 0}
                                        onChange={e => handlePointChange(format, level, e.target.value)}
                                        className="w-full text-center border-gray-300 rounded-md shadow-sm p-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="p-6 border-t flex justify-end items-center bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 mr-3">Hủy</button>
          <button onClick={handleSaveClick} type="button" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointSettingsModal;