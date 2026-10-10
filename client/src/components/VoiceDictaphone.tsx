import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Globe, Sparkles, Volume2, CheckCircle2 } from 'lucide-react';

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
      setIsListening(false);
      setErrorMessage(e.message || 'Microphone start failed.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Hackathon Preset Demonstrations (ensures 100% reliability during live presentation)
  const applyPreset = (text: string) => {
    onTranscript(text);
    setErrorMessage(null);
  };

  return (
    <div className={`p-3 rounded-2xl transition-all ${
      isEmergency
        ? 'bg-rose-950/20 border border-rose-500/30'
        : 'glass-panel'
    } ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Mic Control Button */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                : isEmergency
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(14,141,231,0.25)]'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5 animate-bounce" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Dictate</span>
              </>
            )}
          </motion.button>

          {isListening && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-mono">
              <span>LISTENING</span>
              <div className="flex items-end gap-0.5 h-2.5">
                <span className="w-1 bg-rose-500 rounded-full animate-pulse h-full" />
                <span className="w-1 bg-rose-500 rounded-full animate-pulse h-2" />
                <span className="w-1 bg-rose-500 rounded-full animate-pulse h-1" />
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1">
          <Globe className="w-3 h-3 text-slate-400" />
          <div className="inline-flex p-0.5 rounded-xl glass-pill text-[11px]">
            <button
              type="button"
              onClick={() => setLanguage('en-IN')}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                language === 'en-IN'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi-IN')}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                language === 'hi-IN'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
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
            className="mt-2 p-2 rounded-xl glass-pill text-xs italic text-slate-300"
          >
            <span className="font-semibold text-sky-400 not-italic mr-1.5">Hearing:</span>
            "{interimText}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mt-2 text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
          {errorMessage}
        </div>
      )}

      {/* Quick Presets */}
      <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="text-slate-400 font-medium">Quick Prompts:</span>
        <button
          type="button"
          onClick={() =>
            applyPreset(
              isEmergency
                ? 'दो लोग मेन कैंटीन के पास डंडों के साथ लड़ाई कर रहे हैं, तुरंत सिक्योरिटी भेजो!'
                : 'Mechanical lab ke piche do log ladayi kar rahe hain aur threats de rahe hain.'
            )
          }
          className="px-2 py-0.5 rounded-lg glass-pill text-slate-300 hover:text-white cursor-pointer hover:border-white/20 transition-all"
        >
          🇮🇳 Sample Hindi Prompt
        </button>
        <button
          type="button"
          onClick={() =>
            applyPreset(
              isEmergency
                ? 'Immediate assistance required! An intruder is threatening students near Electronics Lab corridor.'
                : 'Someone is repeatedly following female students near the hostel back gate after 6 PM.'
            )
          }
          className="px-2 py-0.5 rounded-lg glass-pill text-slate-300 hover:text-white cursor-pointer hover:border-white/20 transition-all"
        >
          🇬🇧 Sample English Prompt
        </button>
      </div>
    </div>
  );
};
