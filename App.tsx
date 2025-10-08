import React, { useState, useCallback, useEffect, FC } from 'react';
import QRCode from 'qrcode';
import { QrCodeEntry } from './types';

// --- Helper Functions ---
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

// --- SVG Icons (defined outside components to prevent re-creation) ---

const IconDownload: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const IconTrash: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconQrCode: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v18H3z" transform="scale(0.8) translate(3,3)" />
        <path d="M7 7h4v4H7zM13 7h4v4h-4zM7 13h4v4H7z" fill="currentColor"/>
    </svg>
);


// --- UI Components (defined outside App to prevent re-rendering issues) ---

interface InputFormProps {
  urlInput: string;
  setUrlInput: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  error: string | null;
}

const InputForm: FC<InputFormProps> = ({ urlInput, setUrlInput, onGenerate, isLoading, error }) => (
  <div className="space-y-4">
    <h1 className="text-4xl font-bold text-white tracking-tight">QR Code Generator Pro</h1>
    <p className="text-gray-400">Enter a URL to instantly generate a QR code. Your codes are saved automatically.</p>
    
    <div>
      <label htmlFor="url-input" className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="url-input"
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://example.com"
          className="flex-grow bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-3 transition"
          disabled={isLoading}
        />
        <button
          onClick={onGenerate}
          disabled={isLoading || !urlInput}
          className="flex items-center justify-center bg-indigo-600 text-white font-semibold py-3 px-6 rounded-md shadow-md hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'Generate QR Code'}
        </button>
      </div>
    </div>
    {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md border border-red-700 text-sm">{error}</p>}
  </div>
);

interface QrCodeDisplayProps {
  currentQr: QrCodeEntry | null;
  onDownload: () => void;
}

const QrCodeDisplay: FC<QrCodeDisplayProps> = ({ currentQr, onDownload }) => (
  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-2xl h-full flex flex-col justify-center items-center text-center">
    {currentQr ? (
      <div className="space-y-4 animate-fade-in">
        <div className="bg-white p-4 rounded-md inline-block shadow-lg">
          <img src={currentQr.dataUrl} alt="Generated QR Code" className="w-48 h-48 md:w-64 md:h-64" />
        </div>
        <p className="text-gray-300 break-all text-sm max-w-xs">{currentQr.url}</p>
        <button
          onClick={onDownload}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
        >
          <IconDownload className="w-5 h-5" />
          Download PNG
        </button>
      </div>
    ) : (
      <div className="text-gray-500 space-y-4">
        <IconQrCode className="w-24 h-24 mx-auto opacity-20"/>
        <h3 className="text-lg font-medium">Your QR code will appear here</h3>
        <p className="text-sm">Generate a code to get started.</p>
      </div>
    )}
  </div>
);

interface HistoryListProps {
  history: QrCodeEntry[];
  onSelect: (item: QrCodeEntry) => void;
  onClear: () => void;
}

const HistoryList: FC<HistoryListProps> = ({ history, onSelect, onClear }) => {
    if (history.length === 0) {
        return null;
    }
    return (
        <div className="mt-12">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">History</h2>
                <button
                    onClick={onClear}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
                >
                    <IconTrash className="w-4 h-4" />
                    Clear History
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {history.map(item => (
                    <div
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="bg-gray-800 p-3 rounded-lg border border-gray-700 cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all transform hover:-translate-y-1"
                    >
                        <div className="bg-white p-1 rounded-md mb-2">
                            <img src={item.dataUrl} alt="QR Code" className="w-full h-auto" />
                        </div>
                        <p className="text-xs text-gray-400 truncate">{item.url}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Main App Component ---

const App: FC = () => {
  const [urlInput, setUrlInput] = useState<string>('');
  const [currentQr, setCurrentQr] = useState<QrCodeEntry | null>(null);
  const [history, setHistory] = useState<QrCodeEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('qrHistory');
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        setHistory(parsedHistory);
        if (parsedHistory.length > 0) {
          setCurrentQr(parsedHistory[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('qrHistory', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history]);

  const handleGenerateQrCode = useCallback(async () => {
    if (!urlInput.trim() || !isValidUrl(urlInput)) {
      setError('Please enter a valid URL (e.g., https://example.com).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dataUrl = await QRCode.toDataURL(urlInput, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      const newEntry: QrCodeEntry = {
        id: new Date().toISOString(),
        url: urlInput,
        dataUrl,
        createdAt: Date.now(),
      };

      setCurrentQr(newEntry);
      setHistory(prevHistory => [newEntry, ...prevHistory.filter(item => item.url !== newEntry.url).slice(0, 19)]);
      setUrlInput('');
    } catch (err) {
      console.error(err);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [urlInput]);
  
  const handleSelectHistoryItem = useCallback((item: QrCodeEntry) => {
    setCurrentQr(item);
  }, []);

  const handleClearHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to clear your entire QR code history?')) {
        setHistory([]);
        setCurrentQr(null);
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!currentQr) return;
    const link = document.createElement('a');
    link.href = currentQr.dataUrl;
    link.download = `qrcode-${new URL(currentQr.url).hostname}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentQr]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col justify-center">
            <InputForm
              urlInput={urlInput}
              setUrlInput={setUrlInput}
              onGenerate={handleGenerateQrCode}
              isLoading={isLoading}
              error={error}
            />
          </div>
          <div className="min-h-[300px] lg:min-h-[400px]">
            <QrCodeDisplay
                currentQr={currentQr}
                onDownload={handleDownload}
            />
          </div>
        </div>
        
        <HistoryList
          history={history}
          onSelect={handleSelectHistoryItem}
          onClear={handleClearHistory}
        />

      </div>
    </div>
  );
};

export default App;