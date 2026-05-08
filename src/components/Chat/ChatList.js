import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { FiEdit, FiUsers, FiMessageSquare, FiLogOut } from 'react-icons/fi';
import NewChatModal from './NewChatModal';
import NewGroupModal from './NewGroupModal';
import './Chat.css';

export default function ChatList({ onSelectChat, selectedChatId }) {
  const { currentUser, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser]);

  function getChatName(chat) {
    if (chat.isGroup) return chat.name;
    const otherId = chat.members.find((m) => m !== currentUser.uid);
    return chat.memberNames?.[otherId] || 'Unknown';
  }

  function getAvatar(chat) {
    if (chat.isGroup) return '👥';
    return '👤';
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <div className="header-title">
          <span className="app-logo">💬</span>
          <h2>ChatWork</h2>
        </div>
        <div className="header-actions">
          <button title="New Chat" onClick={() => setShowNewChat(true)}><FiEdit /></button>
          <button title="New Group" onClick={() => setShowNewGroup(true)}><FiUsers /></button>
          <button title="Logout" onClick={logout}><FiLogOut /></button>
        </div>
      </div>

      <div className="user-info-bar">
        <div className="user-avatar-sm">
          {currentUser?.displayName?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="user-name-sm">{currentUser?.displayName}</div>
          <div className="user-email-sm">{currentUser?.email}</div>
        </div>
      </div>

      <div className="chats-scroll">
        {chats.length === 0 && (
          <div className="empty-chats">
            <FiMessageSquare size={40} />
            <p>No chats yet</p>
            <span>Start a new chat!</span>
          </div>
        )}
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
            onClick={() => onSelectChat(chat)}
          >
            <div className="chat-avatar">{getAvatar(chat)}</div>
            <div className="chat-info">
              <div className="chat-name">{getChatName(chat)}</div>
              <div className="chat-last-msg">{chat.lastMessage || 'No messages yet'}</div>
            </div>
            <div className="chat-time">
              {chat.lastMessageAt?.toDate
                ? formatDistanceToNow(chat.lastMessageAt.toDate(), { addSuffix: false })
                : ''}
            </div>
          </div>
        ))}
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} />}
    </div>
  );
}
