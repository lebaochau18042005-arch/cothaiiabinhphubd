
import React, { useState, useEffect } from 'react';
import { curriculumData } from '../data/curriculum';
import { generateMixedGameQuestions, analyzeGameResults } from '../services/geminiService';
import type { GameSession, Player, SelectedTopic, GameHistoryRecord } from '../types';

const ClassroomManagement: React.FC = () => {
    const [activeSession, setActiveSession] = useState<GameSession | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [history, setHistory] = useState<GameHistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<SelectedTopic | null>(null);
    const [showPresentation, setShowPresentation] = useState(false);
    
    const [gameName, setGameName] = useState('');
    const [timePerQ, setTimePerQ] = useState(30);
    const [basePts, setBasePts] = useState(1000);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const savedHistory = localStorage.getItem('geography_game_history');
        if (savedHistory) setHistory(JSON.parse(savedHistory));

        const syncData = () => {
            const currentSessionStr = localStorage.getItem('active_game_session');
            if (currentSessionStr) {
                const session = JSON.parse(currentSessionStr);
                setActiveSession(session);
                
                const sessionPlayersStr = localStorage.getItem(`players_${session.id}`);
                if (sessionPlayersStr) {
                    setPlayers(JSON.parse(sessionPlayersStr));
                }
            } else {
                setActiveSession(null);
                setPlayers([]);
            }
        };
        
        syncData();
        window.addEventListener('storage', syncData);
        const interval = setInterval(syncData, 1500);
        return () => {
            window.removeEventListener('storage', syncData);
            clearInterval(interval);
        };
    }, []);

    const startSession = async () => {
        if (!selectedTopic || !gameName.trim()) return;
        setIsLoading(true);
        try {
            const questions = await generateMixedGameQuestions(selectedTopic, 12);
            const newSession: GameSession = {
                id: Math.floor(100000 + Math.random() * 900000).toString(),
                gameName: gameName.trim(),
                topic: selectedTopic,
                status: 'lobby',
                createdAt: new Date().toISOString(),
                questions,
                settings: {
                    timePerQuestion: timePerQ,
                    basePoints: basePts
                },
                currentQuestionIndex: 0
            } as any;

            localStorage.setItem('active_game_session', JSON.stringify(newSession));
            localStorage.setItem('is_teacher_hosting', 'true');
            localStorage.removeItem(`players_${newSession.id}`);
            setActiveSession(newSession);
            setPlayers([]);
            setShowPresentation(true);
        } catch (e) {
            alert("Lỗi tạo câu hỏi từ AI. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const beginGame = () => {
        if (!activeSession) return;
        const updatedSession = { ...activeSession, status: 'playing' as const, currentQuestionIndex: 0 };
        localStorage.setItem('active_game_session', JSON.stringify(updatedSession));
        setActiveSession(updatedSession);
        setShowPresentation(false);
    };

    const nextQuestion = () => {
        if (!activeSession) return;
        const currentIdx = (activeSession as any).currentQuestionIndex || 0;
        const nextIdx = currentIdx + 1;
        
        if (nextIdx < activeSession.questions.length) {
            const updated = { ...activeSession, currentQuestionIndex: nextIdx };
            localStorage.setItem('active_game_session', JSON.stringify(updated));
            setActiveSession(updated);
        } else {
            endSession();
        }
    };

    const endSession = async () => {
        if (!activeSession) return;
        setIsAnalyzing(true);
        const analysis = players.length > 0 
            ? await analyzeGameResults(activeSession.gameName, activeSession.topic.unit, players)
            : "Không có dữ liệu.";

        const record: GameHistoryRecord = {
            sessionId: activeSession.id,
            gameName: activeSession.gameName,
            topicName: activeSession.topic.unit,
            date: new Date().toLocaleString(),
            players: [...players].sort((a, b) => b.score - a.score),
            aiAnalysis: analysis
        };
        
        const updatedHistory = [record, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('geography_game_history', JSON.stringify(updatedHistory));
        localStorage.removeItem('active_game_session');
        localStorage.removeItem('is_teacher_hosting');
        setActiveSession(null);
        setShowPresentation(false);
        setIsAnalyzing(false);
    };

    // Tạo link chia sẻ CHÍNH XÁC dẫn về Góc Học Sinh
    const getShareLink = () => {
        if (!activeSession) return '';
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('page', 'student-zone');
        url.searchParams.set('pin', activeSession.id);
        return url.toString();
    };

    const copyLink = () => {
        const link = getShareLink();
        navigator.clipboard.writeText(link).then(() => {
            alert("Đã copy đường link tham gia! Cô Thái có thể gửi qua Zalo/Facebook cho lớp.");
        }).catch(err => {
            console.error('Lỗi coppy:', err);
            alert("Lỗi coppy link. Cô hãy copy thủ công mã PIN: " + activeSession?.id);
        });
    };

    if (showPresentation && activeSession) {
        return (
            <div className="fixed inset-0 bg-[#0f172a] z-[100] flex flex-col items-center justify-center p-8 text-white animate-fade-in">
                <div className="absolute top-8 right-8">
                    <button 
                        onClick={() => setShowPresentation(false)}
                        className="bg-white/10 hover:bg-white text-white hover:text-gray-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all border border-white/20"
                    >
                        Quay lại Bảng điều khiển
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-indigo-400 mb-2 uppercase tracking-tight">MÀN HÌNH CHỜ TRÒ CHƠI</h1>
                    <p className="text-xl text-white/60 font-medium italic">{activeSession.gameName}</p>
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-center gap-16 w-full max-w-7xl">
                    <div className="text-center space-y-8 bg-white/5 p-12 rounded-[4rem] border border-white/10 backdrop-blur-xl shadow-2xl">
                        <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getShareLink())}`} 
                                alt="QR Code"
                                className="w-64 h-64"
                            />
                        </div>
                        <div className="space-y-4">
                            <p className="text-indigo-300 uppercase font-black tracking-widest text-sm">Quét mã hoặc nhập mã PIN</p>
                            <h2 className="text-9xl font-black text-white tracking-tighter drop-shadow-2xl">{activeSession.id}</h2>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-2xl bg-white/5 backdrop-blur-md rounded-[4rem] p-10 border border-white/10 shadow-2xl h-[550px] flex flex-col">
                        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                            <h3 className="text-2xl font-black flex items-center">
                                <span className="w-4 h-4 bg-green-500 rounded-full mr-4 animate-ping"></span>
                                ĐÃ VÀO PHÒNG: {players.length}
                            </h3>
                            {players.length > 0 && activeSession.status === 'lobby' && (
                                <button onClick={beginGame} className="bg-green-500 hover:bg-green-400 text-white px-10 py-4 rounded-3xl font-black text-2xl shadow-2xl transition-all animate-bounce">
                                    BẮT ĐẦU NGAY!
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                            <div className="flex flex-wrap gap-4">
                                {players.map((p) => (
                                    <div key={p.id} className="px-6 py-3 bg-white/10 rounded-2xl font-bold text-xl border border-white/5 animate-fade-in">
                                        {p.name} <span className="text-xs opacity-50 ml-1">({p.className})</span>
                                    </div>
                                ))}
                                {players.length === 0 && <p className="text-white/40 italic">Cô Thái đang đợi học sinh vào phòng...</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Quản lý lớp học</h2>
                    <p className="mt-1 text-gray-500 font-medium">Điều khiển trận đấu địa lý và phân tích kết quả bằng AI.</p>
                </div>
            </div>

            {!activeSession ? (
                <div className="card p-10 bg-white border-2 border-indigo-50 shadow-xl rounded-[3rem]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Tên trận đấu</label>
                            <input type="text" value={gameName} onChange={e => setGameName(e.target.value)} placeholder="VD: Kiểm tra 10A1..." className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 outline-none font-bold bg-gray-50/50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Chọn bài học</label>
                            <select onChange={(e) => {
                                const [grade, unit] = e.target.value.split('|');
                                setSelectedTopic({ grade, unit, chapter: '' });
                            }} className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 outline-none font-bold bg-white">
                                <option value="">-- Chọn bài học --</option>
                                {curriculumData.map(g => g.chapters.map(c => c.units.map(u => (
                                    <option key={u.name} value={`${g.grade}|${u.name}`}>Lớp {g.grade}: {u.name}</option>
                                ))))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Thời gian/Câu</label>
                            <input type="number" value={timePerQ} onChange={e => setTimePerQ(parseInt(e.target.value))} className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 outline-none font-bold bg-gray-50/50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Điểm chuẩn</label>
                            <input type="number" value={basePts} onChange={e => setBasePts(parseInt(e.target.value))} className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 outline-none font-bold bg-gray-50/50" />
                        </div>
                    </div>
                    <button 
                        onClick={startSession} 
                        disabled={isLoading || !selectedTopic || !gameName.trim()} 
                        className="mt-10 w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-2xl hover:bg-indigo-700 shadow-2xl transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? 'ĐANG TẠO CÂU HỎI AI...' : 'PHÁT ĐỘNG TRÒ CHƠI 🚀'}
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="bg-indigo-950 p-8 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 text-white border-4 border-indigo-500/20">
                        <div className="flex items-center gap-6">
                            <div className="bg-white/10 p-5 rounded-3xl text-center">
                                <p className="text-[10px] font-black uppercase text-indigo-400">PIN</p>
                                <p className="text-4xl font-black">{activeSession.id}</p>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black uppercase">{activeSession.gameName}</h3>
                                <p className="text-indigo-300 font-bold">{activeSession.topic.unit}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={copyLink} className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
                                COPY LINK
                            </button>
                            <button onClick={() => setShowPresentation(true)} className="bg-white/10 hover:bg-white text-white hover:text-indigo-950 px-8 py-4 rounded-2xl font-black transition-all">TRÌNH CHIẾU</button>
                            <button onClick={endSession} disabled={isAnalyzing} className="bg-red-500 hover:bg-red-400 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all">
                                {isAnalyzing ? 'ĐANG LƯU...' : 'KẾT THÚC'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="card p-10 bg-white rounded-[3rem] border-2 border-indigo-50 shadow-xl">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-black uppercase opacity-60">Câu</span>
                                            <span className="text-2xl font-black">{((activeSession as any).currentQuestionIndex || 0) + 1}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Câu hỏi đang phát</h3>
                                    </div>
                                    <button 
                                        onClick={nextQuestion}
                                        className="bg-indigo-900 text-white px-10 py-5 rounded-2xl font-black hover:scale-105 transition-all shadow-xl text-lg flex items-center gap-3"
                                    >
                                        {((activeSession as any).currentQuestionIndex || 0) + 1 < activeSession.questions.length ? 'CÂU TIẾP THEO →' : 'HOÀN TẤT'}
                                    </button>
                                </div>
                                <div className="p-8 bg-gray-50 rounded-[2rem] border-2 border-gray-100 italic font-bold text-gray-600 text-xl leading-relaxed">
                                    {activeSession.questions[(activeSession as any).currentQuestionIndex || 0].type === 'true_false' 
                                        ? (activeSession.questions[(activeSession as any).currentQuestionIndex || 0] as any).context 
                                        : (activeSession.questions[(activeSession as any).currentQuestionIndex || 0] as any).question}
                                </div>
                            </div>
                        </div>

                        <div className="card p-8 bg-white rounded-[3rem] border-2 border-indigo-50 shadow-xl flex flex-col max-h-[600px]">
                            <h3 className="text-xl font-black text-gray-800 mb-6 border-b pb-4 uppercase tracking-widest text-center">BẢNG XẾP HẠNG</h3>
                            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                                {[...players].sort((a,b) => b.score - a.score).map((p, idx) => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-300 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="font-bold text-gray-800">{p.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{p.className}</p>
                                            </div>
                                        </div>
                                        <span className="font-black text-indigo-600 text-lg">{p.score.toLocaleString()}</span>
                                    </div>
                                ))}
                                {players.length === 0 && <p className="text-center text-gray-400 italic mt-10">Cô Thái đang đợi tín hiệu...</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassroomManagement;
