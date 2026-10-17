import { useCallback, useEffect, useState } from 'react';
import * as api from './api.js';
import useSettings from './useSettings.js';
import Sidebar from './components/Sidebar.jsx';
import ChatView from './components/ChatView.jsx';
import Composer from './components/Composer.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import DonateModal from './components/DonateModal.jsx';
import LoginModal from './components/LoginModal.jsx';
import LibraryModal from './components/LibraryModal.jsx';
import AboutCard from './components/AboutCard.jsx';
import Logo from './components/Logo.jsx';

const NO_KEY_NOTICE =
  "Oja isn't connected to an AI provider yet. Add your OpenRouter API key to the server .env as OPENROUTER_API_KEY and restart.";

const HISTORY_LIMIT = 20;

const asArray = (d, key) => (Array.isArray(d) ? d : d?.[key] || []);

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [models, setModels] = useState([]);
  const [model, setModel] = useState('');
  const [sending, setSending] = useState(false);
  const [modal, setModal] = useState(null); // 'settings' | 'donate' | 'login' | 'library'
  const [drawer, setDrawer] = useState(false);
  const [settings, updateSettings] = useSettings(user);

  // --- initial auth + models -------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const d = await api.me();
        setUser(d.user || null);
      } catch {
        setUser(null);
      }
      setAuthChecked(true);
      try {
        const arr = asArray(await api.getModels(), 'models');
        setModels(arr);
        if (arr[0]) setModel(arr[0].id);
      } catch {
        /* model picker stays hidden */
      }
    })();
  }, []);

  const loadChats = useCallback(async () => {
    try {
      setChats(asArray(await api.listChats(), 'chats'));
    } catch {
      /* sidebar stays empty */
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      setChats([]);
      setActiveId(null);
      setMessages([]);
    }
  }, [user, loadChats]);

  const openChat = useCallback(async (id) => {
    setActiveId(id);
    setDrawer(false);
    setMessages([]);
    try {
      setMessages(asArray(await api.getMessages(id), 'messages'));
    } catch {
      setMessages([]);
    }
  }, []);

  // --- chat flow ---------------------------------------------------------
  async function sendMessage(text) {
    const content = text.trim();
    if (!content || sending) return;
    if (!user) {
      setModal('login');
      return;
    }
    setSending(true);
    try {
      let chatId = activeId;
      if (!chatId) {
        // Assumption: POST /api/chats returns the chat object ({id, title, ...})
        // or {chat: {...}}. Both shapes are handled.
        const created = await api.createChat(content.slice(0, 42));
        chatId = created.id || created.chat?.id;
        if (!chatId) throw new Error('Could not create chat');
        setActiveId(chatId);
        loadChats();
      }

      const userMsg = { role: 'user', content };
      setMessages((prev) => [...prev, userMsg]);
      try {
        await api.saveMessage(chatId, { role: 'user', content });
      } catch {
        /* message still shown locally */
      }

      const history = [...messages, userMsg]
        .slice(-HISTORY_LIMIT)
        .map((m) => ({ role: m.role, content: m.content }));

      let reply;
      let persist = true;
      try {
        const r = await api.postChat(history, model);
        reply = { role: 'assistant', content: r.text || '', model: r.model };
      } catch (e) {
        persist = false; // degraded notices stay local, never saved to history
        if (e.data?.code === 'NO_API_KEY') {
          reply = { role: 'assistant', content: NO_KEY_NOTICE, notice: true };
        } else {
          reply = {
            role: 'assistant',
            content: 'Something went wrong reaching Oja. Please try again.',
            error: true,
          };
        }
      }
      setMessages((prev) => [...prev, reply]);
      if (persist) {
        try {
          await api.saveMessage(chatId, {
            role: 'assistant',
            content: reply.content,
            model: reply.model,
          });
        } catch {
          /* already shown locally */
        }
      }
    } finally {
      setSending(false);
    }
  }

  // --- chat management ---------------------------------------------------
  const handleNew = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setDrawer(false);
  }, []);

  async function handleRename(id, title) {
    const t = title.trim();
    if (!t) return;
    try {
      await api.renameChat(id, t);
      setChats((cs) => cs.map((c) => (c.id === id ? { ...c, title: t } : c)));
    } catch {
      /* keep old title */
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteChat(id);
      setChats((cs) => cs.filter((c) => c.id !== id));
      if (id === activeId) {
        setActiveId(null);
        setMessages([]);
      }
    } catch {
      /* chat remains */
    }
  }

  // --- auth ---------------------------------------------------------------
  const handleAuth = useCallback((u) => {
    setUser(u);
    setModal(null);
  }, []);

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      /* session already gone */
    }
    setUser(null);
  }

  const closeModal = () => setModal(null);

  if (!authChecked) {
    return (
      <div className="boot">
        <Logo size={48} />
      </div>
    );
  }

  return (
    <div className="app">
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}

      <Sidebar
        open={drawer}
        chats={chats}
        activeId={activeId}
        onSelect={openChat}
        onNew={handleNew}
        onRename={handleRename}
        onDelete={handleDelete}
        user={user}
        onLogin={() => setModal('login')}
        onLogout={handleLogout}
        onOpenLibrary={() => setModal('library')}
        onOpenDonate={() => setModal('donate')}
        showAd={settings.showAd !== false}
      />

      <main className="main">
        <header className="main-header">
          <button
            className="icon-btn menu-btn"
            onClick={() => setDrawer((d) => !d)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <span className="header-brand">
            <Logo size={26} />
            <span>Oja</span>
          </span>
          {models.length > 0 && (
            <select
              className="field model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              aria-label="Choose model"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} title={m.note || ''}>
                  {m.label || m.id}
                </option>
              ))}
            </select>
          )}
          <span className="header-spacer" />
          <button
            className="icon-btn"
            onClick={() => setModal('settings')}
            title="Settings"
            aria-label="Open settings"
          >
            ⚙
          </button>
        </header>

        {activeId ? (
          <>
            <ChatView
              messages={messages}
              sending={sending}
              voice={{ voiceLang: settings.voiceLang, voiceSpeed: settings.voiceSpeed }}
            />
            <Composer
              onSend={sendMessage}
              disabled={sending}
              voiceLang={settings.voiceLang}
              placeholder="Message Oja…"
            />
          </>
        ) : (
          <div className="welcome">
            <Logo size={72} />
            <h1>Hi, I'm Oja</h1>
            <p className="muted">I'm Oja, your AI assistant created by Dipesh.</p>
            {user ? (
              <div className="welcome-composer">
                <Composer
                  onSend={sendMessage}
                  disabled={sending}
                  voiceLang={settings.voiceLang}
                  autoFocus
                  placeholder="Message Oja…"
                />
              </div>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={() => setModal('login')}>
                Log in to start chatting
              </button>
            )}
          </div>
        )}
      </main>

      <aside className="rail" aria-label="About the creator">
        <AboutCard />
      </aside>

      {modal === 'settings' && (
        <SettingsModal
          settings={settings}
          onChange={updateSettings}
          onClose={closeModal}
          user={user}
          onUser={setUser}
        />
      )}
      {modal === 'donate' && <DonateModal onClose={closeModal} />}
      {modal === 'login' && <LoginModal onClose={closeModal} onAuth={handleAuth} />}
      {modal === 'library' && <LibraryModal onClose={closeModal} />}
    </div>
  );
}
