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
    <div className={`p-3.5 rounded-2xl border transition-all ${
      isEmergency
        ? 'bg-red-500/5 border-red-500/20 dark:bg-red-950/20 dark:border-red-900/40'
        : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
    } ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Mic Control Button */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
              isListening
                ? 'bg-red-600 text-white animate-pulse shadow-red-500/30 ring-2 ring-red-400'
                : isEmergency
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                  : 'bg-campus-600 hover:bg-campus-700 text-white shadow-campus-600/20'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5 animate-bounce" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Live Voice Dictate</span>
              </>
            )}
          </motion.button>

          {/* Audio Visualizer Waves when listening */}
          {isListening && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Listening</span>
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 bg-red-600 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-full" />
                <span className="w-1 bg-red-600 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2" />
                <span className="w-1 bg-red-600 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-3" />
                <span className="w-1 bg-red-600 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-1.5" />
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher (Hindi / English) */}
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-slate-400" />
          <div className="inline-flex p-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setLanguage('en-IN')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                language === 'en-IN'
                  ? 'bg-white dark:bg-slate-700 text-campus-700 dark:text-campus-300 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🇬🇧 English (IN)
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi-IN')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                language === 'hi-IN'
                  ? 'bg-white dark:bg-slate-700 text-campus-700 dark:text-campus-300 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🇮🇳 हिंदी (Hindi)
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
            className="mt-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs italic text-slate-600 dark:text-slate-300"
          >
            <span className="font-semibold text-campus-600 not-italic mr-1.5">Live Transcript:</span>
            "{interimText}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-900/40">
          {errorMessage}
        </div>
      )}

      {/* Quick Hackathon Presets for Instant 1-Click Demo */}
      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-campus-500" />
          <span>Demo Voice Presets:</span>
        </span>
        <button
          type="button"
          onClick={() =>
            applyPreset(
              isEmergency
                ? 'दो लोग मेन कैंटीन के पास डंडों के साथ लड़ाई कर रहे हैं, तुरंत सिक्योरिटी भेजो!'
                : 'Mechanical lab ke piche do log ladayi kar rahe hain aur threats de rahe hain.'
            )
          }
          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-campus-50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
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
          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-campus-50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          🇬🇧 Sample English Prompt
        </button>
      </div>
    </div>
  );
};
