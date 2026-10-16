import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Check } from 'lucide-react';
import Button from './ui/Button';
import Alert from './ui/Alert';

/**
 * Check if Web Speech API is supported
 */
function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function VoiceInput({ onTranscriptReady, disabled }) {
  const SpeechRecognitionAPI = getSpeechRecognition();
  const isSupported = Boolean(SpeechRecognitionAPI);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!SpeechRecognitionAPI) return;

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English / general English default

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentText.trim());
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (event.error !== 'no-speech') {
          setErrorMsg(`Voice input error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition initialization error:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [SpeechRecognitionAPI]);

  const handleToggleRecord = () => {
    setErrorMsg(null);
    if (!isSupported || !recognitionRef.current) {
      setErrorMsg('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error
      }
      setIsRecording(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setErrorMsg('Could not access microphone. Ensure permissions are granted.');
        setIsRecording(false);
      }
    }
  };

  const handleApplyTranscript = () => {
    if (transcript.trim()) {
      onTranscriptReady(transcript.trim());
      setTranscript('');
    }
  };

  if (!isSupported) {
    return (
      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
        🎙️ Voice speech recognition is available in Chrome, Edge, Safari, and Android browsers.
      </div>
    );
  }

  return (
    <div style={{ margin: '0.75rem 0', padding: '0.75rem', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Button
          type="button"
          onClick={handleToggleRecord}
          disabled={disabled}
          variant={isRecording ? 'destructive' : 'secondary'}
          leftIcon={isRecording ? Square : Mic}
          style={{
            padding: '0.4rem 0.9rem',
            fontSize: 'var(--font-size-xs)',
            minHeight: '38px',
            borderRadius: 'var(--radius-full)'
          }}
          aria-pressed={isRecording}
        >
          {isRecording ? 'Stop Recording (Listening...)' : 'Speak Suspicious Message (Voice Input)'}
        </Button>

        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
          🔒 Privacy Notice: Speech is transcribed locally via browser API. Audio is never sent to external servers.
        </span>
      </div>

      {isRecording && (
        <div style={{ marginTop: '0.5rem', color: 'var(--danger)', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} aria-hidden="true"></span>
          <span>Microphone active. Speak what the caller or message claimed...</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ marginTop: '0.5rem' }}>
          <Alert variant="error" onDismiss={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        </div>
      )}

      {transcript && !isRecording && (
        <div style={{ marginTop: '0.65rem', padding: '0.75rem', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Review Transcribed Text:
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
            "{transcript}"
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={handleApplyTranscript}
            leftIcon={Check}
            style={{ padding: '0.35rem 0.75rem', fontSize: 'var(--font-size-xs)', minHeight: '36px' }}
          >
            Insert into Message Box
          </Button>
        </div>
      )}
    </div>
  );
}
