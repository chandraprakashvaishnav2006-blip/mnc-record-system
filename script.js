const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

const USER_CREDENTIALS = {
  username: 'user',
  password: 'user123',
};

let currentRole = null;
let records = [];
let attendance = {};

const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const welcomeText = document.getElementById('welcomeText');
const logoutBtn = document.getElementById('logoutBtn');
const recordForm = document.getElementById('recordForm');
const searchInput = document.getElementById('searchInput');
const recordsTableBody = document.getElementById('recordsTableBody');
const attendanceEmployeeSelect = document.getElementById('attendanceEmployeeSelect');
const attendanceStatusSelect = document.getElementById('attendanceStatusSelect');
const markAttendanceBtn = document.getElementById('markAttendanceBtn');
const attendanceTableBody = document.getElementById('attendanceTableBody');
const attendanceTabButton = document.getElementById('attendanceTabButton');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

async function loadRecords() {
  const response = await fetch('/api/records');
  const data = await response.json();
  records = data.map((item) => ({
    ...item,
    id: item.id || item.employeeId,
  }));
  renderRecords();
}

async function loadAttendance() {
  const response = await fetch('/api/attendance');
  const data = await response.json();
  attendance = Object.fromEntries(
    Object.entries(data).map(([employeeId, value]) => {
      if (typeof value === 'string') {
        return [employeeId, { status: value, timestamp: '' }];
      }
      return [employeeId, value];
    })
  );
  renderAttendance();
}

async function persistRecords() {
  await fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId: document.getElementById('employeeId').value.trim(),
      age: Number(document.getElementById('age').value),
      name: document.getElementById('name').value.trim(),
      department: document.getElementById('department').value.trim(),
      salary: Number(document.getElementById('salary').value),
      contactNo: document.getElementById('contactNo').value.trim(),
      address: document.getElementById('address').value.trim(),
    }),
  });
  await loadRecords();
}

async function persistAttendance() {
  await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId: attendanceEmployeeSelect.value,
      status: attendanceStatusSelect.value,
      timestamp: new Date().toLocaleString(),
    }),
  });
  await loadAttendance();
}

function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.style.color = isError ? '#fca5a5' : '#fef08a';
}

function login(username, password) {
  const isAdmin = username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
  const isUser = username === USER_CREDENTIALS.username && password === USER_CREDENTIALS.password;

  if (!isAdmin && !isUser) {
    showMessage(loginMessage, 'Invalid credentials.', true);
    return;
  }

  currentRole = isAdmin ? 'admin' : 'user';
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  welcomeText.textContent = `Welcome, ${currentRole === 'admin' ? 'Admin' : 'User'} (${username})`;
  showMessage(loginMessage, '');

  updateAdminAccess();
  loadRecords();
  loadAttendance();
}

function updateAdminAccess() {
  const adminOnlyElements = document.querySelectorAll('[data-admin-only]');
  const isAdmin = currentRole === 'admin';

  adminOnlyElements.forEach((element) => {
    element.disabled = !isAdmin;
    element.style.opacity = isAdmin ? '1' : '0.5';
    element.style.pointerEvents = isAdmin ? 'auto' : 'none';
  });

  if (!isAdmin && attendanceTabButton) {
    attendanceTabButton.classList.add('hidden');
  }

  if (isAdmin && attendanceTabButton) {
    attendanceTabButton.classList.remove('hidden');
  }
}

function resetForm() {
  recordForm.reset();
  document.getElementById('recordId').value = '';
  document.getElementById('saveBtn').textContent = 'Save Record';
}

