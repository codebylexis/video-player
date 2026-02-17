import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
}

interface UseVoiceControlProps {
  commands: VoiceCommand[];
  enabled?: boolean;
}

export function useVoiceControl({ commands, enabled = true }: UseVoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
      toast.info("Voice control active", {
        description: "Listening for commands: Play, Pause, Rewind, Fast Forward",
        duration: 3000,
      });
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      // Auto-restart if it was supposed to be enabled
      if (enabled && !error) {
        try {
          recognitionInstance.start();
        } catch (e) {
          // Ignore errors if already started
        }
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied.');
        toast.error("Microphone access denied");
      }
    };

    recognitionInstance.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const text = lastResult[0].transcript.trim().toLowerCase();
        setTranscript(text);
        processCommand(text);
      }
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.stop();
    };
  }, [enabled]);

  const processCommand = useCallback((text: string) => {
    console.log('Voice command received:', text);
    
    // Simple fuzzy matching or direct matching
    const matchedCommand = commands.find(cmd => 
      text.includes(cmd.command.toLowerCase())
    );

    if (matchedCommand) {
      matchedCommand.action();
      toast.success(`Command recognized: "${matchedCommand.command}"`, {
        icon: '🎙️',
        duration: 2000,
      });
    }
  }, [commands]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  }, [isListening, recognition]);

  // Start/Stop based on enabled prop
  useEffect(() => {
    if (!recognition) return;

    if (enabled && !isListening) {
      try {
        recognition.start();
      } catch (e) {
        // Already started or other error
      }
    } else if (!enabled && isListening) {
      recognition.stop();
    }
  }, [enabled, recognition, isListening]);

  return {
    isListening,
    transcript,
    error,
    toggleListening,
    isSupported: !!recognition
  };
}

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
