const API_URL = "http://localhost:5000/api";

document.getElementById('current-date').innerText = new Date().toDateString();

const token = localStorage.getItem('token');
if (token) { showDashboard(); }

async function login() {
    const empId = document.getElementById('empId').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_id: empId, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            localStorage.setItem('role', payload.role);
            showDashboard();
        } else {
            errorMsg.innerText = data.message;
        }
    } catch (err) {
        errorMsg.innerText = "Server error. Is backend running?";
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    location.reload();
}

async function showDashboard() {
    document.getElementById('login-section').classList.add('d-none');
    document.getElementById('dashboard-section').classList.remove('d-none');
    
    const role = localStorage.getItem('role');
    if (role === 'admin') {
        document.getElementById('admin-panel').classList.remove('d-none');
        loadUsers();
    }

    await loadHistory();
    checkTodayStatus();
}

async function timeIn() { await postAction('/attendance/time-in'); }
async function lunchOut() { await postAction('/attendance/lunch-out'); }
async function lunchIn() { await postAction('/attendance/lunch-in'); }
async function timeOut() { await postAction('/attendance/time-out'); }

async function postAction(endpoint) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await res.json();
    
    if(res.ok) {
        alert(data.message);
        loadHistory();
        checkTodayStatus();
    } else {
        alert(data.message);
    }
}

async function loadHistory() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/attendance/my-records`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    const tbody = document.getElementById('history-table');
    tbody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.date}</td>
            <td>${row.time_in ? new Date(row.time_in).toLocaleTimeString() : '-'}</td>
            <td>${row.lunch_out ? new Date(row.lunch_out).toLocaleTimeString() : '-'}</td>
            <td>${row.lunch_in ? new Date(row.lunch_in).toLocaleTimeString() : '-'}</td>
            <td>${row.time_out ? new Date(row.time_out).toLocaleTimeString() : '-'}</td>
            <td>${row.total_hours || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function checkTodayStatus() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/attendance/my-records`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = data.find(r => r.date === today);

    const btnIn = document.getElementById('btn-in');
    const btnLOut = document.getElementById('btn-lout');
    const btnLIn = document.getElementById('btn-lin');
    const btnOut = document.getElementById('btn-out');
    const status = document.getElementById('status-badge');

    btnIn.disabled = false; btnLOut.disabled = false; btnLIn.disabled = false; btnOut.disabled = false;

    if (!todayRecord) {
        status.innerText = "Not Timed In";
        status.className = "alert alert-secondary";
        btnLOut.disabled = true; btnLIn.disabled = true; btnOut.disabled = true;
    } else if (todayRecord.time_out) {
        status.innerText = "Completed";
        status.className = "alert alert-success";
        btnIn.disabled = true; btnLOut.disabled = true; btnLIn.disabled = true; btnOut.disabled = true;
    } else if (todayRecord.lunch_in) {
        status.innerText = "Working";
        status.className = "alert alert-info";
        btnIn.disabled = true; btnLOut.disabled = true; btnLIn.disabled = true;
    } else if (todayRecord.lunch_out) {
        status.innerText = "On Lunch";
        status.className = "alert alert-warning";
        btnIn.disabled = true; btnLOut.disabled = true; btnLIn.disabled = true;
    } else if (todayRecord.time_in) {
        status.innerText = "Working";
        status.className = "alert alert-primary";
        btnIn.disabled = true;
    }
}

async function loadUsers() {
    const token = localStorage.getItem('token');
    const res = await fetch
