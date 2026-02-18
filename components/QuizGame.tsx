
import React, { useState, useEffect, useCallback } from 'react';
import { generateQuizQuestion } from '../services/geminiService';
import type { MultipleChoiceQuestion, SavedQuizQuestion, SelectedTopic } from '../types';

interface QuizGameProps {
  onSaveQuestion: (question: MultipleChoiceQuestion, userAnswer: string) => void;
  savedQuestions: SavedQuizQuestion[];
  topic: SelectedTopic | null;
  onGoBack: () => void;
}

const QUESTIONS_PER_ROUND = 5;

const LoadingSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="h-6 bg-indigo-100 rounded w-3/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-14 bg-gray-100 rounded-xl"></div>
            <div className="h-14 bg-gray-100 rounded-xl"></div>
            <div className="h-14 bg-gray-100 rounded-xl"></div>
            <div className="h-14 bg-gray-100 rounded-xl"></div>
        </div>
    </div>
);

const QuizGame: React.FC<QuizGameProps> = ({ onSaveQuestion, savedQuestions, topic, onGoBack }) => {
    const [question, setQuestion] = useState<MultipleChoiceQuestion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    
    // Game state
    const [score, setScore] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [pendingState, setPendingState] = useState<any>(null);

    const SOLO_PROGRESS_KEY = `solo_quiz_progress_${topic?.unit || 'general'}`;

    const fetchQuestion = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setQuestion(null);
        setIsSaved(false);
        try {
            const newQuestion = await generateQuizQuestion(topic ?? undefined);
            setQuestion(newQuestion);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsLoading(false);
        }
    }, [topic]);

    const startNewGame = useCallback(() => {
        setScore(0);
        setCurrentQuestionIndex(0);
        setIsFinished(false);
        localStorage.removeItem(SOLO_PROGRESS_KEY);
        setShowResumePrompt(false);
        fetchQuestion();
    }, [fetchQuestion, SOLO_PROGRESS_KEY]);

    const resumeGame = (state: any) => {
        setScore(state.score);
        setCurrentQuestionIndex(state.currentIdx);
        setIsFinished(false);
        setShowResumePrompt(false);
        fetchQuestion();
    };

    // Kiểm tra tiến trình cũ khi vào game
    useEffect(() => {
        const saved = localStorage.getItem(SOLO_PROGRESS_KEY);
        if (saved) {
            const state = JSON.parse(saved);
            if (!state.isFinished) {
                setPendingState(state);
                setShowResumePrompt(true);
                return;
            }
        }
        startNewGame();
    }, []);

    // Lưu tiến trình mỗi khi có thay đổi
    useEffect(() => {
        if (isFinished || showResumePrompt) return;
        const state = {
            score,
            currentIdx: currentQuestionIndex,
            isFinished,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(SOLO_PROGRESS_KEY, JSON.stringify(state));
    }, [score, currentQuestionIndex, isFinished, showResumePrompt]);
    
    useEffect(() => {
        if (question) {
            const alreadySaved = savedQuestions.some(q => q.question === question.question);
            setIsSaved(alreadySaved);
        }
    }, [question, savedQuestions]);

    const handleAnswerClick = (answer: string) => {
        if (isAnswered) return;
        setSelectedAnswer(answer);
        setIsAnswered(true);
        if (answer === question?.correct_answer) {
            setScore(prevScore => prevScore + 1);
        }
    };

    const handleNextClick = () => {
        if (currentQuestionIndex < QUESTIONS_PER_ROUND - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
            fetchQuestion();
        } else {
            setIsFinished(true);
            const state = JSON.parse(localStorage.getItem(SOLO_PROGRESS_KEY) || '{}');
            localStorage.setItem(SOLO_PROGRESS_KEY, JSON.stringify({...state, isFinished: true}));
        }
    };
    
    const handleSaveClick = () => {
        if (question && selectedAnswer && !isSaved) {
            onSaveQuestion(question, selectedAnswer);
        }
    };

    const getButtonClass = (option: string) => {
        if (!isAnswered) {
            return "bg-white border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-gray-700";
        }
        if (option === question?.correct_answer) {
            return "bg-green-100 border-green-500 text-green-800 ring-4 ring-green-100 z-10 scale-[1.02]";
        }
        if (option === selectedAnswer) {
            return "bg-red-100 border-red-500 text-red-800 ring-4 ring-red-100 z-10";
        }
        return "bg-gray-50 border-gray-100 text-gray-400 opacity-60";
    }

    if (showResumePrompt) {
        return (
            <div className="text-center py-20 animate-fade-in max-w-md mx-auto">
                <div className="text-6xl mb-6">⏯️</div>
                <h3 className="text-2xl font-black text-gray-800 mb-2 uppercase">Tiếp tục thử thách?</h3>
                <p className="text-gray-500 mb-8 font-medium">Hệ thống tìm thấy một vòng chơi chưa hoàn thành ({pendingState?.currentIdx + 1}/{QUESTIONS_PER_ROUND} câu).</p>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={startNewGame} className="py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all active:scale-95">CHƠI LẠI</button>
                    <button onClick={() => resumeGame(pendingState)} className="py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95">TIẾP TỤC</button>
                </div>
            </div>
        );
    }

    const renderGameFinished = () => {
        const percentage = (score / QUESTIONS_PER_ROUND) * 100;
        let message = "Hãy tiếp tục cố gắng nhé!";
        let emoji = "💪";
        if (percentage === 100) { message = "Xuất sắc! Bạn là chuyên gia Địa lý!"; emoji = "🏆"; }
        else if (percentage >= 80) { message = "Tuyệt vời! Kiến thức rất vững chắc!"; emoji = "🌟"; }
        else if (percentage >= 60) { message = "Khá tốt! Cần luyện tập thêm một chút."; emoji = "👏"; }

        return (
            <div className="text-center py-10 animate-fade-in">
                <div className="text-6xl mb-4">{emoji}</div>
                <h3 className="text-4xl font-black text-indigo-900 mb-2 uppercase tracking-tight">Hoàn thành thử thách!</h3>
                <p className="text-gray-500 text-lg mb-10 font-medium">{message}</p>
                
                <div className="inline-block p-10 bg-white rounded-[3rem] shadow-2xl border-4 border-indigo-50 mb-12 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Kết quả chung cuộc</p>
                    <div className="flex items-baseline justify-center">
                        <span className="text-8xl font-black text-indigo-600 transition-transform group-hover:scale-110 duration-500 inline-block drop-shadow-sm">{score}</span>
                        <span className="text-3xl font-bold text-gray-300 ml-3">/ {QUESTIONS_PER_ROUND}</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                    <button 
                        onClick={startNewGame} 
                        className="w-full sm:w-auto px-10 py-5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-black rounded-2xl shadow-[0_20px_40px_rgba(79,70,229,0.4)] hover:shadow-[0_25px_60px_rgba(79,70,229,0.5)] hover:-translate-y-1.5 active:scale-95 transition-all uppercase tracking-wider flex items-center justify-center gap-3 group ring-offset-4 ring-indigo-500/0 hover:ring-indigo-500/20 ring-4"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-180 transition-transform duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Chơi lại vòng mới
                    </button>
                    <button 
                        onClick={onGoBack} 
                        className="w-full sm:w-auto px-10 py-5 bg-white text-indigo-700 font-black rounded-2xl shadow-xl border-2 border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50/50 hover:-translate-y-1.5 active:scale-95 transition-all uppercase tracking-wider flex items-center justify-center gap-3"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        Chọn chủ đề khác
                    </button>
                </div>
            </div>
        );
    };
    
    const renderGameContent = () => {
        if (isLoading) return <LoadingSkeleton />;
        if (error) return (
            <div className="text-center text-red-600 p-10 bg-red-50 rounded-2xl border border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <p className="font-bold">{error}</p>
                <button onClick={fetchQuestion} className="mt-4 px-6 py-2 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition-all">Thử lại</button>
            </div>
        );
        if (question) return (
             <div className="animate-fade-in-up">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 mb-8">
                    <p className="text-xl text-gray-800 font-bold leading-relaxed">{question.question}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.map((option, index) => (
                        <button 
                            key={index}
                            onClick={() => handleAnswerClick(option)}
                            disabled={isAnswered}
                            className={`w-full text-left p-5 border-2 rounded-2xl focus:outline-none transition-all duration-300 font-bold shadow-sm ${getButtonClass(option)} ${isAnswered ? 'cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-md active:scale-95'}`}
                        >
                           <div className="flex items-center">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm transition-colors ${selectedAnswer === option ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {String.fromCharCode(65 + index)}
                                </span>
                                {option}
                           </div>
                        </button>
                    ))}
                </div>

                 <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="w-full sm:w-auto">
                    {isAnswered && (
                        <button
                            onClick={handleSaveClick}
                            disabled={isSaved}
                            className={`w-full sm:w-auto px-5 py-2.5 text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center active:scale-95 ${isSaved ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100'}`}
                        >
                            {isSaved ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Đã lưu câu hỏi
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" /></svg>
                                    Lưu để xem lại
                                </>
                            )}
                        </button>
                    )}
                    </div>
                    <button 
                        onClick={handleNextClick}
                        disabled={!isAnswered || isLoading}
                        className="w-full sm:w-auto px-10 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:translate-x-1 active:scale-95 transition-all disabled:bg-indigo-300 disabled:shadow-none"
                    >
                    {currentQuestionIndex < QUESTIONS_PER_ROUND - 1 ? 'Câu tiếp theo →' : 'Xem kết quả →'}
                    </button>
                </div>
            </div>
        );
        return null;
    }

  return (
    <div className="bg-gradient-to-b from-indigo-50/50 to-white p-6 md:p-10 rounded-[2.5rem] border border-indigo-100 w-full max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full opacity-50 blur-3xl"></div>
       <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-50 rounded-full opacity-50 blur-3xl"></div>

       {!isFinished && !showResumePrompt && (
            <div className="relative z-10">
                <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
                    <div>
                        <div className="flex items-center text-indigo-600 font-black text-xs uppercase tracking-widest mb-2">
                            <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2 animate-pulse"></span>
                            Thử thách Địa lý
                        </div>
                        {topic && <h3 className="text-2xl font-black text-gray-800">{topic.unit}</h3>}
                    </div>
                    <div className="bg-indigo-600 text-white px-5 py-2 rounded-2xl font-black text-xl shadow-lg shadow-indigo-100 flex items-center">
                        <span className="text-indigo-200 text-sm mr-2 uppercase tracking-tighter">Điểm:</span>
                        {score}
                    </div>
                </div>
                
                <div className="mb-10">
                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 px-1">
                        <span>TIẾN TRÌNH</span>
                        <span>{currentQuestionIndex + 1} / {QUESTIONS_PER_ROUND} CÂU</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 p-1 shadow-inner">
                        <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-700 ease-out" 
                            style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS_PER_ROUND) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
       )}
      
       <div className="relative z-10">
            {isFinished ? renderGameFinished() : renderGameContent()}
       </div>

       <style>{`
            @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up {
                animation: fade-in-up 0.4s ease-out forwards;
            }
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .animate-fade-in {
                animation: fade-in 0.6s ease-out forwards;
            }
       `}</style>
    </div>
  );
};

export default QuizGame;
