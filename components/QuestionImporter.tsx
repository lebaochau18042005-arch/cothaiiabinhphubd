
import { GoogleGenAI } from "@google/genai";
import React, { useState } from 'react';
import type { ExamQuestion, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion } from '../types';

interface QuestionImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: ExamQuestion[]) => void;
}

const QuestionImporter: React.FC<QuestionImporterProps> = ({ isOpen, onClose, onImport }) => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<ExamQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseTextToQuestions = (inputText: string): ExamQuestion[] => {
    const questions: ExamQuestion[] = [];
    const lines = inputText.split('\n').map(l => l.trim()).filter(l => l);
    
    let currentSection: 'MCQ' | 'TF' | 'SHORT' | 'UNKNOWN' = 'UNKNOWN';
    let currentQuestion: any = null;

    // Helper để lưu câu hỏi đang xử lý
    const pushCurrentQuestion = () => {
      if (currentQuestion) {
        // Validate sơ bộ trước khi push
        if (currentQuestion.type === 'multiple_choice') {
            // Nếu chưa tách được options từ text (trường hợp dính liền), thử tách lại
            if ((currentQuestion.options || []).length === 0 && currentQuestion.question) {
                // Logic tách A. B. C. D. nếu nằm cùng dòng câu hỏi hoặc chưa được xử lý
                // Tìm các mẫu A. B. C. D. 
                // Regex này tìm A. theo sau là text, cho đến khi gặp B. hoặc hết dòng
                const parts = currentQuestion.question.split(/([A-D]\.)/g).filter((p: string) => p.trim());
                
                if (parts.length > 1) {
                     // Phần đầu tiên có thể là câu hỏi nếu nó không bắt đầu bằng A.
                     let startIndex = 0;
                     if (!parts[0].match(/^[A-D]\./)) {
                         // Đã có câu hỏi, phần này là đuôi câu hỏi, cập nhật lại
                         currentQuestion.question = parts[0].trim();
                         startIndex = 1;
                     } else {
                         // Câu hỏi rỗng hoặc đã bị cắt, lấy câu hỏi từ context trước đó nếu cần (ở đây giả sử đã set question từ dòng chứa "Câu X:")
                         // Nếu dòng chứa "Câu X:" cũng chứa luôn A. B. C. D. thì question ban đầu đã chứa tất cả.
                         // Cần tách lại.
                         const qMatch = currentQuestion.question.match(/^(Câu\s+\d+:[^A-D]*)/i);
                         if (qMatch) {
                             currentQuestion.question = qMatch[1].trim();
                         }
                     }

                     const extractedOptions = [];
                     for (let i = startIndex; i < parts.length; i += 2) {
                         if (parts[i] && parts[i+1]) {
                             extractedOptions.push(parts[i+1].trim());
                         }
                     }
                     if (extractedOptions.length > 0) {
                         currentQuestion.options = extractedOptions;
                     }
                }
            }
            
            // Fallback: Nếu vẫn không tìm thấy options, thử tìm trong các dòng tiếp theo (đã được xử lý trong loop chính, nhưng đây là check cuối)
            
            // Nếu vẫn không đủ 4 đáp án, thêm placeholder
            if (!currentQuestion.options) currentQuestion.options = [];
            while (currentQuestion.options.length < 4) {
                currentQuestion.options.push("(Chưa xác định nội dung đáp án)");
            }
             // Mặc định đáp án A nếu chưa có
             if (!currentQuestion.correct_answer) currentQuestion.correct_answer = currentQuestion.options[0];
        }
        
        if (currentQuestion.type === 'true_false') {
             // Đảm bảo đủ 4 ý a,b,c,d
             if (!currentQuestion.statements) currentQuestion.statements = [];
             const labels = ['a', 'b', 'c', 'd'];
             labels.forEach(label => {
                 if (!currentQuestion.statements.find((s: any) => s.id === label)) {
                     currentQuestion.statements.push({ id: label, text: "(Chưa xác định ý)", is_true: false });
                 }
             });
             // Sắp xếp lại cho đẹp
             currentQuestion.statements.sort((a: any, b: any) => a.id.localeCompare(b.id));
        }

        questions.push(currentQuestion);
        currentQuestion = null;
      }
    };

    // Regex patterns
    const sectionMcqPattern = /I\.\s*TRẮC NGHIỆM NHIỀU LỰA CHỌN/i;
    const sectionTfPattern = /II\.\s*TRẮC NGHIỆM ĐÚNG/i;
    const sectionShortPattern = /III\.\s*TRẢ LỜI NGẮN/i;
    // Pattern bắt câu hỏi: "Câu 1:", "Câu 1.", "Câu 1 :"
    const questionStartPattern = /^(Câu\s+\d+[:\.])(.*)/i; 
    const optionPattern = /^([A-D])[\.\)](.*)/; // A. hoặc A)
    const statementPattern = /^([a-d])[\.\)](.*)/; // a) hoặc a.

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 1. Xác định phần (Section)
      if (sectionMcqPattern.test(line)) { 
          pushCurrentQuestion();
          currentSection = 'MCQ'; 
          continue; 
      }
      if (sectionTfPattern.test(line)) { 
          pushCurrentQuestion();
          currentSection = 'TF'; 
          continue; 
      }
      if (sectionShortPattern.test(line)) { 
          pushCurrentQuestion();
          currentSection = 'SHORT'; 
          continue; 
      }

      // Bỏ qua các dòng tiêu đề phụ như "1. Nhận biết", "2. Thông hiểu"
      if (/^\d+\.\s*(Nhận biết|Thông hiểu|Vận dụng)/i.test(line)) continue;

      // 2. Phát hiện bắt đầu câu hỏi mới
      const qMatch = line.match(questionStartPattern);
      if (qMatch) {
        pushCurrentQuestion(); // Lưu câu trước đó

        let qText = qMatch[0].trim(); // Lấy toàn bộ dòng "Câu X: ..."
        
        // Nếu là MCQ, kiểm tra xem đáp án có nằm ngay trên dòng này không
        if (currentSection === 'MCQ' || currentSection === 'UNKNOWN') {
            currentQuestion = {
                type: 'multiple_choice',
                question: qText,
                options: [],
                correct_answer: ''
            } as MultipleChoiceQuestion;
            
            const splitOpts = qText.split(/\s(?=[A-D]\.)/);
            if (splitOpts.length > 1) {
                currentQuestion.question = splitOpts[0].trim();
                for (let j = 1; j < splitOpts.length; j++) {
                    const optMatch = splitOpts[j].trim().match(optionPattern);
                    if (optMatch) {
                         currentQuestion.options.push(optMatch[2].trim());
                    }
                }
            }

        } else if (currentSection === 'TF') {
            currentQuestion = {
                type: 'true_false',
                context: qText,
                statements: []
            } as TrueFalseQuestion;
        } else if (currentSection === 'SHORT') {
            currentQuestion = {
                type: 'short_answer',
                question: qText,
                correct_answer: ''
            } as ShortAnswerQuestion;
        }
        continue;
      }

      // 3. Xử lý nội dung chi tiết
      if (currentQuestion) {
        if (currentQuestion.type === 'multiple_choice') {
            const optMatchStart = line.match(optionPattern);
            if (optMatchStart) {
                const splitLine = line.split(/\s+(?=[A-D]\.)/);
                splitLine.forEach(part => {
                    const subMatch = part.trim().match(optionPattern);
                    if (subMatch) {
                        currentQuestion.options.push(subMatch[2].trim());
                    }
                });
            } else {
                if (currentQuestion.options.length === 0) {
                     const midMatch = line.match(/\s(?=[A-D]\.)/);
                     if (midMatch) {
                          const split = line.split(/\s(?=[A-D]\.)/);
                          currentQuestion.question += " " + split[0].trim();
                          for (let k = 1; k < split.length; k++) {
                              const om = split[k].trim().match(optionPattern);
                              if(om) currentQuestion.options.push(om[2].trim());
                          }
                     } else {
                         currentQuestion.question += " " + line;
                     }
                } else {
                     const lastIdx = currentQuestion.options.length - 1;
                     if (lastIdx >= 0) {
                         currentQuestion.options[lastIdx] += " " + line;
                     }
                }
            }

        } else if (currentQuestion.type === 'true_false') {
            const stmtMatch = line.match(statementPattern);
            if (stmtMatch) {
                const id = stmtMatch[1].toLowerCase() as 'a'|'b'|'c'|'d';
                currentQuestion.statements.push({
                    id: id,
                    text: stmtMatch[2].trim(),
                    is_true: false
                });
            } else {
                 if (currentQuestion.statements.length === 0) {
                    currentQuestion.context += " " + line;
                 }
            }

        } else if (currentQuestion.type === 'short_answer') {
             currentQuestion.question += " " + line;
        }
      }
    }

    pushCurrentQuestion();
    return questions;
  };

  const handleProcess = () => {
    setIsProcessing(true);
    setError(null);
    try {
        const parsed = parseTextToQuestions(text);
        if (parsed.length === 0) {
            setError("Không tìm thấy câu hỏi nào. Vui lòng kiểm tra định dạng (ví dụ: 'Câu 1: ...').");
        } else {
            setPreviewQuestions(parsed || []);
        }
    } catch (e) {
        console.error(e);
        setError("Lỗi khi xử lý văn bản.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
      onImport(previewQuestions || []);
      onClose();
      setText('');
      setPreviewQuestions([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b bg-gray-50 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800">Nhập câu hỏi từ văn bản (Beta)</h2>
          <p className="text-sm text-gray-500 mt-1">
            Sao chép nội dung từ File Word/PDF và dán vào đây. Ứng dụng sẽ tự động nhận diện câu hỏi.
          </p>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Input Area */}
            <div className={`flex-1 p-4 flex flex-col ${(previewQuestions || []).length > 0 ? 'border-b md:border-b-0 md:border-r border-gray-200 h-1/2 md:h-full' : 'h-full'}`}>
                <label className="font-semibold text-gray-700 mb-2">Dán nội dung câu hỏi:</label>
                <textarea 
                    className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm font-mono"
                    placeholder={`Ví dụ:\n\nI. TRẮC NGHIỆM NHIỀU LỰA CHỌN\nCâu 1: Việt Nam nằm ở đâu?\nA. Đông Nam Á. B. Châu Âu.\nC. Châu Phi. D. Châu Mỹ.\n\nII. TRẮC NGHIỆM ĐÚNG SAI\nCâu 2: Cho thông tin sau...\na) Đúng\nb) Sai\n...`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                 <div className="mt-4 flex justify-end">
                    <button 
                        onClick={handleProcess}
                        disabled={!text.trim() || isProcessing}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
                    >
                        {isProcessing ? 'Đang xử lý...' : 'Phân tích & Xem trước'}
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            {(previewQuestions || []).length > 0 && (
                <div className="flex-1 p-4 flex flex-col bg-gray-50 h-1/2 md:h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-2">
                        <label className="font-semibold text-gray-700">Kết quả ({(previewQuestions || []).length} câu):</label>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {(previewQuestions || []).map((q, idx) => (
                            <div key={idx} className="bg-white p-3 rounded border border-gray-200 text-sm shadow-sm">
                                <div className="flex justify-between">
                                    <span className={`font-bold text-xs uppercase mr-2 ${q.type === 'multiple_choice' ? 'text-blue-600' : q.type === 'true_false' ? 'text-purple-600' : 'text-green-600'}`}>
                                        {q.type === 'multiple_choice' ? 'TN 1 Lựa chọn' : q.type === 'true_false' ? 'Đúng/Sai' : 'Trả lời ngắn'}
                                    </span>
                                    <span className="text-gray-400 text-xs">#{idx + 1}</span>
                                </div>
                                <p className="mt-1 font-medium text-gray-800 line-clamp-2">
                                    {q.type === 'true_false' ? (q as TrueFalseQuestion).context : (q as any).question}
                                </p>
                                {q.type === 'multiple_choice' && (
                                    <div className="mt-1 text-gray-500 text-xs grid grid-cols-2 gap-1">
                                        {((q as MultipleChoiceQuestion).options || []).map((opt, i) => (
                                            <div key={i} className="truncate text-gray-600"><span className="font-semibold">{String.fromCharCode(65+i)}.</span> {opt}</div>
                                        ))}
                                    </div>
                                )}
                                {q.type === 'true_false' && (
                                    <div className="mt-1 text-gray-500 text-xs">
                                        {((q as TrueFalseQuestion).statements || []).map((s, i) => (
                                            <div key={i} className="truncate text-gray-600"><span className="font-semibold">{s.id})</span> {s.text}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {error && (
            <div className="px-6 py-2 bg-red-50 text-red-600 text-sm border-t border-red-100">
                {error}
            </div>
        )}

        <div className="p-6 border-t flex justify-end items-center bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 mr-3">Hủy</button>
          <button 
            onClick={handleConfirm}
            disabled={(previewQuestions || []).length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 shadow-lg"
          >
            Nhập {(previewQuestions || []).length} câu hỏi
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionImporter;
