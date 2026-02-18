
import { GoogleGenAI } from "@google/genai";
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';
import mammoth from 'mammoth';
import { generateExamFromMatrix, generateExamFromDirectSource, shuffleExamVariants } from '../services/geminiService';
import SaveExamModal from '../components/SaveExamModal';
import EditQuestionModal from '../components/EditQuestionModal';
import QuestionImporter from '../components/QuestionImporter';
import EditIcon from '../components/icons/EditIcon';
import UploadIcon from '../components/icons/UploadIcon';
import type { MatrixData, ExamQuestion, SavedExam, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion, EssayQuestion } from '../types';

// --- Printable Components ---

const PrintableExamLayout: React.FC<{
  examTitle: string;
  subject: string;
  time: string;
  examCode: string;
  children: React.ReactNode;
}> = ({ examTitle, subject, time, examCode, children }) => (
  <div className="printable-content bg-white text-black p-12" style={{ width: '210mm', minHeight: '297mm', fontFamily: "'Times New Roman', Times, serif" }}>
    <style>{`
        .printable-content { font-size: 12pt; line-height: 1.5; color: black; }
        .printable-content h3 { font-size: 13pt; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.75rem; text-align: left; border-bottom: 1px solid black; }
        .printable-content .question-block { margin-bottom: 1.5rem; page-break-inside: avoid; }
        .printable-content .mcq-options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem 1.5rem; padding-left: 1.5rem; }
        .printable-content .essay-content { white-space: pre-wrap; margin-top: 5px; }
      `}</style>
    <header className="grid grid-cols-2 text-center text-sm mb-8">
      <div><p className="uppercase">SỞ GD&ĐT ........................</p><p className="uppercase font-bold underline">TRƯỜNG THPT ........................</p></div>
      <div><p className="font-bold">ĐỀ KIỂM TRA ĐỊA LÝ</p><p className="font-bold">Năm học: 2024-2025</p></div>
    </header>
    <div className="text-center mb-8">
      <h1 className="font-bold uppercase text-lg">{examTitle}</h1>
      <p className="font-bold">MÔN: {subject.toUpperCase()}</p>
      <p>Thời gian làm bài: {time}</p>
    </div>
    <div className="border border-black p-3 mb-6">
      <p>Họ và tên: ............................................................. Lớp: ................... Mã đề: <strong>{examCode}</strong></p>
    </div>
    <main>{children}</main>
  </div>
);

