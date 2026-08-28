import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCSgbyvk4AzB0-8kT8Ys3wQGHJ6cHQBhVI",
  authDomain: "articulate-alliance-6tvkm.firebaseapp.com",
  projectId: "articulate-alliance-6tvkm",
  storageBucket: "articulate-alliance-6tvkm.firebasestorage.app",
  messagingSenderId: "804817284327",
  appId: "1:804817284327:web:25a2f3f635252e9159c642"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-bbbe4820-5d38-49e8-a22f-c7b3bab8d7e8");
export const googleProvider = new GoogleAuthProvider();