function renderRecords() {
  const term = searchInput.value.trim().toLowerCase();
  const filteredRecords = records
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((record) => {
      return [
        record.employeeId,
        record.name,
        record.department,
        record.address,
        record.contactNo,
      ].some((value) => String(value).toLowerCase().includes(term));
    });

  recordsTableBody.innerHTML = '';

  filteredRecords.forEach((record) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.employeeId}</td>
      <td>${record.name}</td>
      <td>${record.department}</td>
      <td>${record.salary}</td>
      <td>${record.contactNo}</td>
      <td>${record.address}</td>
      <td>
        <div class="actions-cell">
          <button type="button" class="secondary-btn" data-action="edit" data-id="${record.id}">Edit</button>
          <button type="button" class="danger-btn" data-action="delete" data-id="${record.id}">Delete</button>
        </div>
      </td>
    `;
    recordsTableBody.appendChild(row);
  });

  recordsTableBody.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.disabled = currentRole !== 'admin';
    button.style.display = currentRole === 'admin' ? 'inline-block' : 'none';
    button.addEventListener('click', () => fillEditForm(button.dataset.id));
  });

  recordsTableBody.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.disabled = currentRole !== 'admin';
    button.style.display = currentRole === 'admin' ? 'inline-block' : 'none';
    button.addEventListener('click', () => deleteRecord(button.dataset.id));
  });
}

function fillEditForm(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;

  document.getElementById('recordId').value = record.id;
  document.getElementById('employeeId').value = record.employeeId;
  document.getElementById('age').value = record.age;
  document.getElementById('name').value = record.name;
  document.getElementById('department').value = record.department;
  document.getElementById('salary').value = record.salary;
  document.getElementById('contactNo').value = record.contactNo;
  document.getElementById('address').value = record.address;
  document.getElementById('saveBtn').textContent = 'Update Record';
}

async function deleteRecord(id) {
  if (currentRole !== 'admin') {
    return;
  }

  const response = await fetch(`/api/records/${id}`, { method: 'DELETE' });
  const data = await response.json();
  records = data.records;
  await loadAttendance();
  renderRecords();
}

async function handleRecordSubmit(event) {
  event.preventDefault();

  const recordId = document.getElementById('recordId').value;
  const payload = {
    employeeId: document.getElementById('employeeId').value.trim(),
    age: Number(document.getElementById('age').value),
    name: document.getElementById('name').value.trim(),
    department: document.getElementById('department').value.trim(),
    salary: Number(document.getElementById('salary').value),
    contactNo: document.getElementById('contactNo').value.trim(),
    address: document.getElementById('address').value.trim(),
  };

  if (!payload.employeeId || !payload.name || !payload.department) {
    return;
  }

  if (recordId) {
    payload.id = recordId;
  }

  await fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  resetForm();
  await loadRecords();
  await loadAttendance();
}

function renderAttendance() {
  attendanceEmployeeSelect.innerHTML = '';
  records.forEach((record) => {
    const option = document.createElement('option');
    option.value = record.id;
    option.textContent = `${record.employeeId} - ${record.name}`;
    attendanceEmployeeSelect.appendChild(option);
  });

  const attendanceRows = Object.entries(attendance).map(([id, entry]) => {
    const employee = records.find((record) => record.id === id);
    if (!employee) return null;

    const status = typeof entry === 'string' ? entry : entry?.status || 'Unknown';
    const timestamp = typeof entry === 'string' ? '' : entry?.timestamp || 'No timestamp';

    return `
      <tr>
        <td>${employee.employeeId}</td>
        <td>${employee.name}</td>
        <td>${status}</td>
        <td>${timestamp}</td>
      </tr>
    `;
  }).filter(Boolean);

  attendanceTableBody.innerHTML = attendanceRows.join('');
}

async function markAttendance() {
  if (currentRole !== 'admin') return;

  const selectedId = attendanceEmployeeSelect.value;
  const selectedStatus = attendanceStatusSelect.value;

  attendance[selectedId] = selectedStatus;
  await persistAttendance();
}

function setupTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      tabButtons.forEach((btn) => btn.classList.remove('active'));
      tabPanels.forEach((panel) => panel.classList.add('hidden'));
      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.remove('hidden');
    });
  });
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  login(username, password);
});

logoutBtn.addEventListener('click', () => {
  currentRole = null;
  dashboardSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  loginForm.reset();
  resetForm();
  showMessage(loginMessage, '');
});

searchInput.addEventListener('input', renderRecords);
recordForm.addEventListener('submit', handleRecordSubmit);
document.getElementById('resetBtn').addEventListener('click', resetForm);
markAttendanceBtn.addEventListener('click', markAttendance);

setupTabs();
loadRecords();
loadAttendance();
