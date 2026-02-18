
import React, { useState, useEffect } from 'react';
import MixedGamePlay from '../components/MixedGamePlay';
import SavedQuestionsList from '../components/SavedQuestionsList';
import type { SavedQuizQuestion, GameSession } from '../types';

const STUDENT_ZONE_STORAGE_KEY = 'ctdl_savedQuizQuestions';
const STUDENT_PROFILE_KEY = 'geography_student_profile';

const StudentZone: React.FC = () => {
  const [pinInput, setPinInput] = useState('');
  const [nickname, setNickname] = useState('');
  const [className, setClassName] = useState('');
  
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState('');
  const [savedQuestions, setSavedQuestions] = useState<SavedQuizQuestion[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  
  // State phục vụ tính năng Resume
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingSavedState, setPendingSavedState] = useState<any>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem(STUDENT_PROFILE_KEY);
    if (savedProfile) {
      const { name, grade } = JSON.parse(savedProfile);
      setNickname(name || '');
      setClassName(grade || '');
    }

    const params = new URLSearchParams(window.location.search);
    const pinFromUrl = params.get('pin');
    if (pinFromUrl) setPinInput(pinFromUrl);

    const stored = localStorage.getItem(STUDENT_ZONE_STORAGE_KEY);
    if (stored) {
      try { setSavedQuestions(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const syncWithTeacher = () => {
      const sessionStr = localStorage.getItem('active_game_session');
      if (sessionStr) {
        const session: GameSession = JSON.parse(sessionStr);
        setActiveSession(session);
        const wasJoined = localStorage.getItem(`joined_session_${session.id}`);
        if (wasJoined === 'true' && !isJoined) {
          setIsJoined(true);
        }
      } else {
        if (isJoined) {
          setIsJoined(false);
          setActiveSession(null);
          localStorage.removeItem(`joined_session_${activeSession?.id}`);
          setError('Trận đấu đã kết thúc.');
        } else {
          setActiveSession(null);
        }
      }
    };
    syncWithTeacher();
    const interval = setInterval(syncWithTeacher, 1500);
    return () => clearInterval(interval);
  }, [isJoined, activeSession?.id]);

  const handleJoin = () => {
    setError('');
    const sessionStr = localStorage.getItem('active_game_session');
    if (!sessionStr) {
      setError("Hiện tại không có phòng chơi nào đang mở.");
      return;
    }

    try {
      const session: GameSession = JSON.parse(sessionStr);
      if (session.id !== pinInput.trim()) {
        setError("Mã PIN không khớp.");
        return;
      }
      if (!nickname.trim() || !className.trim()) {
        setError("Vui lòng điền đủ Tên và Lớp.");
        return;
      }

      // KIỂM TRA TIẾN TRÌNH CŨ
      const savedStateKey = `game_progress_${session.id}_${nickname}`;
      const savedState = localStorage.getItem(savedStateKey);
      
      if (savedState) {
          setPendingSavedState(JSON.parse(savedState));
          setShowResumePrompt(true);
          return;
      }

      startFresh(session);
    } catch (e) { setError("Lỗi dữ liệu."); }
  };

  const startFresh = (session: GameSession) => {
    localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify({ name: nickname, grade: className }));
    localStorage.setItem(`joined_session_${session.id}`, 'true');
    // Xóa tiến trình cũ nếu bắt đầu lại
    localStorage.removeItem(`game_progress_${session.id}_${nickname}`);
    setActiveSession(session);
    setIsJoined(true);
    setShowResumePrompt(false);
  };

  const handleResume = () => {
      if (activeSession && pendingSavedState) {
          localStorage.setItem(`joined_session_${activeSession.id}`, 'true');
          setIsJoined(true);
          setShowResumePrompt(false);
      }
  };

  const updateSavedStorage = (questions: SavedQuizQuestion[]) => {
    localStorage.setItem(STUDENT_ZONE_STORAGE_KEY, JSON.stringify(questions));
    setSavedQuestions(questions);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      {!isJoined ? (
        <div className="space-y-10">
          <div className="text-center">
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase">GÓC HỌC SINH</h2>
            <p className="mt-3 text-indigo-600 font-bold uppercase tracking-[0.2em] text-sm">Chinh phục Địa lý Cánh Diều</p>
          </div>

          {showResumePrompt ? (
            <div className="max-w-md mx-auto card p-10 shadow-[0_30px_60px_rgba(249,115,22,0.2)] bg-white border-t-8 border-orange-500 rounded-[3rem] text-center animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-3xl font-black text-gray-800 mb-4 uppercase">Tiếp tục trận đấu?</h3>
                <p className="text-gray-500 mb-8 font-medium">Hệ thống tìm thấy một tiến trình chưa hoàn thành của em trong phòng này.</p>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => startFresh(activeSession!)} className="py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all active:scale-95">CHƠI LẠI</button>
                    <button onClick={handleResume} className="py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95">TIẾP TỤC</button>
                </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto card p-10 shadow-2xl border-t-8 border-indigo-600 bg-white rounded-[3rem]">
                <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Mã PIN Trò chơi</label>
                    <input type="text" value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder="------" className="w-full px-6 py-5 rounded-2xl border-2 border-gray-100 focus:border-indigo-600 outline-none transition-all text-3xl font-black text-center tracking-[0.3em] bg-gray-50/30" maxLength={6}/>
                </div>
                <div className="space-y-4">
                    <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Họ và Tên</label>
                    <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Tên của em..." className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-600 outline-none transition-all text-lg font-bold bg-gray-50/30"/>
                    </div>
                    <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Lớp học</label>
                    <input type="text" value={className} onChange={e => setClassName(e.target.value)} placeholder="VD: 11A1..." className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-600 outline-none transition-all text-lg font-bold bg-gray-50/30"/>
                    </div>
                </div>
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}
                <button onClick={handleJoin} className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all transform">VÀO PHÒNG 🚀</button>
                </div>
            </div>
          )}
        </div>
      ) : activeSession?.status === 'lobby' ? (
        <div className="max-w-md mx-auto py-16 text-center animate-fade-in">
          <div className="card p-12 bg-[#0f172a] text-white rounded-[4rem] shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="text-8xl mb-8 animate-bounce">🌍</div>
            <h3 className="text-3xl font-black mb-2 uppercase">{activeSession.gameName}</h3>
            <p className="text-indigo-300 font-bold text-xl mb-10">Chào {nickname}, đợi cô Thái bắt đầu nhé!</p>
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-left">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Bài học đang tham gia</p>
              <p className="font-bold text-white text-lg line-clamp-2 leading-tight">{activeSession.topic.unit}</p>
            </div>
          </div>
        </div>
      ) : activeSession ? (
        <MixedGamePlay 
          session={activeSession} 
          nickname={nickname} 
          className={className}
          onFinished={() => {
            localStorage.removeItem(`joined_session_${activeSession.id}`);
            localStorage.removeItem(`game_progress_${activeSession.id}_${nickname}`);
            setIsJoined(false);
          }}
        />
      ) : null}

      {!isJoined && savedQuestions.length > 0 && (
        <div className="mt-20 bg-white/70 backdrop-blur-md p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <button onClick={() => setShowSaved(!showSaved)} className="w-full flex justify-between items-center font-black text-gray-700 uppercase tracking-widest text-sm">
            <span>📚 Thư viện ôn tập ({savedQuestions.length})</span>
            <span className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">{showSaved ? '▲' : '▼'}</span>
          </button>
          {showSaved && <div className="mt-8"><SavedQuestionsList questions={savedQuestions} onRemove={(q) => updateSavedStorage(savedQuestions.filter(item => item.question !== q))} onClearAll={() => updateSavedStorage([])}/></div>}
        </div>
      )}
    </div>
  );
};

export default StudentZone;
