import { useState } from "react";
import { auth, provider, signInWithPopup, signOut } from "./firebaseConfig.js";

export default function Login({ onLogin }) {
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUser(user);
      onLogin(user);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    onLogin(null);
  };

  return (
    <div className="flex flex-col items-center justify-center mt-10">
      {user ? (
        <>
          <img src={user.photoURL} alt="avatar" className="w-16 h-16 rounded-full mb-3" />
          <p className="text-lg font-semibold">Hola, {user.displayName}</p>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg mt-4"
          >
            Cerrar sesión
          </button>
        </>
      ) : (
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Iniciar sesión con Google
        </button>
      )}
    </div>
  );
}
