import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Globe, Sparkles, Volume2, CheckCircle2, ChevronDown } from 'lucide-react';

interface Props {
  onTranscript: (text: string) => void;
  className?: string;
  isEmergency?: boolean;
}

export const VoiceDictaphone: React.FC<Props> = ({
  onTranscript,
  className = '',
  isEmergency = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'hi-IN' | 'en-IN'>('en-IN');
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    setInterimText('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setErrorMessage('Speech Recognition is not supported on this browser. Try Chrome/Edge or use the sample prompts below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript.trim());
          setInterimText('');
        } else {
          setInterimText(currentInterim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access blocked. Please allow mic permissions in your browser or click a preset below.');
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e: any) {
      console.error('Failed to initialize Speech Recognition:', e);
      setErrorMessage('Failed to start microphone recognition.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const applyPreset = (text: string) => {
    onTranscript(text);
    setErrorMessage(null);
  };

  return (
    <div className={`p-3.5 rounded-2xl transition-all ${
      isEmergency
        ? 'bg-[#FFF1F0] border border-[#FED4D1]'
        : 'bg-slate-50 border border-slate-200/80 shadow-2xs'
    } ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Mic Control Button */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-xs ${
              isListening
                ? 'bg-[#D92D20] text-white animate-pulse ring-2 ring-red-400'
                : isEmergency
                  ? 'bg-[#D92D20] hover:bg-[#B42318] text-white shadow-md shadow-red-500/20'
                  : 'bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-xs'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5 animate-bounce" />
                <span>Stop Dictation</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Dictate</span>
              </>
            )}
          </motion.button>

          {isListening && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 text-[#D92D20] text-[10px] font-mono font-bold">
              <span>LISTENING</span>
              <div className="flex items-end gap-0.5 h-2.5">
                <span className="w-1 bg-[#D92D20] rounded-full animate-pulse h-full" />
                <span className="w-1 bg-[#D92D20] rounded-full animate-pulse h-2" />
                <span className="w-1 bg-[#D92D20] rounded-full animate-pulse h-1" />
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <div className="inline-flex p-0.5 rounded-xl bg-white border border-slate-200 text-[11px] shadow-2xs">
            <button
              type="button"
              onClick={() => setLanguage('en-IN')}
              className={`px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                language === 'en-IN'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi-IN')}
              className={`px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                language === 'hi-IN'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>

      {/* Interim Live Transcript */}
      <AnimatePresence>
        {isListening && interimText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2.5 p-2.5 rounded-xl bg-white border border-blue-200 text-xs italic text-slate-700 shadow-xs"
          >
            <span className="font-bold text-[#0066FF] not-italic mr-1.5">Hearing:</span>
            "{interimText}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mt-2 text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Collapsible Example Prompts */}
      <div className="mt-2 pt-2 border-t border-slate-200/70">
        <button
          type="button"
          onClick={() => setIsPromptsOpen(prev => !prev)}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isPromptsOpen ? 'rotate-180' : ''}`} />
          <span>Example Prompts</span>
        </button>

        <AnimatePresence>
          {isPromptsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] overflow-hidden"
            >
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    isEmergency
                      ? 'कैंटीन के पास तुरंत सुरक्षा भेजो'
                      : 'कैंटीन के पास लड़ाई हो रही है'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium cursor-pointer transition-all shadow-2xs"
              >
                🇮🇳 {isEmergency ? 'सुरक्षा भेजो' : 'कैंटीन में लड़ाई'}
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    isEmergency
                      ? 'Immediate security needed near main block'
                      : 'Ragging incident near library'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium cursor-pointer transition-all shadow-2xs"
              >
                🇬🇧 {isEmergency ? 'Emergency Security' : 'Ragging Incident'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
