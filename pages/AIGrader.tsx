import React, { useState } from 'react';
import { gradeAnswerWithAI } from '../services/geminiService';
import type { AIGradeResult } from '../types';

const AIGrader: React.FC = () => {
    const [question, setQuestion] = useState('');
    const [criteria, setCriteria] = useState('');
    const [maxScore, setMaxScore] = useState(10);
    const [studentAnswer, setStudentAnswer] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AIGradeResult | null>(null);

    const isFormValid = question.trim() && criteria.trim() && studentAnswer.trim();

    const handleGrade = async () => {
        if (!isFormValid) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const gradeResult = await gradeAnswerWithAI(question, criteria, maxScore, studentAnswer);
            setResult(gradeResult);
        } catch (err: any) {
            console.error(err);
            // AI Instruction: Show raw API error
            const errorMessage = err?.message || JSON.stringify(err);
            setError(`Lỗi chấm bài: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-extrabold text-gray-900">Chấm điểm Tự luận với AI</h2>
                <p className="mt-2 text-gray-600">
                    Cung cấp thông tin về câu hỏi, tiêu chí chấm điểm và bài làm của học sinh để AI đưa ra điểm số và nhận xét chi tiết.
                </p>
            </div>

            <div className="space-y-6">
                {/* Input Section */}
                <div className="card p-6 md:p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">1. Thông tin đề bài & Đáp án</h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label htmlFor="question" className="block text-sm font-semibold text-gray-700 mb-1">
                                Đề bài
                            </label>
                            <textarea
                                id="question"
                                rows={2}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ví dụ: Phân tích những ảnh hưởng của biến đổi khí hậu đến Đồng bằng sông Cửu Long."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="criteria" className="block text-sm font-semibold text-gray-700 mb-1">
                                Đáp án mẫu / Tiêu chí chấm điểm
                            </label>
                            <textarea
                                id="criteria"
                                rows={5}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Dán đáp án chi tiết hoặc các tiêu chí chấm điểm vào đây. Càng chi tiết, AI chấm càng chính xác."
                                value={criteria}
                                onChange={(e) => setCriteria(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="max-score" className="block text-sm font-semibold text-gray-700 mb-1">
                                Thang điểm tối đa
                            </label>
                            <input
                                type="number"
                                id="max-score"
                                value={maxScore}
                                onChange={(e) => setMaxScore(Number(e.target.value))}
                                className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Student Answer Section */}
                <div className="card p-6 md:p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">2. Bài làm của học sinh</h3>
                    <div>
                        <label htmlFor="student-answer" className="sr-only">
                            Bài làm của học sinh
                        </label>
                        <textarea
                            id="student-answer"
                            rows={8}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Dán toàn bộ nội dung bài làm của học sinh vào đây."
                            value={studentAnswer}
                            onChange={(e) => setStudentAnswer(e.target.value)}
                        />
                    </div>
                </div>

                {/* Action Button */}
                <div className="text-center pt-4">
                    <button
                        onClick={handleGrade}
                        disabled={isLoading || !isFormValid}
                        className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang phân tích...
                            </>
                        ) : (
                            'Chấm điểm bằng AI'
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Result Section */}
            {result && (
                <div className="mt-8 card p-6 md:p-8 border-t-4 border-green-500 animate-fade-in">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">3. Kết quả Chấm điểm</h3>
                    <div className="text-center mb-8">
                        <p className="text-lg text-gray-600">Điểm số đề xuất</p>
                        <p className="text-7xl font-extrabold text-green-600 my-2">
                            {result.score.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                            <span className="text-3xl text-gray-500"> / {maxScore}</span>
                        </p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-semibold text-lg text-gray-700 mb-2">Nhận xét chi tiết:</h4>
                        <div
                            className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: result.feedback.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }}
                        />
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AIGrader;