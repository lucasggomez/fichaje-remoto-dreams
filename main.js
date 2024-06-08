// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC9WLBxnm49-c_l3oFtDuRDyKoULWasBVk",
    authDomain: "fichaje-remotos-dreams.firebaseapp.com",
    projectId: "fichaje-remotos-dreams",
    storageBucket: "fichaje-remotos-dreams.appspot.com",
    messagingSenderId: "528031807637",
    appId: "1:528031807637:web:962ea853b3c8101359c39c"
  };
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var db = firebase.firestore();

// DOM Elements
const loginContainer = document.getElementById('login-container');
const profileSummary = document.getElementById('profile-summary');
const userEmailElement = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const attendanceContainer = document.getElementById('attendance-container');
const adminContainer = document.getElementById('admin-container');
const recordsContainer = document.getElementById('records-container');
const loginForm = document.getElementById('login-form');
const checkInButton = document.getElementById('check-in');
const checkOutButton = document.getElementById('check-out');
const viewRecordsButton = document.getElementById('view-records');
const viewAllRecordsButton = document.getElementById('view-all-records');
const recordsTableBody = document.getElementById('records-table-body');

// Login event
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm['email'].value;
    const password = loginForm['password'].value;
    auth.signInWithEmailAndPassword(email, password).then((userCredential) => {
        const user = userCredential.user;
        userEmailElement.textContent = `Correo: ${user.email}`;
        profileSummary.classList.remove('d-none');
        loginContainer.classList.add('d-none');
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                if (userData.role === 'admin') {
                    adminContainer.classList.remove('d-none');
                } else {
                    attendanceContainer.classList.remove('d-none');
                }
            } else {
                console.error("¡No existe tal documento!");
            }
        }).catch((error) => {
            console.error("Error al obtener el documento:", error);
        });
    }).catch(err => {
        console.error(err);
    });
});

// Logout event
logoutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
        profileSummary.classList.add('d-none');
        attendanceContainer.classList.add('d-none');
        adminContainer.classList.add('d-none');
        recordsContainer.classList.add('d-none');
        loginContainer.classList.remove('d-none');
    }).catch((error) => {
        console.error("Error al cerrar sesión:", error);
    });
});

// Check-in event
checkInButton.addEventListener('click', () => {
    const user = auth.currentUser;
    db.collection('attendance').add({
        userId: user.uid,
        userEmail: user.email,
        checkIn: firebase.firestore.FieldValue.serverTimestamp(),
        checkOut: null
    }).then(() => {
        alert('¡Entrada registrada con éxito!');
    }).catch(err => {
        console.error(err);
    });
});

// Check-out event
checkOutButton.addEventListener('click', () => {
    const user = auth.currentUser;
    db.collection('attendance').where('userId', '==', user.uid).where('checkOut', '==', null).get().then(snapshot => {
        snapshot.forEach(doc => {
            db.collection('attendance').doc(doc.id).update({
                checkOut: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert('¡Salida registrada con éxito!');
            }).catch(err => {
                console.error(err);
            });
        });
    }).catch(err => {
        console.error(err);
    });
});

// View records event
viewRecordsButton.addEventListener('click', () => {
    const user = auth.currentUser;
    recordsTableBody.innerHTML = '';
    db.collection('attendance').where('userId', '==', user.uid).get().then(snapshot => {
        snapshot.forEach(doc => {
            const record = doc.data();
            const row = `
                <tr>
                    <td>${record.userEmail}</td>
                    <td>${record.checkIn ? record.checkIn.toDate() : ''}</td>
                    <td>${record.checkOut ? record.checkOut.toDate() : ''}</td>
                </tr>
            `;
            recordsTableBody.innerHTML += row;
        });
        recordsContainer.classList.remove('d-none');
    }).catch(err => {
        console.error(err);
    });
});

// View all records event (Admin)
viewAllRecordsButton.addEventListener('click', () => {
    recordsTableBody.innerHTML = '';
    db.collection('attendance').get().then(snapshot => {
        snapshot.forEach(doc => {
            const record = doc.data();
            const row = `
                <tr>
                    <td>${record.userEmail}</td>
                    <td>${record.checkIn ? record.checkIn.toDate() : ''}</td>
                    <td>${record.checkOut ? record.checkOut.toDate() : ''}</td>
                </tr>
            `;
            recordsTableBody.innerHTML += row;
        });
        recordsContainer.classList.remove('d-none');
    }).catch(err => {
        console.error(err);
    });
});
