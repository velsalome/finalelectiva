// src/main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// 🔹 Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDFobAI1cHbCG1KzyQ9z9r-mqMbnLmPy6I",
  authDomain: "chatexamengpt.firebaseapp.com",
  projectId: "chatexamengpt",
  storageBucket: "chatexamengpt.appspot.com",
  messagingSenderId: "460671834626",
  appId: "1:460671834626:web:60b4d6f080a276175d6945"
};

// 🔹 Inicializar Firebase y autenticación
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 🔹 Elementos de la interfaz
const loginBtn = document.getElementById("google-login");
const logoutBtn = document.getElementById("logout-btn");
const chatContainer = document.querySelector(".chat-container");
const loginContainer = document.querySelector(".login-container");
const sendBtn = document.getElementById("send-btn");
const messagesContainer = document.getElementById("messages");
const fileInput = document.getElementById("file-input");
const userInput = document.getElementById("user-input");

// 🔹 Historial del chat
let messages = JSON.parse(localStorage.getItem("chatHistory")) || [];
renderMessages();

// 🔹 Función para renderizar mensajes
function renderMessages() {
  messagesContainer.innerHTML = messages
    .map(m => `<div class="message"><strong>${m.sender}:</strong> ${m.text}</div>`)
    .join("");
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ✅ URL del backend (Render)
const BACKEND_URL = "https://finalelectiva.onrender.com/analyze-pdf";

// 🔹 Evento de enviar pregunta
sendBtn.addEventListener("click", async () => {
  const question = userInput.value.trim();
  if (!fileInput.files[0]) {
    alert("Sube un archivo PDF antes de preguntar.");
    return;
  }
  if (!question) {
    alert("Escribe una pregunta para enviar.");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("question", question);

  messages.push({ sender: "Tú", text: question });
  renderMessages();
  localStorage.setItem("chatHistory", JSON.stringify(messages));

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    const reply = data.analysis || data.error || "No se obtuvo respuesta.";

    messages.push({ sender: "IA", text: reply });
    renderMessages();
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  } catch (error) {
    messages.push({ sender: "IA", text: "Error al conectar con el servidor." });
    renderMessages();
  }

  userInput.value = "";
});

// 🔹 Autenticación con Google
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert(error.message);
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth);
  localStorage.removeItem("chatHistory");
});

// 🔹 Cambios de sesión
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginContainer.style.display = "none";
    chatContainer.style.display = "flex";
  } else {
    loginContainer.style.display = "flex";
    chatContainer.style.display = "none";
  }
});
