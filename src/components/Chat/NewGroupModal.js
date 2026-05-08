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

  async function addMember(e) {
    e.preventDefault();
    setError('');
    if (email === currentUser.email) {
      setError("You're already in the group.");
      return;
    }
    if (members.find((m) => m.email === email)) {
      setError('Already added.');
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'users'), where('email', '==', email.trim()));
    const snap = await getDocs(q);
    if (snap.empty) {
      setError('No user found with that email.');
    } else {
      setMembers([...members, { id: snap.docs[0].id, ...snap.docs[0].data() }]);
      setEmail('');
    }
    setLoading(false);
  }

  async function createGroup() {
    if (!groupName.trim()) return setError('Group name is required.');
    if (members.length < 1) return setError('Add at least one member.');

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

        <p className="modal-subtitle">Add members by email</p>
        <form onSubmit={addMember} className="modal-search">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@email.com"
          />
          <button type="submit" disabled={loading}><FiUserPlus /></button>
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

        <button className="btn-primary" style={{ marginTop: 16 }} onClick={createGroup}>
          Create Group ({members.length + 1} members)
        </button>
      </div>
    </div>
  );
}
