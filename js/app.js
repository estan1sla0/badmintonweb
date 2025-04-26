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

    const form = document.getElementById("formEntrenamiento");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const nuevo = {
        uid,
        fecha: form.fecha.value,
        categoria: form.categoria.value,
        tipoTrabajo: form.tipoTrabajo.value,
        modalidad: form.modalidad.value,
        carga: form.carga.value,
        descripcion: form.descripcion.value
      };
      await db.collection("entrenamientos").add(nuevo);
      form.reset();
      mostrarEntrenamientos(rol, uid);
    });

    mostrarEntrenamientos(rol, uid);
  });
});

async function mostrarEntrenamientos(rol, uid) {
  const tabla = document.getElementById("tablaEntrenamientos");
  const snapshot = await db.collection("entrenamientos").orderBy("fecha").get();
  let html = "";

  snapshot.forEach(doc => {
    const data = doc.data();
    if (rol === "entrenador" || data.uid === uid) {
      html += `
        <tr>
          <td>${data.fecha}</td>
          <td>${data.categoria}</td>
          <td>${data.tipoTrabajo}</td>
          <td>${data.modalidad}</td>
          <td>${data.carga}</td>
          <td class="descripcion">${data.descripcion}</td>
        </tr>
      `;
    }
  });

  tabla.innerHTML = html;
}
