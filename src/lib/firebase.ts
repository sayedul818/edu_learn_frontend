// Firebase helper — initializes Firebase and exports auth helpers used by the UI.
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDnmXiyJ3SuZCRZ6ZYS4Sy_sHEUDcoiw20',
  authDomain: 'election-auth-aa380.firebaseapp.com',
  projectId: 'election-auth-aa380',
  storageBucket: 'election-auth-aa380.firebasestorage.app',
  messagingSenderId: '533765645549',
  appId: '1:533765645549:web:11d9eebd7393dc19c398e4',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  // result.user contains the signed-in user
  return result.user;
}

export async function sendVerification(user: any) {
  if (!user) return;
  try {
    await sendEmailVerification(user);
    return true;
  } catch (e) {
    console.error('sendVerification error', e);
    return false;
  }
}

export { auth };
