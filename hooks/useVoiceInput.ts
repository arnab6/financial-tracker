import { useState, useEffect, useCallback } from "react";

interface UseVoiceInputReturn {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    error: string | null;
    notSupported: boolean;
}

export function useVoiceInput(): UseVoiceInputReturn {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [notSupported, setNotSupported] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition =
                (window as any).SpeechRecognition ||
                (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setNotSupported(true);
                return;
            }

            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = "en-US"; // Configurable?

            recognitionInstance.onstart = () => setIsListening(true);
            recognitionInstance.onend = () => setIsListening(false);
            recognitionInstance.onerror = (event: any) => {
                setError(event.error);
                setIsListening(false);
            };

            recognitionInstance.onresult = (event: any) => {
                let finalTranscript = "";
                let interimTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                // Basic accumulation logic - user might want to edit.
                // We actually want to *append* to existing if continuous? 
                // For now, let's just expose the current session transcript.
                // Or better: update state.

                // Actually, for a simple input, let's just return what we hear currently.
                // Using "continuous" makes it tricky to sync with specific input box cursor.
                // Let's rely on the user stopping and we get the full text.

                // Simpler approach for this app: Update transcript state with the LATEST total.
                // NOTE: SpeechRecognition accumulates results in the event.

                // Correct logic for gathering all text from the session:
                // (already implemented above pretty much, but we need to join it)

                // Actually, let's just grab the latest result 
                const currentText = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('');
                setTranscript(currentText);
            };

            setRecognition(recognitionInstance);
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognition && !isListening) {
            try {
                recognition.start();
                setError(null);
            } catch (err) {
                console.error(err);
            }
        }
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if (recognition && isListening) {
            recognition.stop();
        }
    }, [recognition, isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript("");
    }, []);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        error,
        notSupported,
    };
}
