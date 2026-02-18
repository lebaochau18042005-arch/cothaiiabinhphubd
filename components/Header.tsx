
import React from 'react';

const Header: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const [showApiKeyModal, setShowApiKeyModal] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');

  React.useEffect(() => {
    const key = localStorage.getItem('GEMINI_API_KEY');
    if (!key) {
      setShowApiKeyModal(true);
    } else {
      setApiKey(key);
    }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
      setShowApiKeyModal(false);
      window.location.reload(); // Reload to apply key in service
    }
  };

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-transparent relative z-10">
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 mr-4 bg-white/60 rounded-full hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowApiKeyModal(true)}
            className={`text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${!apiKey ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white/50 text-gray-600 border-gray-200 hover:bg-white'}`}
          >
            {!apiKey ? '⚠️ Cần nhập API Key' : '🔑 Settings'}
          </button>

          <div className="flex items-center space-x-3 p-2 rounded-full">
            <img
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
              src="https://i.pravatar.cc/100?u=teacher"
              alt="User avatar"
            />
            <div>
              <p className="font-semibold text-sm text-gray-700">Cô Thái</p>
              <p className="text-xs text-gray-500">Giáo viên</p>
            </div>
          </div>
        </div>
      </header >

      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform scale-100 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cấu hình API Key</h3>
            <p className="text-sm text-gray-500 mb-4">
              Ứng dụng cần Gemini API Key của riêng bạn để hoạt động.
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 ml-1 font-medium underline">
                Lấy key tại đây →
              </a>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <button
                onClick={handleSaveKey}
                disabled={!apiKey.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                Lưu & Bắt đầu
              </button>

              {localStorage.getItem('GEMINI_API_KEY') && (
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;