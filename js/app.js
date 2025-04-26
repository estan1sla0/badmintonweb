let entrenamientos = [];

document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const uid = user.uid;
    const userDoc = await db.collection("usuarios").doc(uid).get();
    const rol = userDoc.data()?.rol || "usuario";

    document.getElementById("userEmail").innerText = user.email;
    document.getElementById("userRol").innerText = rol;

    document.getElementById("logoutBtn").addEventListener("click", () => {
      firebase.auth().signOut().then(() => {
        window.location.href = "index.html";
      });
    });

    await cargarEntrenamientos(rol, uid);

    document.getElementById("filtroCategoria").addEventListener("change", filtrar);
    document.getElementById("filtroModalidad").addEventListener("change", filtrar);
    document.getElementById("filtroTrabajo").addEventListener("change", filtrar);
  });
});

async function cargarEntrenamientos(rol, uid) {
  const snapshot = await db.collection("entrenamientos").orderBy("fecha").get();
  entrenamientos = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (rol === "entrenador" || data.uid === uid) {
      entrenamientos.push(data);
    }
  });

  mostrarEntrenamientos(entrenamientos);
}

function mostrarEntrenamientos(datos) {
  const tabla = document.getElementById("tablaEntrenamientos");
  tabla.innerHTML = "";

  datos.forEach(data => {
    const fila = `
      <tr>
        <td>${data.fecha}</td>
        <td>${data.categoria}</td>
        <td>${data.tipoTrabajo}</td>
        <td>${data.modalidad}</td>
        <td>${data.carga}</td>
        <td class="descripcion">${data.descripcion}</td>
      </tr>
    `;
    tabla.innerHTML += fila;
  });
}

function filtrar() {
  const categoria = document.getElementById("filtroCategoria").value;
  const modalidad = document.getElementById("filtroModalidad").value;
  const trabajo = document.getElementById("filtroTrabajo").value;

  const filtrados = entrenamientos.filter(entrenamiento => {
    return (
      (categoria === "" || entrenamiento.categoria === categoria) &&
      (modalidad === "" || entrenamiento.modalidad === modalidad) &&
      (trabajo === "" || entrenamiento.tipoTrabajo === trabajo)
    );
  });

  mostrarEntrenamientos(filtrados);
}

// Exportar a Excel
document.getElementById("exportBtn").addEventListener("click", () => {
  const worksheet = XLSX.utils.json_to_sheet(entrenamientos.map(ent => ({
    Fecha: ent.fecha,
    Categoría: ent.categoria,
    Trabajo: ent.tipoTrabajo,
    Modalidad: ent.modalidad,
    Carga: ent.carga,
    Descripción: ent.descripcion
  })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Entrenamientos");

  XLSX.writeFile(workbook, "entrenamientos.xlsx");
});
