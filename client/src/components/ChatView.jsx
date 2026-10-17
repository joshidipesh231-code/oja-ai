import { useEffect, useRef, useState } from 'react';
import Logo from './Logo.jsx';

function speak(text, { voiceLang, voiceSpeed }) {
  const synth = window.speechSynthesis;
  if (!synth) return false;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = Number(voiceSpeed) || 1;
  if (voiceLang && voiceLang !== 'auto') {
    const match = synth
      .getVoices()
      .find((v) => v.lang && v.lang.toLowerCase().startsWith(voiceLang.toLowerCase()));
    if (match) u.voice = match;
    else u.lang = voiceLang;
  }
  synth.speak(u);
  return true;
}

function Message({ msg, voice, onToggleSpeech, speaking }) {
  const isUser = msg.role === 'user';
  const cls = `msg${isUser ? ' user' : ' assistant'}${msg.notice ? ' notice' : ''}${
    msg.error ? ' error' : ''
  }`;
  return (
    <div className={cls}>
      {!isUser && (
        <span className="msg-avatar">
          <Logo size={26} />
        </span>
      )}
      <div className="bubble">
        <div className="content">{msg.content}</div>
        {!isUser && !msg.notice && msg.content && (
          <button
            className="speak-btn"
            onClick={() => onToggleSpeech(msg)}
            title={speaking ? 'Stop reading aloud' : 'Read aloud'}
            aria-label={speaking ? 'Stop reading aloud' : 'Read aloud'}
          >
            {speaking ? '⏹' : '🔊'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatView({ messages, sending, voice }) {
  const scrollRef = useRef(null);
  const [speakingId, setSpeakingId] = useState(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    // Voices can load asynchronously; warm them up. Stop speech on unmount.
    window.speechSynthesis?.getVoices();
    return () => window.speechSynthesis?.cancel();
  }, []);

  const toggleSpeech = (msg) => {
    const id = msg.id ?? msg.content;
    if (speakingId === id) {
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
      return;
    }
    const ok = speak(msg.content, voice || {});
    setSpeakingId(ok ? id : null);
    if (ok) {
      // Clear the indicator when the utterance naturally ends.
      const iv = setInterval(() => {
        if (!window.speechSynthesis?.speaking) {
          setSpeakingId(null);
          clearInterval(iv);
        }
      }, 500);
    }
  };

  return (
    <div className="chat-scroll" ref={scrollRef} aria-live="polite">
      <div className="chat-inner">
        {messages.map((m, i) => (
          <Message
            key={m.id ?? i}
            msg={m}
            voice={voice}
            onToggleSpeech={toggleSpeech}
            speaking={speakingId === (m.id ?? m.content)}
          />
        ))}
        {sending && (
          <div className="msg assistant">
            <span className="msg-avatar">
              <Logo size={26} />
            </span>
            <div className="bubble typing" aria-label="Oja is typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
