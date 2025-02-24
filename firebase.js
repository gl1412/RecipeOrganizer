import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";


//Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAR3nIRsgdpGlWjuzSdkhW0H2VRH0akO0c",
  authDomain: "myfavoriterecipes-5526a.firebaseapp.com",
  projectId: "myfavoriterecipes-5526a",
  storageBucket: "myfavoriterecipes-5526a.firebasestorage.app",
  messagingSenderId: "366652481829",
  appId: "1:366652481829:web:0099eeead73a4641f63acc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const AI_API_KEY = "AIzaSyCSLoY1z-EdR-uBpa9OQKbTI4KXIYABSnE"; 
const AI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";


export { auth, provider, db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, signInWithPopup, signOut, query, where, AI_API_KEY, AI_API_URL };