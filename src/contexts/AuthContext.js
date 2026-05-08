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

  async function register(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      email: email.toLowerCase(),
      displayName,
      createdAt: new Date(),
      photoURL: null,
    });
    return result;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Set user immediately from Auth — no waiting for Firestore
      setCurrentUser(user || null);
      setLoading(false);

      // Load extra Firestore profile data in background
      // Auto-create profile if it doesn't exist (fixes missing docs)
      if (user) {
        getDoc(doc(db, 'users', user.uid))
          .then((userDoc) => {
            if (userDoc.exists()) {
              setCurrentUser((prev) => ({ ...prev, ...userDoc.data() }));
            } else {
              const profile = {
                uid: user.uid,
                email: user.email.toLowerCase(),
                displayName: user.displayName || user.email.split('@')[0],
                createdAt: new Date(),
                photoURL: null,
              };
              setDoc(doc(db, 'users', user.uid), profile).catch(() => {});
              setCurrentUser((prev) => ({ ...prev, ...profile }));
            }
          })
          .catch(() => {});
      }
    });
    return unsubscribe;
  }, []);

  const value = { currentUser, register, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
