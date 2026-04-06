import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDq-F0DEMOXC0TjXY3PfjgUgktJg4TPQDw",
  authDomain: "taximelafinal-db.firebaseapp.com",
  projectId: "taximelafinal-db",
  storageBucket: "taximelafinal-db.firebasestorage.app",
  messagingSenderId: "17900467868",
  appId: "1:17900467868:web:eafe90bdd29282de409f59",
  measurementId: "G-T6S6RDTTYR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export async function signInWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  return { uid: userCredential.user.uid, token };
}

export async function signUpWithEmail(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  return { uid: userCredential.user.uid, token };
}

export async function signOutUser() {
  await signOut(auth);
}
