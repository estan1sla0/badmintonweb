document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('loginUser').value;
      const password = document.getElementById('loginPass').value;

      try {
        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = 'app.html';
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('registerUser').value;
      const password = document.getElementById('registerPass').value;

      try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);

        // Guarda el rol por defecto como "usuario"
        await db.collection('usuarios').doc(cred.user.uid).set({ rol: 'usuario' });

        Swal.fire('Registrado', 'Usuario creado correctamente', 'success').then(() => {
          window.location.href = 'index.html';
        });
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    });
  }
});
