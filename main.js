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
const filterUserInput = document.getElementById('filter-user');
const filterStartDateInput = document.getElementById('filter-start-date');
const filterEndDateInput = document.getElementById('filter-end-date');
const recordsContainer = document.getElementById('records-container');
const loginForm = document.getElementById('login-form');
const checkInButton = document.getElementById('check-in');
const checkOutButton = document.getElementById('check-out');
const viewRecordsButton = document.getElementById('view-records');
const viewAllRecordsButton = document.getElementById('view-all-records');
const exportPdfButton = document.getElementById('export-pdf');
const recordsTableBody = document.getElementById('records-table-body');
const totalHoursWorkedElement = document.getElementById('total-hours-worked');
const totalExtraHoursElement = document.getElementById('total-extra-hours');
const successModal = new bootstrap.Modal(document.getElementById('successModal'), {
    keyboard: false
});
const modalMessage = document.getElementById('modalMessage');

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
        modalMessage.textContent = '¡Entrada registrada con éxito!';
        successModal.show();
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
                modalMessage.textContent = '¡Salida registrada con éxito!';
                successModal.show();
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
        let totalHoursWorked = 0;
        let totalExtraHours = 0;
        snapshot.forEach(doc => {
            const record = doc.data();
            const checkIn = record.checkIn ? formatDate(record.checkIn.toDate()) : '';
            const checkOut = record.checkOut ? formatDate(record.checkOut.toDate()) : '';
            const hoursWorked = parseFloat(calculateHoursWorked(record.checkIn?.toDate(), record.checkOut?.toDate()));
            const extraHours = parseFloat(calculateExtraHours(hoursWorked));
            totalHoursWorked += hoursWorked;
            totalExtraHours += extraHours;
            const row = `
                <tr>
                    <td>${record.userEmail}</td>
                    <td>${checkIn}</td>
                    <td>${checkOut}</td>
                    <td>${hoursWorked.toFixed(2)}</td>
                    <td>${extraHours.toFixed(2)}</td>
                </tr>
            `;
            recordsTableBody.innerHTML += row;
        });
        totalHoursWorkedElement.textContent = totalHoursWorked.toFixed(2);
        totalExtraHoursElement.textContent = totalExtraHours.toFixed(2);
        recordsContainer.classList.remove('d-none');
    }).catch(err => {
        console.error(err);
    });
});

// View all records event (Admin)
viewAllRecordsButton.addEventListener('click', () => {
    const filterUser = filterUserInput ? filterUserInput.value.trim().toLowerCase() : '';
    const filterStartDate = filterStartDateInput.value ? new Date(filterStartDateInput.value).getTime() : null;
    const filterEndDate = filterEndDateInput.value ? new Date(filterEndDateInput.value).getTime() : null;
    recordsTableBody.innerHTML = '';
    db.collection('attendance').get().then(snapshot => {
        let totalHoursWorked = 0;
        let totalExtraHours = 0;
        snapshot.forEach(doc => {
            const record = doc.data();
            const checkInDate = record.checkIn ? record.checkIn.toDate().getTime() : null;
            const checkOutDate = record.checkOut ? record.checkOut.toDate().getTime() : null;
            const hoursWorked = parseFloat(calculateHoursWorked(record.checkIn?.toDate(), record.checkOut?.toDate()));
            const extraHours = parseFloat(calculateExtraHours(hoursWorked));
            const checkIn = record.checkIn ? formatDate(record.checkIn.toDate()) : '';
            const checkOut = record.checkOut ? formatDate(record.checkOut.toDate()) : '';

            if ((!filterUser || record.userEmail.toLowerCase().includes(filterUser)) &&
                (!filterStartDate || (checkInDate >= filterStartDate)) &&
                (!filterEndDate || (checkOutDate <= filterEndDate))) {
                totalHoursWorked += hoursWorked;
                totalExtraHours += extraHours;
                const row = `
                    <tr>
                        <td>${record.userEmail}</td>
                        <td>${checkIn}</td>
                        <td>${checkOut}</td>
                        <td>${hoursWorked.toFixed(2)}</td>
                        <td>${extraHours.toFixed(2)}</td>
                    </tr>
                `;
                recordsTableBody.innerHTML += row;
            }
        });
        totalHoursWorkedElement.textContent = totalHoursWorked.toFixed(2);
        totalExtraHoursElement.textContent = totalExtraHours.toFixed(2);
        recordsContainer.classList.remove('d-none');
    }).catch(err => {
        console.error(err);
    });
});

// Export records to PDF
exportPdfButton.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const rows = [];
    const headers = ["Usuario", "Entrada", "Salida", "Horas Trabajadas", "Horas Extras"];

    recordsTableBody.querySelectorAll('tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => {
            rowData.push(cell.innerText);
        });
        rows.push(rowData);
    });

    doc.autoTable({
        head: [headers],
        body: rows,
    });

    doc.save('registro_asistencia.pdf');
});

// Format date
function formatDate(date) {
    if (!date) return '';
    return date.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/, /g, ' ');
}

// Calculate hours worked
function calculateHoursWorked(checkIn, checkOut) {
    if (!checkIn || !checkOut) return '0.00';
    const diffMs = checkOut - checkIn;
    const diffHrs = diffMs / (1000 * 60 * 60);
    return diffHrs.toFixed(2);
}

// Calculate extra hours
function calculateExtraHours(hoursWorked) {
    const extraHours = Math.max(0, hoursWorked - 8);
    return extraHours.toFixed(2);
}
