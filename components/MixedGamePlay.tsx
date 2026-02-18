
import React, { useState, useEffect, useRef } from 'react';
import type { GameSession, ExamQuestion, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion, Player, SavedQuizQuestion } from '../types';

interface MixedGameProps {
    session: GameSession;
    nickname: string;
    className: string;
    onFinished: () => void;
}

const MixedGamePlay: React.FC<MixedGameProps> = ({ session, nickname, className, onFinished }) => {
    const [score, setScore] = useState(0);
    const [isAnswered, setIsAnswered] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
    const [timeLeft, setTimeLeft] = useState(session.settings.timePerQuestion);
    const [userAnswer, setUserAnswer] = useState('');
    const [tfAnswers, setTfAnswers] = useState<Record<string, boolean | null>>({ a: null, b: null, c: null, d: null });
    const [isFinished, setIsFinished] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    
    const timerRef = useRef<number | null>(null);
    const playerId = React.useMemo(() => `p_${nickname}_${Math.random().toString(36).substr(2, 4)}`, []);
    
    const currentIdxFromTeacher = (session as any).currentQuestionIndex || 0;
    
    // TIẾN TRÌNH CÁ NHÂN (để Resume)
    const [personalCurrentIdx, setPersonalCurrentIdx] = useState(0);

    // 1. KHỞI TẠO TỪ TIẾN TRÌNH ĐÃ LƯU
    useEffect(() => {
        const savedKey = `game_progress_${session.id}_${nickname}`;
        const saved = localStorage.getItem(savedKey);
        if (saved) {
            const data = JSON.parse(saved);
            setScore(data.score || 0);
            
            // Nếu cô giáo đang ở đúng câu hỏi mà học sinh đang lưu, khôi phục chi tiết
            if (currentIdxFromTeacher === data.currentIdx) {
                setPersonalCurrentIdx(data.currentIdx);
                setTimeLeft(data.timeLeft ?? session.settings.timePerQuestion);
                setUserAnswer(data.userAnswer || '');
                setTfAnswers(data.tfAnswers || { a: null, b: null, c: null, d: null });
                setIsAnswered(data.isAnswered || false);
                setFeedback(data.feedback || null);
            } else {
                // Nếu cô đã sang câu khác, đồng bộ theo cô
                setPersonalCurrentIdx(currentIdxFromTeacher);
            }
        } else {
            setPersonalCurrentIdx(currentIdxFromTeacher);
        }
    }, []);

    // 2. LƯU TIẾN TRÌNH CHI TIẾT MỖI KHI CÓ THAY ĐỔI
    useEffect(() => {
        if (isFinished) return;
        const savedKey = `game_progress_${session.id}_${nickname}`;
        const data = {
            score,
            currentIdx: personalCurrentIdx,
            timeLeft,
            userAnswer,
            tfAnswers,
            isAnswered,
            feedback,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(savedKey, JSON.stringify(data));
    }, [score, personalCurrentIdx, timeLeft, userAnswer, tfAnswers, isAnswered, feedback, isFinished]);

    // 3. ĐỒNG BỘ THEO CÔ GIÁO (Khi cô chuyển câu mới)
    useEffect(() => {
        if (currentIdxFromTeacher > personalCurrentIdx) {
            setPersonalCurrentIdx(currentIdxFromTeacher);
            setIsAnswered(false);
            setFeedback(null);
            setUserAnswer('');
            setIsSaved(false);
            setTfAnswers({ a: null, b: null, c: null, d: null });
            setTimeLeft(session.settings.timePerQuestion);
        }
    }, [currentIdxFromTeacher]);

    const question = session.questions[personalCurrentIdx];

    useEffect(() => {
        if (isFinished || isAnswered || personalCurrentIdx >= session.questions.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [personalCurrentIdx, isFinished, isAnswered]);

    const handleTimeout = () => {
        if (isAnswered) return;
        setIsAnswered(true);
        setFeedback('timeout');
    };

    // Cập nhật bảng xếp hạng
    useEffect(() => {
        const syncProgress = () => {
            const currentPlayersRaw = localStorage.getItem(`players_${session.id}`);
            const currentPlayers: Player[] = currentPlayersRaw ? JSON.parse(currentPlayersRaw) : [];
            const existingIdx = currentPlayers.findIndex(p => p.id === playerId);
            const playerData: Player = {
                id: playerId,
                name: nickname,
                className: className,
                score: score,
                progress: isFinished ? 100 : Math.round((personalCurrentIdx / session.questions.length) * 100),
                answers: {},
                finishedAt: isFinished ? new Date().toISOString() : undefined
            };
            if (existingIdx > -1) currentPlayers[existingIdx] = playerData;
            else currentPlayers.push(playerData);
            localStorage.setItem(`players_${session.id}`, JSON.stringify(currentPlayers));
        };
        syncProgress();
    }, [personalCurrentIdx, score, isFinished]);

    const calculatePoints = (isCorrect: boolean) => {
        if (!isCorrect) return 0;
        const speedRatio = timeLeft / session.settings.timePerQuestion;
        const speedBonus = Math.round(speedRatio * 500);
        return session.settings.basePoints + speedBonus;
    };

    const handleMcqSelect = (opt: string) => {
        if (isAnswered) return;
        setUserAnswer(opt);
        setIsAnswered(true);
        const correct = opt === (question as MultipleChoiceQuestion).correct_answer;
        if (correct) {
            setScore(s => s + calculatePoints(true));
            setFeedback('correct');
        } else setFeedback('wrong');
    };

    const handleTfSubmit = () => {
        if (isAnswered) return;
        setIsAnswered(true);
        const q = question as TrueFalseQuestion;
        let correctCount = 0;
        q.statements.forEach(s => { if (tfAnswers[s.id] === s.is_true) correctCount++; });
        if (correctCount > 0) {
            const ratio = correctCount / 4;
            setScore(s => s + Math.round(ratio * calculatePoints(true)));
            setFeedback(correctCount === 4 ? 'correct' : 'wrong');
        } else setFeedback('wrong');
    };

    const handleShortSubmit = () => {
        if (isAnswered) return;
        setIsAnswered(true);
        const correct = userAnswer.trim().toLowerCase() === (question as ShortAnswerQuestion).correct_answer.toLowerCase();
        if (correct) {
            setScore(s => s + Math.round(calculatePoints(true) * 1.5));
            setFeedback('correct');
        } else setFeedback('wrong');
    };

    if (isFinished || personalCurrentIdx >= session.questions.length) {
        return (
            <div className="text-center py-20 card bg-white rounded-[3rem] shadow-2xl animate-fade-in border-4 border-indigo-100 max-w-2xl mx-auto">
                <div className="text-9xl mb-8">🌍</div>
                <h3 className="text-5xl font-black text-indigo-900 uppercase">TUYỆT VỜI!</h3>
                <p className="text-gray-500 mt-3 font-bold text-xl">{nickname} - {className}</p>
                <div className="mt-12 inline-block p-14 rounded-[3rem] bg-indigo-50 border-4 border-indigo-200">
                    <p className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-3">Tổng điểm đạt được</p>
                    <p className="text-[7rem] font-black text-indigo-600 leading-none">{score.toLocaleString()}</p>
                </div>
                <button onClick={onFinished} className="mt-10 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95">XÁC NHẬN</button>
            </div>
        );
    }

    const renderMcqFeedback = (opt: string) => {
        const mcq = question as MultipleChoiceQuestion;
        const isCorrect = opt === mcq.correct_answer;
        const isUserChoice = opt === userAnswer;
        if (isCorrect) return "border-green-500 bg-green-100 text-green-800 shadow-lg scale-105 z-10";
        if (isUserChoice && !isCorrect) return "border-red-500 bg-red-100 text-red-800 opacity-80";
        return "border-gray-100 bg-gray-50 opacity-40";
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 pb-12">
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-5 rounded-[2.5rem] shadow-xl border border-white">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-black shadow-lg">
                        <span className="text-[10px] opacity-70 uppercase">Câu</span>
                        <span className="text-2xl leading-none">{personalCurrentIdx + 1}</span>
                    </div>
                    <div>
                        <h3 className="font-black text-gray-800 text-lg leading-none mb-1">{nickname}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Lớp {className}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="relative w-14 h-14">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="5" fill="transparent" className={`${timeLeft < 5 ? 'text-red-500' : 'text-indigo-600'} transition-all duration-1000`} strokeDasharray={150.8} strokeDashoffset={150.8 - (150.8 * timeLeft) / session.settings.timePerQuestion} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-gray-800">{timeLeft}</div>
                    </div>
                    <div className="bg-indigo-50 border-2 border-indigo-200 text-indigo-600 px-6 py-2 rounded-2xl font-black text-2xl shadow-inner">{score.toLocaleString()}</div>
                </div>
            </div>

            <div className={`card p-12 min-h-[550px] flex flex-col justify-between transition-all duration-500 rounded-[4rem] border-8 shadow-2xl ${isAnswered ? 'bg-gray-50' : 'bg-white border-white'}`}>
                <div className="flex-1">
                    {question.type === 'multiple_choice' && (
                        <div className="space-y-10">
                            <p className="text-4xl font-black text-gray-800 leading-tight text-center">{question.question}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {question.options.map((opt, i) => (
                                    <button key={i} onClick={() => handleMcqSelect(opt)} disabled={isAnswered} className={`p-8 rounded-[2rem] border-4 text-left font-black text-xl transition-all shadow-md flex items-center group relative ${isAnswered ? renderMcqFeedback(opt) : 'bg-white border-gray-100 hover:border-indigo-600 hover:bg-indigo-50 active:scale-95'}`}>
                                        <span className={`mr-6 flex w-12 h-12 rounded-full items-center justify-center font-black shrink-0 transition-colors ${isAnswered && opt === (question as MultipleChoiceQuestion).correct_answer ? 'bg-green-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>{String.fromCharCode(65+i)}</span>
                                        <span className="flex-1">{opt}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {question.type === 'true_false' && (
                        <div className="space-y-8">
                            <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] text-gray-700 text-xl font-bold leading-relaxed border-2 border-indigo-100">{question.context}</div>
                            <div className="space-y-4">
                                {question.statements.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between p-6 bg-white rounded-3xl border-2 border-gray-100 shadow-sm relative">
                                        <span className="font-black text-xl flex-1 pr-8 text-gray-700"><span className="text-indigo-600 mr-2">{s.id.toUpperCase()}.</span> {s.text}</span>
                                        <div className="flex gap-3">
                                            <button onClick={() => setTfAnswers(p => ({...p, [s.id]: true}))} disabled={isAnswered} className={`px-6 py-2 rounded-xl font-black text-lg transition-all ${isAnswered ? (s.is_true ? 'bg-green-600 text-white' : tfAnswers[s.id] === true ? 'bg-red-500 text-white opacity-50' : 'bg-gray-100 text-gray-300') : (tfAnswers[s.id] === true ? 'bg-indigo-600 text-white scale-110' : 'bg-gray-100 text-green-600')}`}>ĐÚNG</button>
                                            <button onClick={() => setTfAnswers(p => ({...p, [s.id]: false}))} disabled={isAnswered} className={`px-6 py-2 rounded-xl font-black text-lg transition-all ${isAnswered ? (!s.is_true ? 'bg-green-600 text-white' : tfAnswers[s.id] === false ? 'bg-red-500 text-white opacity-50' : 'bg-gray-100 text-gray-300') : (tfAnswers[s.id] === false ? 'bg-indigo-600 text-white scale-110' : 'bg-gray-100 text-red-600')}`}>SAI</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {!isAnswered && <button onClick={handleTfSubmit} className="w-full py-6 bg-indigo-600 text-white font-black text-2xl rounded-[2.5rem] shadow-2xl transition-all active:scale-95">XÁC NHẬN ĐÁP ÁN</button>}
                        </div>
                    )}
                    {question.type === 'short_answer' && (
                        <div className="space-y-12 text-center py-10">
                            <p className="text-4xl font-black text-gray-800">{question.question}</p>
                            <div className="max-w-xl mx-auto space-y-8">
                                <input type="text" value={userAnswer} onChange={e => setUserAnswer(e.target.value)} disabled={isAnswered} placeholder="Gõ đáp án..." className={`w-full text-center text-4xl font-black py-6 border-b-[8px] outline-none bg-transparent transition-all ${isAnswered ? (feedback === 'correct' ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600') : 'border-indigo-600 focus:border-indigo-400'}`} autoFocus/>
                                {isAnswered && (
                                    <div className="p-6 bg-green-50 rounded-3xl border-2 border-green-200 animate-fade-in">
                                        <p className="text-sm font-black text-green-700 uppercase mb-1">Đáp án hệ thống:</p>
                                        <p className="text-3xl font-black text-indigo-900 uppercase">{question.correct_answer}</p>
                                    </div>
                                )}
                                {!isAnswered && <button onClick={handleShortSubmit} className="w-full py-6 bg-indigo-600 text-white font-black text-2xl rounded-[2.5rem] shadow-2xl transition-all active:scale-95">GỬI ĐÁP ÁN</button>}
                            </div>
                        </div>
                    )}
                </div>
                {isAnswered && (
                    <div className="mt-8 flex flex-col items-center gap-4 text-center">
                         <div className={`text-3xl font-black uppercase flex items-center gap-3 ${feedback === 'correct' ? 'text-green-600' : feedback === 'wrong' ? 'text-red-600' : 'text-orange-500'}`}>
                            {feedback === 'correct' ? '✨ Chính xác!' : feedback === 'wrong' ? '❌ Sai rồi!' : '⏰ Hết giờ!'}
                        </div>
                        <p className="text-gray-400 font-bold italic animate-pulse">Cô Thái đang chuẩn bị câu tiếp theo...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MixedGamePlay;
