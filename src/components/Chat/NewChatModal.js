import React, { useState } from 'react';
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { FiX, FiSearch } from 'react-icons/fi';
import './Chat.css';

export default function NewChatModal({ onClose }) {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function searchUser(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    if (email === currentUser.email) {
      setError("You can't chat with yourself.");
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'users'), where('email', '==', email.trim()));
    const snap = await getDocs(q);
    if (snap.empty) {
      setError('No user found with that email.');
    } else {
      setResult({ id: snap.docs[0].id, ...snap.docs[0].data() });
    }
    setLoading(false);
  }

  async function startChat() {
    const existingQ = query(
      collection(db, 'chats'),
      where('members', 'array-contains', currentUser.uid),
      where('isGroup', '==', false)
    );
    const snap = await getDocs(existingQ);
    const existing = snap.docs.find((d) =>
      d.data().members.includes(result.uid)
    );
    if (existing) {
      onClose();
      return;
    }
    await addDoc(collection(db, 'chats'), {
      members: [currentUser.uid, result.uid],
      memberNames: {
        [currentUser.uid]: currentUser.displayName,
        [result.uid]: result.displayName,
      },
      isGroup: false,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      lastMessage: '',
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Chat</h3>
          <button onClick={onClose}><FiX /></button>
        </div>
        <p className="modal-subtitle">Search by email address</p>
        <form onSubmit={searchUser} className="modal-search">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@email.com"
            required
          />
          <button type="submit" disabled={loading}>
            <FiSearch />
          </button>
        </form>
        {error && <div className="modal-error">{error}</div>}
        {result && (
          <div className="user-result">
            <div className="user-result-avatar">{result.displayName?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-result-name">{result.displayName}</div>
              <div className="user-result-email">{result.email}</div>
            </div>
            <button className="btn-start-chat" onClick={startChat}>Chat</button>
          </div>
        )}
      </div>
    </div>
  );
}