const PrintableGradingScheme: React.FC<{
  examTitle: string;
  examCode: string;
  questions: ExamQuestion[];
}> = ({ examTitle, examCode, questions }) => (
  <div className="printable-content bg-white text-black p-12" style={{ width: '210mm', minHeight: '297mm', fontFamily: "'Times New Roman', Times, serif" }}>
    <h1 className="text-center font-bold uppercase text-xl mb-4">ĐÁP ÁN VÀ BIỂU ĐIỂM CHI TIẾT</h1>
    <p className="text-center font-bold mb-6 italic">Mã đề: {examCode}</p>
    <table className="w-full border-collapse border border-black text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black p-2 w-16">Câu</th>
          <th className="border border-black p-2">Nội dung đáp án & Hướng dẫn chấm</th>
          <th className="border border-black p-2 w-20">Điểm</th>
        </tr>
      </thead>
      <tbody>
        {questions.map((q, i) => (
          <tr key={i}>
            <td className="border border-black p-2 text-center font-bold">{i + 1}</td>
            <td className="border border-black p-2">
              <div className="font-bold mb-1">
                {q.type === 'multiple_choice' ? `Đáp án: ${q.correct_answer}` :
                  q.type === 'true_false' ? 'Trắc nghiệm Đúng/Sai' :
                    'Câu hỏi tự luận/trả lời ngắn'}
              </div>
              <div className="whitespace-pre-wrap text-gray-700 italic">
                {q.grading_scheme || (q.type === 'multiple_choice' ? 'Chọn đúng phương án duy nhất.' : 'Đang cập nhật biểu điểm...')}
              </div>
              {q.type === 'true_false' && (
                <div className="mt-1 grid grid-cols-2 gap-x-4">
                  {q.statements.map(s => <span key={s.id}>{s.id}) {s.is_true ? 'Đúng' : 'Sai'}</span>)}
                </div>
              )}
            </td>
            <td className="border border-black p-2 text-center font-bold">{q.points || '...'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- Helper Functions ---

const renderToPdf = async (components: React.ReactElement[], filename: string) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const container = document.createElement('div');
  container.style.position = 'absolute'; container.style.left = '-9999px';
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  for (let i = 0; i < components.length; i++) {
    if (i > 0) pdf.addPage();
    await new Promise(r => { root.render(components[i]); setTimeout(r, 800); });
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, { scale: 2 });
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, imgHeight);
  }
  pdf.save(`${filename}.pdf`);
  document.body.removeChild(container);
};

const cleanPrefix = (text: string) => text.trim().replace(/^[A-Z]\.\s*/i, '').trim();

// --- Main Component ---

const ExamGenerator: React.FC<{ initialMatrix: MatrixData | null, initialExam: ExamQuestion[] | null }> = ({ initialMatrix, initialExam }) => {
  const [matrix, setMatrix] = useState<MatrixData | null>(initialMatrix);
  const [displayedExam, setDisplayedExam] = useState<ExamQuestion[] | null>(initialExam);
  const [examVariants, setExamVariants] = useState<ExamQuestion[][]>([]);
  const [currentVariantIdx, setCurrentVariantIdx] = useState(0);

  const [numVersions, setNumVersions] = useState(1);
  const [startCode, setStartCode] = useState(101);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showGrading, setShowGrading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);

  useEffect(() => {
    setMatrix(initialMatrix);
    if (initialExam) { setDisplayedExam(initialExam); setExamVariants([initialExam]); }
  }, [initialMatrix, initialExam]);

  useEffect(() => {
    const stored = localStorage.getItem('savedExams');
    if (stored) try { setSavedExams(JSON.parse(stored)); } catch (e) { }
  }, []);

  const handleGenerateExam = async () => {
    if (!matrix) return;
    setIsLoading(true); setError(null);
    try {
      const baseExam = await generateExamFromMatrix(matrix);
      const variants = numVersions > 1 ? await shuffleExamVariants(baseExam, numVersions) : [baseExam];
      setExamVariants(variants);
      setDisplayedExam(variants[0]);
      setCurrentVariantIdx(0);
      setShowGrading(true);
    } catch (err: any) {
      console.error("Error generating exam:", err);
      // AI Instruction: Show raw API error
      const errorMessage = err?.message || JSON.stringify(err);
      setError(`Lỗi API: ${errorMessage}`);
    } finally { setIsLoading(false); }
  };

  const handleExportPDF = async () => {
    if (examVariants.length === 0) return;
    setIsExporting(true);
    const title = matrix?.matrixName || "De_Thi";
    const allDocs: React.ReactElement[] = [];

    examVariants.forEach((qs, idx) => {
      const code = (startCode + idx).toString();
      const mcqs = qs.filter(q => q.type === 'multiple_choice') as MultipleChoiceQuestion[];
      const tfs = qs.filter(q => q.type === 'true_false') as TrueFalseQuestion[];
      const open = qs.filter(q => q.type !== 'multiple_choice' && q.type !== 'true_false');

      allDocs.push(
        <PrintableExamLayout examTitle={title} subject="Địa Lý" time="45 phút" examCode={code}>
          {mcqs.length > 0 && <section><h3>PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN</h3>{mcqs.map((q, i) => <div key={i} className="question-block"><p><strong>Câu {i + 1}:</strong> {q.question}</p><div className="mcq-options">{q.options.map((o, j) => <div key={j}>{String.fromCharCode(65 + j)}. {cleanPrefix(o)}</div>)}</div></div>)}</section>}
          {tfs.length > 0 && <section className="mt-4"><h3>PHẦN II. TRẮC NGHIỆM ĐÚNG/SAI</h3>{tfs.map((q, i) => <div key={i} className="question-block"><p><strong>Câu {i + 1}:</strong> {q.context}</p><div>{q.statements.map(s => <div key={s.id}>{s.id}) {s.text}</div>)}</div></div>)}</section>}
          {open.length > 0 && <section className="mt-4"><h3>PHẦN III. TRẢ LỜI NGẮN / TỰ LUẬN</h3>{open.map((q, i) => <div key={i} className="question-block"><p><strong>Câu {i + 1}:</strong> {(q as any).question}</p><div className="h-32 border-b border-gray-200 border-dashed"></div></div>)}</section>}
        </PrintableExamLayout>
      );
      allDocs.push(<PrintableGradingScheme examTitle={title} examCode={code} questions={qs} />);
    });

    await renderToPdf(allDocs, title.replace(/\s+/g, '_'));
    setIsExporting(false);
  };

  const saveToLib = (name: string) => {
    if (!displayedExam) return;
    const entry: SavedExam = { id: crypto.randomUUID(), name, savedAt: new Date().toISOString(), questions: displayedExam, matrixContext: matrix || undefined };
    const next = [entry, ...savedExams]; setSavedExams(next); localStorage.setItem('savedExams', JSON.stringify(next));
    setIsSaveModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <SaveExamModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={saveToLib} defaultName={matrix?.matrixName || "Đề thi mới"} />

      <div className="card p-8 bg-white border-indigo-50 shadow-sm">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Tạo đề thi AI (Cô Thái)</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400 uppercase">Mã đề:</span>
            <input type="number" value={startCode} onChange={e => setStartCode(parseInt(e.target.value))} className="w-20 px-2 py-1 border-2 rounded-lg font-bold outline-none" />
            <span className="text-xs font-bold text-gray-400 uppercase ml-2">Số lượng:</span>
            <input type="number" min="1" max="4" value={numVersions} onChange={e => setNumVersions(parseInt(e.target.value))} className="w-16 px-2 py-1 border-2 rounded-lg font-bold outline-none" />
          </div>
        </div>

        {matrix ? (
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-indigo-50/50 rounded-3xl border-2 border-indigo-100">
            <div>
              <h4 className="text-xl font-bold text-indigo-900">{matrix.matrixName}</h4>
              <p className="text-sm text-indigo-600 font-medium italic">Lớp {matrix.grade} - Sẵn sàng tạo đủ 4 phần theo ma trận hiện tại.</p>
            </div>
            <button
              onClick={handleGenerateExam}
              disabled={isLoading}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:bg-gray-400"
            >
              {isLoading ? "ĐANG SOẠN ĐỀ..." : "PHÁT ĐỀ VỚI AI 🚀"}
            </button>
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-3xl text-gray-400 font-bold italic">
            Hãy quay lại bước "Tạo Ma Trận" để cấu hình đề thi.
          </div>
        )}
        {error && <p className="mt-4 text-red-500 font-bold bg-red-50 p-4 rounded-xl">{error}</p>}
      </div>

      {displayedExam && (
        <div className="card p-8 bg-white shadow-xl border-2 border-indigo-100">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b pb-6">
            <h3 className="text-2xl font-black text-gray-800 uppercase">XEM TRƯỚC ĐỀ THI</h3>
            <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl">
              <button onClick={() => setShowAnswers(!showAnswers)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${showAnswers ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'}`}>ĐÁP ÁN</button>
              <button onClick={() => setShowGrading(!showGrading)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${showGrading ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'}`}>BIỂU ĐIỂM</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsSaveModalOpen(true)} className="px-6 py-3 bg-white border-2 border-gray-100 rounded-xl font-black text-xs uppercase hover:bg-gray-50">LƯU THƯ VIỆN</button>
              <button onClick={handleExportPDF} disabled={isExporting} className="px-8 py-3 bg-indigo-900 text-white rounded-xl font-black text-xs uppercase shadow-lg hover:bg-indigo-950">
                {isExporting ? 'ĐANG XUẤT...' : 'XUẤT PDF ĐỀ + ĐÁP ÁN'}
              </button>
            </div>
          </div>

          <div className="space-y-12">
            {displayedExam.map((q, i) => (
              <div key={i} className="relative group p-6 border-2 border-gray-50 rounded-[2rem] hover:border-indigo-200 transition-all bg-white shadow-sm">
                <div className="flex gap-4 mb-4">
                  <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-800 leading-relaxed">
                      {q.type === 'true_false' ? q.context : (q as any).question}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">Điểm: {q.points || 0}</span>
                  </div>
                </div>

                {q.type === 'multiple_choice' && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pl-14">
                    {q.options.map((opt, j) => (
                      <div key={j} className={`p-4 rounded-xl border-2 font-bold transition-all ${showAnswers && opt === q.correct_answer ? 'bg-green-100 border-green-500 text-green-800' : 'bg-gray-50 border-gray-50 text-gray-600'}`}>
                        <span className="text-indigo-400 mr-2">{String.fromCharCode(65 + j)}.</span> {opt}
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="mt-4 space-y-2 pl-14">
                    {q.statements.map((s) => (
                      <div key={s.id} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border-2 border-gray-50">
                        <span className="font-bold text-gray-700">{s.id}) {s.text}</span>
                        {showAnswers && <span className={`font-black px-3 py-1 rounded-lg text-[10px] uppercase ${s.is_true ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>{s.is_true ? 'ĐÚNG' : 'SAI'}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {(showAnswers || showGrading) && q.grading_scheme && (
                  <div className="mt-6 ml-14 p-5 bg-orange-50 border-l-4 border-orange-500 rounded-r-xl">
                    <h5 className="text-[10px] font-black text-orange-600 uppercase mb-2">HƯỚNG DẪN CHẤM & BIỂU ĐIỂM:</h5>
                    <div className="text-sm text-orange-900 font-medium whitespace-pre-wrap">{q.grading_scheme}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {savedExams.length > 0 && (
        <div className="card p-8 bg-white border border-gray-100 rounded-[2.5rem]">
          <h3 className="text-xl font-black text-center text-gray-800 mb-8 uppercase">ĐỀ THI ĐÃ LƯU</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {savedExams.map(ex => (
              <div key={ex.id} className="p-5 border-2 border-gray-50 rounded-3xl hover:border-indigo-100 transition-all group">
                <p className="text-[10px] font-bold text-gray-400 mb-2">{new Date(ex.savedAt).toLocaleDateString('vi-VN')}</p>
                <h4 className="font-black text-gray-800 line-clamp-2 mb-4 h-12">{ex.name}</h4>
                <button onClick={() => { setDisplayedExam(ex.questions); setExamVariants([ex.questions]); setMatrix(ex.matrixContext || null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Mở xem lại</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamGenerator;
