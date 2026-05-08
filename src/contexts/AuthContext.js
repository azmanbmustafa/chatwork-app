import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const isRegistering = useRef(false);

  async function register(email, password, displayName) {
    isRegistering.current = true;
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      const profile = {
        uid: result.user.uid,
        email: email.toLowerCase(),
        displayName,
        createdAt: new Date(),
        photoURL: null,
      };
      await setDoc(doc(db, 'users', result.user.uid), profile);
      setCurrentUser({ ...result.user, ...profile });
      return result;
    } finally {
      isRegistering.current = false;
    }
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isRegistering.current) return;

      setCurrentUser(user || null);
      setLoading(false);

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
