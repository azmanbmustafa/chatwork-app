import React, { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, doc, updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import './Chat.css';

export default function ChatWindow({ chat }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!chat) return;
    const q = query(
      collection(db, 'chats', chat.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [chat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    await addDoc(collection(db, 'chats', chat.id, 'messages'), {
      text,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'chats', chat.id), {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
    });
    setSending(false);
  }

  function getChatName() {
    if (!chat) return '';
    if (chat.isGroup) return chat.name;
    const otherId = chat.members.find((m) => m !== currentUser.uid);
    return chat.memberNames?.[otherId] || 'Unknown';
  }

  if (!chat) {
    return (
      <div className="chat-window empty-window">
        <FiMessageSquare size={60} />
        <h3>Select a chat to start messaging</h3>
        <p>Or create a new chat from the sidebar</p>
      </div>
    );
  }

  let lastDate = null;

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="chat-window-avatar">
          {chat.isGroup ? '👥' : '👤'}
        </div>
        <div>
          <div className="chat-window-name">{getChatName()}</div>
          <div className="chat-window-sub">
            {chat.isGroup ? `${chat.members.length} members` : 'Direct message'}
          </div>
        </div>
      </div>

      <div className="messages-area">
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUser.uid;
          const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
          const dateStr = format(msgDate, 'MMMM d, yyyy');
          const showDate = dateStr !== lastDate;
          lastDate = dateStr;

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="date-divider"><span>{dateStr}</span></div>
              )}
              <div className={`message ${isOwn ? 'own' : 'other'}`}>
                {!isOwn && chat.isGroup && (
                  <div className="msg-sender-name">{msg.senderName}</div>
                )}
                <div className="msg-bubble">
                  <span className="msg-text">{msg.text}</span>
                  <span className="msg-time">
                    {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : ''}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="message-input-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          autoComplete="off"
        />
        <button type="submit" disabled={!newMessage.trim() || sending}>
          <FiSend />
        </button>
      </form>
    </div>
  );
}
