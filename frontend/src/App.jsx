export default function App() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🔥 Chat con PDF 🔥</h1>
      <button
        onClick={() => alert("Botón funcionando 🚀")}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          background: "orange",
          border: "none",
          borderRadius: "8px",
          color: "white",
        }}
      >
        Subir PDF
      </button>
    </div>
  );
}
