import React, { useState, useRef, useEffect } from 'react';
import type { CompetencyCode } from '../types';

const competencyCodes: CompetencyCode[] = ['NL1', 'NL2', 'NL3', 'NL4'];

interface CompetencySelectorProps {
  selected: CompetencyCode[];
  onChange: (selected: CompetencyCode[]) => void;
}

const CompetencySelector: React.FC<CompetencySelectorProps> = ({ selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (code: CompetencyCode) => {
    const newSelected = selected.includes(code)
      ? selected.filter(c => c !== code)
      : [...selected, code];
    onChange(newSelected);
  };

  const displayValue = selected.length > 0 ? selected.join(', ') : 'Chọn năng lực...';

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border-gray-300 rounded-md shadow-sm bg-white px-3 py-2 text-left flex justify-between items-center"
      >
        <span className="text-sm">{displayValue}</span>
        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border rounded-md">
          <ul className="py-1">
            {competencyCodes.map(code => (
              <li key={code} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center">
                <input
                  type="checkbox"
                  checked={selected.includes(code)}
                  onChange={() => handleToggle(code)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="ml-3" onClick={() => handleToggle(code)}>
                  {code}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CompetencySelector;
