import React from 'react';
import type { SavedQuizQuestion } from '../types';

interface SavedQuestionsListProps {
  questions: SavedQuizQuestion[];
  onRemove: (questionText: string) => void;
  onClearAll: () => void;
}

const SavedQuestionItem: React.FC<{
  item: SavedQuizQuestion;
  index: number;
  onRemove: (questionText: string) => void;
}> = ({ item, index, onRemove }) => {
  
  const getOptionClass = (option: string) => {
    const isCorrect = option === item.correct_answer;
    const isUserChoice = option === item.userAnswer;

    if (isCorrect) {
      return 'bg-green-100 border-green-300 text-green-800 font-semibold';
    }
    if (isUserChoice) { // and not correct
      return 'bg-red-100 border-red-300 text-red-800';
    }
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <li className="bg-white p-4 rounded-lg border border-gray-200 transition-shadow hover:shadow-md">
      <div className="flex justify-between items-start">
        <p className="font-semibold text-gray-800 pr-4">{`${index + 1}. ${item.question}`}</p>
        <button 
          onClick={() => onRemove(item.question)}
          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
          aria-label="Xóa câu hỏi này"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {item.options.map((option, i) => (
          <li key={i} className={`p-2 border rounded-md text-sm ${getOptionClass(option)}`}>
            {String.fromCharCode(65 + i)}. {option}
          </li>
        ))}
      </ul>
    </li>
  );
};


const SavedQuestionsList: React.FC<SavedQuestionsListProps> = ({ questions, onRemove, onClearAll }) => {
    if (questions.length === 0) {
        return null;
    }

    // Create a reversed copy to avoid mutating the original prop array
    const reversedQuestions = [...questions].reverse();

    return (
        <div className="mt-6 space-y-4">
             <div className="text-right">
                <button 
                    onClick={onClearAll}
                    className="px-4 py-2 text-sm bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors"
                >
                    Xóa tất cả
                </button>
            </div>
            <ul className="space-y-4">
                {reversedQuestions.map((q, index) => (
                    <SavedQuestionItem key={q.question} item={q} index={questions.length - 1 - index} onRemove={onRemove} />
                ))}
            </ul>
        </div>
    );
};

export default SavedQuestionsList;