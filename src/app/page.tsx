"use client";
import { useRef, useState, useEffect } from "react";

const LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "es-MX", label: "Spanish (Mexico)" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "ar-SA", label: "Arabic" },
  { code: "zh-CN", label: "Chinese (Mandarin)" },
  { code: "ru-RU", label: "Russian" },
  { code: "hi-IN", label: "Hindi" },
  // Add more as needed
];

export default function Home() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const [inputLang, setInputLang] = useState("en-US");
  const [outputLang, setOutputLang] = useState("es-ES");
  const [error, setError] = useState("");
  const recognitionRef = useRef<unknown>(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition API not supported in this browser.');
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = inputLang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: unknown) => {
      if (!event || typeof event !== 'object' || !('resultIndex' in event) || !('results' in event)) return;
      const evt = event as { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] };
      let final = '';
      for (let i = evt.resultIndex; i < evt.results.length; ++i) {
        if (evt.results[i].isFinal) {
          final += evt.results[i][0].transcript;
        }
      }
      if (final) setTranscript((prev) => (prev ? prev + ' ' : '') + final);
    };
    recognition.onend = () => setListening(false);
    (recognitionRef.current as any) = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    (recognitionRef.current as any)?.stop();
    setListening(false);
  };

  const handleTranslate = async () => {
    setError("");
    setTranslated("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcript.replace(/ \[interim\].*$/, ""),
          from: inputLang,
          to: outputLang,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setTranslated("");
      } else {
        setTranslated(data.translated || "");
      }
    } catch {
      setError("Translation failed. Please try again.");
      setTranslated("");
    }
  };

  const handleSpeak = () => {
    if (!translated) return;
    const synth = window.speechSynthesis;
    const utter = new window.SpeechSynthesisUtterance(translated);
    utter.lang = outputLang;
    synth.speak(utter);
  };

  // Automatically translate when transcript changes
  useEffect(() => {
    if (transcript.replace(/ \[interim\].*$/, "").trim()) {
      handleTranslate();
    } else {
      setTranslated("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, inputLang, outputLang]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-2 sm:p-4 gap-4 bg-gradient-to-br from-blue-50 to-blue-100">
      <h1 className="text-xl sm:text-3xl font-bold mb-2 text-blue-900 text-center drop-shadow px-2">Healthcare Translator</h1>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full max-w-2xl mb-2">
        <div className="flex flex-col gap-2 w-full sm:w-1/2">
          <label className="font-semibold text-blue-900 text-sm sm:text-base" htmlFor="inputLang">Input Language</label>
          <select
            id="inputLang"
            className="p-3 sm:p-2 rounded border border-blue-300 bg-white text-gray-900 text-base sm:text-lg"
            value={inputLang}
            onChange={e => setInputLang(e.target.value)}
            disabled={listening}
            title="Select the language you will speak or type in"
            style={{ touchAction: 'manipulation' }}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-1/2">
          <label className="font-semibold text-blue-900 text-sm sm:text-base" htmlFor="outputLang">Output Language</label>
          <select
            id="outputLang"
            className="p-3 sm:p-2 rounded border border-blue-300 bg-white text-gray-900 text-base sm:text-lg"
            value={outputLang}
            onChange={e => setOutputLang(e.target.value)}
            title="Select the language for translation"
            style={{ touchAction: 'manipulation' }}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl justify-center bg-white rounded-xl shadow p-2 sm:p-4 border border-blue-200">
        <div className="flex-1 bg-white rounded-xl p-2 sm:p-4 min-h-[120px] sm:min-h-[140px] shadow-none sm:shadow flex flex-col border border-blue-200">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <h2 className="font-semibold text-blue-900 text-base sm:text-lg">Transcript</h2>
            <button
              onClick={listening ? stopListening : startListening}
              className={`flex items-center gap-2 px-3 py-2 sm:py-1.5 rounded-full text-white font-semibold transition focus:outline-none text-sm sm:text-base ${listening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-700 hover:bg-blue-800'}`}
              title={listening ? 'Stop microphone' : '🎤 Speak'}
            >
              <span className="text-lg sm:text-base">{listening ? '🛑 Stop' : '🎤 Speak'}</span>
            </button>
          </div>
          <textarea
            className="w-full min-h-[60px] sm:min-h-[80px] p-2 border border-blue-300 rounded mb-2 text-gray-900 bg-blue-50 focus:ring-2 focus:ring-blue-300 text-base sm:text-lg resize-none"
            value={transcript.replace(/ \[interim\].*$/, "")}
            onChange={e => setTranscript(e.target.value)}
            placeholder="Type or speak here..."
            disabled={listening}
            title="Type or use the microphone to enter text"
            style={{ touchAction: 'manipulation' }}
          />
          <span className="text-xs sm:text-sm text-gray-500">You can type or use the microphone.</span>
        </div>
        <div className="flex-1 bg-white rounded-xl p-2 sm:p-4 min-h-[120px] sm:min-h-[140px] shadow-none sm:shadow border border-blue-200 flex flex-col mt-2 sm:mt-0">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <h2 className="font-semibold text-blue-900 text-base sm:text-lg">Translation</h2>
            <button
              className="flex items-center gap-2 px-3 py-2 sm:py-1.5 rounded-full bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:bg-gray-300 text-sm sm:text-base"
              onClick={handleSpeak}
              disabled={!translated}
              title="Play translated text as audio"
            >
              <span className="text-lg sm:text-base">🔊 Speak</span>
            </button>
          </div>
          <div className="flex-1 flex items-center">
            <p className="whitespace-pre-wrap break-words text-gray-900 font-medium min-h-[32px] sm:min-h-[40px] text-base sm:text-lg">{translated || '...waiting for translation'}</p>
          </div>
          {error && <div className="text-red-600 text-xs mt-2 font-semibold">{error}</div>}
        </div>
      </div>
      <p className="text-xs sm:text-sm text-blue-900 mt-4 max-w-xl text-center font-semibold px-2">No data is stored. All processing is in-memory and uses browser and OpenAI APIs. For medical use, always verify translations with a professional interpreter.</p>
    </div>
  );
}
