import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAlk0l3UT_vl1Pl4ZWIc7BrkqPid_mpKNc",
  authDomain: "chatwork-app.firebaseapp.com",
  projectId: "chatwork-app",
  storageBucket: "chatwork-app.firebasestorage.app",
  messagingSenderId: "388681908953",
  appId: "1:388681908953:web:d4ae54c6813a9541e6f4c8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const users = [
  { uid: 'HVQCODho6ZbJC2xceoV2Rv...', email: 'azman@azman.com', displayName: 'AzmanMustafa' },
  { uid: '7KE1243Hg6c3c5mvnVOvGSz...', email: 'nurlizaa@gmail.com', displayName: 'Nurlizaa' },
  { uid: '7UsTOdfvkJSro2aZXG4qkcak...', email: 'azman2@azman.com', displayName: 'Azman2' },
];

for (const u of users) {
  await setDoc(doc(db, 'users', u.uid), {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    createdAt: new Date(),
    photoURL: null,
  });
  console.log('Created:', u.email);
}
console.log('Done!');
process.exit(0);
