import React, { useState, useEffect } from 'react';

interface SaveMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName: string;
}

const SaveMatrixModal: React.FC<SaveMatrixModalProps> = ({ isOpen, onClose, onSave, defaultName }) => {
  const [matrixName, setMatrixName] = useState(defaultName);

  useEffect(() => {
    if (isOpen) {
        setMatrixName(defaultName);
    }
  }, [defaultName, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSaveClick = () => {
    if (matrixName.trim()) {
      onSave(matrixName.trim());
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveClick();
    }
  }

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Lưu Ma Trận</h2>
        <p className="text-gray-600 mb-4">Nhập tên cho ma trận của bạn để dễ dàng nhận biết và tái sử dụng.</p>
        
        <div>
          <label htmlFor="matrixName" className="block text-sm font-medium text-gray-700">Tên ma trận</label>
          <input
            type="text"
            id="matrixName"
            value={matrixName}
            onChange={(e) => setMatrixName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            autoFocus
          />
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            Hủy
          </button>
          <button
            onClick={handleSaveClick}
            type="button"
            disabled={!matrixName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveMatrixModal;