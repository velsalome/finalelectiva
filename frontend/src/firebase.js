// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Configuración real de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyApJUYOX0NgWMuvB1Zkn6UuX-3AnWKTehk",
  authDomain: "chatrag-f0f58.firebaseapp.com",
  projectId: "chatrag-f0f58",
  storageBucket: "chatrag-f0f58.firebasestorage.app",
  messagingSenderId: "786736686057",
  appId: "1:786736686057:web:dd7574cdb1ecf3e0232178"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };
