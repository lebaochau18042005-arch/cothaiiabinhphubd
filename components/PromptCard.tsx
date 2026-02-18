import React, { useState } from 'react';

interface PromptCardProps {
  title: string;
  description: string;
  promptText: string;
}

const PromptCard: React.FC<PromptCardProps> = ({ title, description, promptText }) => {
  const [copyStatus, setCopyStatus] = useState('Sao chép');

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText).then(() => {
      setCopyStatus('Đã sao chép!');
      setTimeout(() => setCopyStatus('Sao chép'), 2000);
    }, (err) => {
      console.error('Could not copy text: ', err);
      setCopyStatus('Lỗi!');
      setTimeout(() => setCopyStatus('Sao chép'), 2000);
    });
  };

  return (
    <div className="card p-6 flex flex-col h-full">
      <h4 className="text-lg font-bold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-600 mt-2 flex-grow">{description}</p>
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm text-gray-700 overflow-x-auto">
        <code>{promptText}</code>
      </div>
      <button
        onClick={handleCopy}
        className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {copyStatus}
      </button>
    </div>
  );
};

export default PromptCard;