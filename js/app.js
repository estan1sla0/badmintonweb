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

    document.getElementById("limpiarFiltrosBtn").addEventListener("click", () => {
      document.getElementById("filtroCategoria").value = "";
      document.getElementById("filtroModalidad").value = "";
      document.getElementById("filtroTrabajo").value = "";
      document.getElementById("filtroCarga").value = "";
      filtrar();
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
        nota: "",
        id: nuevoDoc.id
      };

      try {
        await nuevoDoc.set(nuevo);
        form.reset();
        await cargarEntrenamientos(uid);
      } catch (error) {
        console.error("Error al guardar entrenamiento:", error);
        Swal.fire('Error', error.message, 'error');
      }
    });

    await cargarEntrenamientos(uid);

    document.getElementById("filtroCategoria").addEventListener("change", filtrar);
    document.getElementById("filtroModalidad").addEventListener("change", filtrar);
    document.getElementById("filtroTrabajo").addEventListener("change", filtrar);
    document.getElementById("filtroCarga")?.addEventListener("change", filtrar);
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

async function cargarEntrenamientos(uid) {
  const snapshot = await db.collection("entrenamientos")
    .where("uid", "==", uid)
    .orderBy("fecha")
    .get();

  entrenamientos = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  mostrarEntrenamientos(entrenamientos);
  mostrarEstadisticas(entrenamientos);
  actualizarFiltrosVisuales();
}

function getCargaColorClass(carga) {
  switch (carga.trim().charAt(0)) {
    case "1": return "carga-baja";
    case "2": return "carga-media-baja";
    case "3": return "carga-media";
    case "4": return "carga-media-alta";
    case "5": return "carga-alta";
    default: return "";
  }
}

function mostrarEntrenamientos(datos) {
  const tabla = document.getElementById("tablaEntrenamientos");
  tabla.innerHTML = "";

  const uidActual = firebase.auth().currentUser.uid;

  datos.forEach(data => {
    const puedeEditar = data.uid === uidActual;
    const cargaClass = getCargaColorClass(data.carga || "");

    const acciones = puedeEditar
      ? `
        <div class="d-flex justify-content-center gap-2">
          <i class="bi bi-pencil text-warning" role="button" title="Editar descripción" onclick="editarDescripcion('${data.id}')"></i>
          <i class="bi bi-trash text-danger" role="button" title="Eliminar entrenamiento" onclick="eliminarEntrenamiento('${data.id}')"></i>
          <i class="bi bi-chat-left-text text-primary" role="button" title="Editar nota" onclick="editarNota('${data.id}')"></i>
        </div>`
      : `<span class="text-muted">Sin permiso</span>`;

    const fila = `
      <tr>
        <td>${data.fecha}</td>
        <td>${data.categoria}</td>
        <td>${data.tipoTrabajo}</td>
        <td>${data.modalidad}</td>
        <td class="${cargaClass}">${data.carga}</td>
        <td class="descripcion">${data.descripcion}</td>
        <td class="nota">${data.nota || ""}</td>
        <td>${acciones}</td>
      </tr>
    `;
    tabla.innerHTML += fila;
  });

  document.getElementById("contadorEntrenamientos")?.innerText = `${datos.length} entrenamiento(s) encontrados`;
}

function mostrarEstadisticas(data) {
  const resumen = {
    Categoría: {},
    Trabajo: {},
    Modalidad: {},
    Carga: {}
  };

  data.forEach(ent => {
    resumen.Categoría[ent.categoria] = (resumen.Categoría[ent.categoria] || 0) + 1;
    resumen.Trabajo[ent.tipoTrabajo] = (resumen.Trabajo[ent.tipoTrabajo] || 0) + 1;
    resumen.Modalidad[ent.modalidad] = (resumen.Modalidad[ent.modalidad] || 0) + 1;
    resumen.Carga[ent.carga] = (resumen.Carga[ent.carga] || 0) + 1;
  });

  const contenedor = document.getElementById("estadisticasResumen");
  contenedor.innerHTML = "";

  Object.entries(resumen).forEach(([titulo, valores]) => {
    Object.entries(valores).forEach(([clave, cantidad]) => {
      const card = `
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body text-center">
              <h6 class="text-muted">${titulo}</h6>
              <h5 class="fw-bold mb-1">${clave}</h5>
              <span class="badge bg-primary rounded-pill fs-6">${cantidad}</span>
            </div>
          </div>
        </div>
      `;
      contenedor.innerHTML += card;
    });
  });
}

