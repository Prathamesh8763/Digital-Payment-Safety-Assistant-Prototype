import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, AlertCircle, Check } from 'lucide-react';

export default function VoiceInput({ onTranscriptReady, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
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
      setSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  const handleToggleRecord = () => {
    setErrorMsg(null);
    if (!supported) {
      setErrorMsg('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsRecording(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
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

  if (!supported) {
    return (
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
        🎙️ Voice speech recognition available in Chrome, Edge, Safari, and Android browsers.
      </div>
    );
  }

  return (
    <div style={{ margin: '0.75rem 0', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={handleToggleRecord}
          disabled={disabled}
          className="btn"
          style={{
            background: isRecording ? '#dc2626' : '#475569',
            color: 'white',
            padding: '0.45rem 0.9rem',
            fontSize: '0.85rem',
            minHeight: '38px',
            borderRadius: '20px'
          }}
        >
          {isRecording ? (
            <>
              <Square size={14} style={{ fill: 'white' }} /> Stop Recording (Listening...)
            </>
          ) : (
            <>
              <Mic size={14} /> Speak Suspicious Message (Voice Input)
            </>
          )}
        </button>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          🔒 Privacy Notice: Speech is transcribed locally via browser API. Audio is never sent to external servers.
        </span>
      </div>

      {isRecording && (
        <div style={{ marginTop: '0.5rem', color: '#dc2626', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' }}></span>
          Microphone active. Speak what the caller or message said...
        </div>
      )}

      {errorMsg && (
        <div style={{ marginTop: '0.5rem', color: '#991b1b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      {transcript && !isRecording && (
        <div style={{ marginTop: '0.65rem', padding: '0.5rem', background: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Review Transcribed Text:
          </div>
          <p style={{ fontSize: '0.88rem', color: '#1e293b', fontStyle: 'italic', marginBottom: '0.5rem' }}>
            "{transcript}"
          </p>
          <button
            type="button"
            onClick={handleApplyTranscript}
            className="btn btn-primary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', minHeight: '32px' }}
          >
            <Check size={14} /> Insert into Message Box
          </button>
        </div>
      )}
    </div>
  );
}
