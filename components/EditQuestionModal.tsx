import React, { useState, useEffect } from 'react';
import type { ExamQuestion, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion, EssayQuestion } from '../types';

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: ExamQuestion | null;
  onSave: (updatedQuestion: ExamQuestion) => void;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({ isOpen, onClose, question, onSave }) => {
  const [editedQuestion, setEditedQuestion] = useState<ExamQuestion | null>(null);

  useEffect(() => {
    // Deep copy to avoid mutating the original state
    if (question) {
      setEditedQuestion(JSON.parse(JSON.stringify(question)));
    }
  }, [question, isOpen]);

  if (!isOpen || !editedQuestion) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedQuestion(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = () => {
    if (editedQuestion) {
      onSave(editedQuestion);
    }
  };
  
  const renderFields = () => {
    switch (editedQuestion.type) {
      case 'multiple_choice':
        const mcq = editedQuestion as MultipleChoiceQuestion;

        const handleOptionChange = (index: number, value: string) => {
            const newOptions = [...(mcq.options || [])];
            newOptions[index] = value;
            const newCorrectAnswer = mcq.correct_answer === mcq.options[index] ? value : mcq.correct_answer;
            setEditedQuestion({ ...mcq, options: newOptions, correct_answer: newCorrectAnswer });
        };
        
        const handleCorrectAnswerChange = (value: string) => {
            setEditedQuestion({ ...mcq, correct_answer: value });
        };
        
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nội dung câu hỏi</label>
              <textarea name="question" value={mcq.question} onChange={handleTextChange} rows={3} className="mt-1 w-full border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div className="space-y-3 mt-4">
              <label className="block text-sm font-medium text-gray-700">Các lựa chọn & Đáp án đúng</label>
              {(mcq.options || []).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input type="radio" name="correct_answer_radio" checked={option === mcq.correct_answer} onChange={() => handleCorrectAnswerChange(option)} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"/>
                  <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm text-sm"/>
                </div>
              ))}
            </div>
          </>
        );

      case 'true_false':
        const tfq = editedQuestion as TrueFalseQuestion;
        
        const handleStatementTextChange = (index: number, value: string) => {
          const newStatements = JSON.parse(JSON.stringify(tfq.statements || []));
          newStatements[index].text = value;
          setEditedQuestion({ ...tfq, statements: newStatements });
        }
        
        const handleStatementTruthChange = (index: number, isTrue: boolean) => {
           const newStatements = JSON.parse(JSON.stringify(tfq.statements || []));
           newStatements[index].is_true = isTrue;
           setEditedQuestion({ ...tfq, statements: newStatements });
        }

        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Đoạn văn ngữ cảnh</label>
              <textarea name="context" value={tfq.context} onChange={handleTextChange} rows={3} className="mt-1 w-full border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div className="space-y-3 mt-4">
              <label className="block text-sm font-medium text-gray-700">Các nhận định</label>
              {(tfq.statements || []).map((stmt, index) => (
                <div key={stmt.id} className="flex items-center space-x-2">
                   <span className="font-semibold">{stmt.id})</span>
                   <input type="text" value={stmt.text} onChange={(e) => handleStatementTextChange(index, e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm text-sm"/>
                   <select value={String(stmt.is_true)} onChange={(e) => handleStatementTruthChange(index, e.target.value === 'true')} className="border-gray-300 rounded-md shadow-sm text-sm">
                        <option value="true">Đúng</option>
                        <option value="false">Sai</option>
                   </select>
                </div>
              ))}
            </div>
          </>
        );

      case 'short_answer':
        const saq = editedQuestion as ShortAnswerQuestion;
        return (
           <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nội dung câu hỏi</label>
              <textarea name="question" value={saq.question} onChange={handleTextChange} rows={3} className="mt-1 w-full border-gray-300 rounded-md shadow-sm"/>
            </div>
             <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Đáp án đúng</label>
              <input type="text" name="correct_answer" value={saq.correct_answer} onChange={handleTextChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm"/>
            </div>
          </>
        );

      case 'essay':
         const esq = editedQuestion as EssayQuestion;
         return (
            <div>
              <label className="block text-sm font-medium text-gray-700">Nội dung câu hỏi</label>
              <textarea name="question" value={esq.question} onChange={handleTextChange} rows={5} className="mt-1 w-full border-gray-300 rounded-md shadow-sm"/>
            </div>
         );

      default:
        return <p>Loại câu hỏi không được hỗ trợ để chỉnh sửa.</p>;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Chỉnh sửa câu hỏi</h2>
          <p className="text-gray-500 mt-1">Thay đổi nội dung câu hỏi và đáp án.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {renderFields()}
        </div>
         <div className="p-6 border-t flex justify-end items-center bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 mr-3">Hủy</button>
          <button onClick={handleSave} type="button" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditQuestionModal;