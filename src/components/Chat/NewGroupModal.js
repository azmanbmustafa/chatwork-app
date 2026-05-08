import React, { useState } from 'react';
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { FiX, FiUserPlus, FiTrash2 } from 'react-icons/fi';
import './Chat.css';

export default function NewGroupModal({ onClose }) {
  const { currentUser } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  async function addMember(e) {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (trimmed === currentUser.email.toLowerCase()) {
      setError("You're already in the group.");
      return;
    }
    if (members.find((m) => m.email?.toLowerCase() === trimmed)) {
      setError('This person is already added.');
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', trimmed));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError('No user found. Make sure they have registered first.');
      } else {
        setMembers([...members, { id: snap.docs[0].id, ...snap.docs[0].data() }]);
        setEmail('');
      }
    } catch (err) {
      setError('Search failed. Please try again.');
    }
    setLoading(false);
  }

  async function createGroup() {
    if (!groupName.trim()) return setError('Group name is required.');
    if (members.length < 1) return setError('Add at least one member.');
    setCreating(true);
    setError('');
    try {
      const allMemberIds = [currentUser.uid, ...members.map((m) => m.uid)];
      const memberNames = { [currentUser.uid]: currentUser.displayName };
      members.forEach((m) => { memberNames[m.uid] = m.displayName; });

      await addDoc(collection(db, 'chats'), {
        name: groupName.trim(),
        members: allMemberIds,
        memberNames,
        isGroup: true,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessage: '',
      });
      onClose();
    } catch (err) {
      setError('Failed to create group. Please try again.');
    }
    setCreating(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Group</h3>
          <button onClick={onClose}><FiX /></button>
        </div>

        <div className="form-group">
          <label>Group Name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Family, Team, Friends"
          />
        </div>

        <p className="modal-subtitle">Add members by email (must be registered)</p>
        <form onSubmit={addMember} className="modal-search">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@email.com"
          />
          <button type="submit" disabled={loading}>
            {loading ? '...' : <FiUserPlus />}
          </button>
        </form>

        {error && <div className="modal-error">{error}</div>}

        {members.length > 0 && (
          <div className="members-list">
            {members.map((m) => (
              <div key={m.uid} className="member-tag">
                <span>{m.displayName}</span>
                <button onClick={() => setMembers(members.filter((x) => x.uid !== m.uid))}>
                  <FiTrash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="btn-primary" style={{ marginTop: 16 }} onClick={createGroup} disabled={creating}>
          {creating ? 'Creating...' : `Create Group (${members.length + 1} members)`}
        </button>
      </div>
    </div>
  );
}
