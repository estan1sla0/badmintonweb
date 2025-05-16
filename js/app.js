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

    const form = document.getElementById("formEntrenamiento");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const nuevoDoc = db.collection("entrenamientos").doc();
      const nuevo = {
        uid: uid,
        fecha: form.fecha.value,
        categoria: form.categoria.value,
        tipoTrabajo: form.tipoTrabajo.value,
        modalidad: form.modalidad.value,
        carga: form.carga.value,
        descripcion: form.descripcion.value,
        id: nuevoDoc.id
      };

      try {
        await nuevoDoc.set(nuevo);
        form.reset();
        await cargarEntrenamientos(rol, uid);
      } catch (error) {
        console.error("Error al guardar entrenamiento:", error);
        Swal.fire('Error', error.message, 'error');
      }
    });

    await cargarEntrenamientos(rol, uid);

    document.getElementById("filtroCategoria").addEventListener("change", filtrar);
    document.getElementById("filtroModalidad").addEventListener("change", filtrar);
    document.getElementById("filtroTrabajo").addEventListener("change", filtrar);
    document.getElementById("filtroCarga")?.addEventListener("change", filtrar); // solo si existe

    document.getElementById("exportBtn").addEventListener("click", exportarExcel);

    const modoGuardado = localStorage.getItem("modo");
    if (modoGuardado === "oscuro") {
      document.body.classList.add("dark-mode");
      actualizarIcono();
    }
  });

  document.getElementById("darkModeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const modoActual = document.body.classList.contains("dark-mode") ? "oscuro" : "claro";
    localStorage.setItem("modo", modoActual);
    actualizarIcono();
  });
});

async function cargarEntrenamientos(rol, uid) {
  const snapshot = await db.collection("entrenamientos").orderBy("fecha").get();
  entrenamientos = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (rol === "entrenador" || data.uid === uid) {
      entrenamientos.push({ ...data, id: doc.id });
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
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="editarDescripcion('${data.id}')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarEntrenamiento('${data.id}')">Eliminar</button>
        </td>
      </tr>
    `;
    tabla.innerHTML += fila;
  });
}

function filtrar() {
  const categoria = document.getElementById("filtroCategoria").value;
  const modalidad = document.getElementById("filtroModalidad").value;
  const trabajo = document.getElementById("filtroTrabajo").value;
  const carga = document.getElementById("filtroCarga")?.value || "";

  const filtrados = entrenamientos.filter(entrenamiento => {
    return (
      (categoria === "" || entrenamiento.categoria === categoria) &&
      (modalidad === "" || entrenamiento.modalidad === modalidad) &&
      (trabajo === "" || entrenamiento.tipoTrabajo === trabajo) &&
      (carga === "" || entrenamiento.carga === carga)
    );
  });

  mostrarEntrenamientos(filtrados);
}

function exportarExcel() {
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
}

function actualizarIcono() {
  const boton = document.getElementById("darkModeBtn");
  if (!boton) return;

  if (document.body.classList.contains("dark-mode")) {
    boton.textContent = "☀️";
    boton.classList.remove("btn-outline-dark");
    boton.classList.add("btn-outline-light");
  } else {
    boton.textContent = "🌙";
    boton.classList.remove("btn-outline-light");
    boton.classList.add("btn-outline-dark");
  }
}

async function editarDescripcion(id) {
  const docRef = db.collection("entrenamientos").doc(id);
  const docSnap = await docRef.get();

  const descripcionActual = docSnap.data().descripcion;

  const { value: nuevaDescripcion } = await Swal.fire({
    title: 'Editar Descripción',
    input: 'textarea',
    inputLabel: 'Nueva descripción',
    inputValue: descripcionActual,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    inputAttributes: {
      maxlength: 500,
      'aria-label': 'Editar descripción'
    }
  });

  if (nuevaDescripcion) {
    await docRef.update({ descripcion: nuevaDescripcion });
    await cargarEntrenamientos(document.getElementById("userRol").innerText, firebase.auth().currentUser.uid);
    Swal.fire('Actualizado', 'La descripción fue actualizada correctamente.', 'success');
  }
}

async function eliminarEntrenamiento(id) {
  const confirmacion = await Swal.fire({
    title: '¿Eliminar entrenamiento?',
    text: "Esta acción no se puede deshacer.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (confirmacion.isConfirmed) {
    await db.collection("entrenamientos").doc(id).delete();
    await cargarEntrenamientos(document.getElementById("userRol").innerText, firebase.auth().currentUser.uid);
    Swal.fire('Eliminado', 'El entrenamiento fue eliminado.', 'success');
  }
}