function filtrar() {
  const categoria = document.getElementById("filtroCategoria").value;
  const modalidad = document.getElementById("filtroModalidad").value;
  const trabajo = document.getElementById("filtroTrabajo").value;
  const carga = document.getElementById("filtroCarga")?.value || "";

  const filtrados = entrenamientos.filter(ent => {
    return (
      (categoria === "" || ent.categoria === categoria) &&
      (modalidad === "" || ent.modalidad === modalidad) &&
      (trabajo === "" || ent.tipoTrabajo === trabajo) &&
      (carga === "" || ent.carga === carga)
    );
  });

  mostrarEntrenamientos(filtrados);
  mostrarEstadisticas(filtrados);
  actualizarFiltrosVisuales();
}

function actualizarFiltrosVisuales() {
  const categoria = document.getElementById("filtroCategoria").value;
  const modalidad = document.getElementById("filtroModalidad").value;
  const trabajo = document.getElementById("filtroTrabajo").value;
  const carga = document.getElementById("filtroCarga")?.value || "";

  const filtros = [];
  if (categoria) filtros.push(`Categoría: ${categoria}`);
  if (modalidad) filtros.push(`Modalidad: ${modalidad}`);
  if (trabajo) filtros.push(`Trabajo: ${trabajo}`);
  if (carga) filtros.push(`Carga: ${carga}`);

  const badgeContainer = document.getElementById("filtrosActivos");
  const contenedor = document.getElementById("filtrosActivosContainer");

  if (filtros.length > 0) {
    badgeContainer.innerHTML = filtros.map(f => `<span class="badge bg-info text-dark me-1">${f}</span>`).join(" ");
    contenedor.style.display = "block";
  } else {
    badgeContainer.innerHTML = "";
    contenedor.style.display = "none";
  }
}

function exportarExcel() {
  const worksheet = XLSX.utils.json_to_sheet(entrenamientos.map(ent => ({
    Fecha: ent.fecha,
    Categoría: ent.categoria,
    Trabajo: ent.tipoTrabajo,
    Modalidad: ent.modalidad,
    Carga: ent.carga,
    Descripción: ent.descripcion,
    Nota: ent.nota || ""
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
    inputAttributes: { maxlength: 500 }
  });

  if (nuevaDescripcion !== undefined) {
    await docRef.update({ descripcion: nuevaDescripcion });
    await cargarEntrenamientos(firebase.auth().currentUser.uid);
    Swal.fire('Actualizado', 'La descripción fue actualizada correctamente.', 'success');
  }
}

async function editarNota(id) {
  const docRef = db.collection("entrenamientos").doc(id);
  const docSnap = await docRef.get();
  const notaActual = docSnap.data().nota || "";

  const { value: nuevaNota } = await Swal.fire({
    title: 'Editar Nota',
    input: 'textarea',
    inputLabel: 'Nota privada sobre el entrenamiento',
    inputValue: notaActual,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    inputAttributes: { maxlength: 500 }
  });

  if (nuevaNota !== undefined) {
    await docRef.update({ nota: nuevaNota });
    Swal.fire('Guardado', 'La nota fue actualizada correctamente.', 'success');
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
    await cargarEntrenamientos(firebase.auth().currentUser.uid);
    Swal.fire('Eliminado', 'El entrenamiento fue eliminado.', 'success');
  }
}
