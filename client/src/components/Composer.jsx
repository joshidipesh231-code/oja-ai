import { useEffect, useRef, useState } from 'react';

const MAX_LINES = 4;

export default function Composer({
  onSend,
  disabled = false,
  placeholder = 'Message Oja…',
  voiceLang = 'auto',
  autoFocus = false,
}) {
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState('');
  const taRef = useRef(null);
  const recRef = useRef(null);
  const baseRef = useRef('');

  const autogrow = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 22;
    ta.style.height = Math.min(ta.scrollHeight, lineHeight * MAX_LINES) + 'px';
  };

  useEffect(() => {
    if (autoFocus) taRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => () => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
  }, []);

  const send = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    requestAnimationFrame(autogrow);
  };

  const toggleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMicError("Voice input isn't supported in this browser.");
      return;
    }
    if (listening) {
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
      return;
    }
    setMicError('');
    const rec = new SR();
    recRef.current = rec;
    rec.interimResults = true;
    rec.continuous = false;
    if (voiceLang && voiceLang !== 'auto') rec.lang = voiceLang;
    baseRef.current = value ? value + ' ' : '';

    rec.onresult = (e) => {
      let interim = '';
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setValue(baseRef.current + finalText + interim);
      requestAnimationFrame(autogrow);
    };
    rec.onerror = () => {
      setListening(false);
      setMicError('Microphone unavailable — check permission and try again.');
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      setMicError('Could not start voice input.');
    }
  };

  return (
    <div className="composer-wrap">
      <div className="composer-inner">
        {micError && (
          <div className="mic-error" role="status">
            {micError}
          </div>
        )}
        <div className={`composer${disabled ? ' disabled' : ''}`}>
          <textarea
            ref={taRef}
            rows={1}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autogrow();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            aria-label="Message Oja"
          />
          <button
            type="button"
            className={`icon-btn mic-btn${listening ? ' recording' : ''}`}
            onClick={toggleMic}
            title={listening ? 'Stop listening' : 'Voice input'}
            aria-label={listening ? 'Stop listening' : 'Voice input'}
            aria-pressed={listening}
          >
            {listening ? '⏹' : '🎙'}
          </button>
          <button
            type="button"
            className="send-btn"
            onClick={send}
            disabled={disabled || !value.trim()}
            title="Send"
            aria-label="Send message"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
