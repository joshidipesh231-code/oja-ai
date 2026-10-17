import { useState } from 'react';
import Logo from './Logo.jsx';
import AboutCard from './AboutCard.jsx';
import AdSlot from './AdSlot.jsx';
import { AvatarIcon } from './Avatars.jsx';

export default function Sidebar({
  open,
  chats,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  user,
  onLogin,
  onLogout,
  onOpenLibrary,
  onOpenDonate,
  showAd,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  const startRename = (chat) => {
    setEditingId(chat.id);
    setDraft(chat.title || '');
  };

  const commitRename = () => {
    if (editingId != null) {
      onRename(editingId, draft);
      setEditingId(null);
    }
  };

  const label = user ? user.email || user.phone || 'Account' : null;

  return (
    <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Oja navigation">
      <div className="brand">
        <Logo size={34} />
        <div className="brand-text">
          <span className="brand-name">Oja</span>
          <span className="brand-sub">created by Dipesh</span>
        </div>
      </div>

      <button className="btn btn-primary btn-block" onClick={onNew}>
        <span aria-hidden="true">+</span> New chat
      </button>

      <div className="history">
        <div className="history-label">Chats</div>
        {chats.length === 0 ? (
          <p className="muted small">No chats yet — start one above.</p>
        ) : (
          <ul className="chat-list">
            {chats.map((chat) => (
              <li
                key={chat.id}
                className={`chat-item${chat.id === activeId ? ' active' : ''}`}
              >
                {editingId === chat.id ? (
                  <input
                    className="field chat-rename"
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    aria-label="Rename chat"
                  />
                ) : (
                  <>
                    <button
                      className="chat-title"
                      onClick={() => onSelect(chat.id)}
                      title={chat.title}
                    >
                      {chat.title || 'Untitled chat'}
                    </button>
                    <span className="chat-actions">
                      <button
                        className="mini-btn"
                        onClick={() => startRename(chat)}
                        title="Rename chat"
                        aria-label={`Rename ${chat.title || 'chat'}`}
                      >
                        ✎
                      </button>
                      <button
                        className="mini-btn danger"
                        onClick={() => {
                          if (window.confirm('Delete this chat?')) onDelete(chat.id);
                        }}
                        title="Delete chat"
                        aria-label={`Delete ${chat.title || 'chat'}`}
                      >
                        🗑
                      </button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sidebar-foot">
        <button className="btn btn-ghost btn-block" onClick={onOpenLibrary}>
          📚 Library · 5 GB
        </button>
        <button className="btn btn-ghost btn-block" onClick={onOpenDonate}>
          ❤ Donate
        </button>
        {user ? (
          <div className="user-chip">
            <AvatarIcon id={user.avatar} size={30} />
            <span className="user-label" title={label}>
              {label}
            </span>
            <button className="mini-btn" onClick={onLogout} title="Log out">
              ⎋
            </button>
          </div>
        ) : (
          <button className="btn btn-ghost btn-block" onClick={onLogin}>
            Log in
          </button>
        )}
        <AdSlot showAd={showAd} />
        <div className="sidebar-rail-about">
          <AboutCard compact />
        </div>
      </div>
    </aside>
  );
}
