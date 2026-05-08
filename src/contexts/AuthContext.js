import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  async function register(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    return result;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      setLoading(false);

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setCurrentUser((prev) => ({ ...prev, ...snap.data() }));
        } else {
          const profile = {
            uid: user.uid,
            email: user.email.toLowerCase(),
            displayName: user.displayName || user.email.split('@')[0],
            createdAt: new Date(),
            photoURL: null,
          };
          await setDoc(ref, profile);
          setCurrentUser((prev) => ({ ...prev, ...profile }));
        }
      } catch (err) {
        console.error('Firestore profile error:', err);
        setDbError(err.message || err.code || 'Firestore write failed');
      }
    });
    return unsubscribe;
  }, []);

  const value = { currentUser, register, login, logout, dbError };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
