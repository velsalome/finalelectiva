// src/main.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

// Configuración de Firebase
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

// ELEMENTOS HTML
const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const googleLoginBtn = document.getElementById("google-login");
const logoutBtn = document.getElementById("logout");
const sendBtn = document.getElementById("send-btn");
const newChatBtn = document.getElementById("new-chat");
const messagesDiv = document.getElementById("messages");

// Cargar historial solo una vez al inicio
const messages = JSON.parse(localStorage.getItem("chatHistory")) || [];

// Función para renderizar mensajes evitando duplicados
function renderMessages() {
  messagesDiv.innerHTML = "";
  messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = "message " + (msg.sender === "Tú" ? "user" : "bot");
    div.textContent = msg.text;
    messagesDiv.appendChild(div);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Mostrar chat si usuario está logueado
onAuthStateChanged(auth, user => {
  if (user) {
    loginContainer.style.display = "none";
    chatContainer.style.display = "block";
    renderMessages();
  } else {
    loginContainer.style.display = "block";
    chatContainer.style.display = "none";
  }
});

// Login con Google
googleLoginBtn.addEventListener("click", async () => {
  googleLoginBtn.disabled = true;
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert(error.message);
  } finally {
    googleLoginBtn.disabled = false;
  }
});

// Cerrar sesión
logoutBtn.addEventListener("click", () => {
  signOut(auth);
  localStorage.removeItem("chatHistory");
});

// Enviar pregunta
sendBtn.addEventListener("click", async () => {
  const fileInput = document.getElementById("file-input");
  const userInput = document.getElementById("user-input");

  if (!fileInput.files[0]) { 
    alert("Sube un PDF antes de preguntar.");
    return; 
  }

  const question = userInput.value.trim();
  if (!question) return;

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("question", question); // ✅ Ahora se envía la pregunta

  // Mostrar mensaje del usuario
  messages.push({ sender: "Tú", text: question });
  renderMessages();
  localStorage.setItem("chatHistory", JSON.stringify(messages));

  try {
    const response = await fetch("http://127.0.0.1:8000/analyze-pdf", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    const reply = data.analysis || data.error || "Sin respuesta";

    messages.push({ sender: "IA", text: reply });
    renderMessages();
    localStorage.setItem("chatHistory", JSON.stringify(messages));

  } catch (error) {
    messages.push({ sender: "IA", text: "Error al conectar con el servidor." });
    renderMessages();
  }

  userInput.value = "";
});

// Nuevo chat
newChatBtn.addEventListener("click", () => {
  localStorage.removeItem("chatHistory");
  messages.length = 0;
  renderMessages();
});
