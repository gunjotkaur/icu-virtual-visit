// const API = '/api';
//const API_BASE = "https://YOUR-RENDER-BACKEND.onrender.com";
const API_BASE = "https://icu-virtual-visit.onrender.com";
async function apiFetch(endpoint, options = {}) {
  return fetch(`${API_BASE}${endpoint}`, options);
}


function checkWebsiteLogin() {
  const token = localStorage.getItem('userToken');

  if (!token && window.location.pathname.includes('home.html')) {
    window.location.href = 'login.html';
  }
}

function logoutUser() {
  localStorage.removeItem('userToken');
  window.location.href = 'login.html';
}
async function userSignup() {
  const payload = {
    name: document.getElementById('signupName').value,
    email: document.getElementById('signupEmail').value,
    password: document.getElementById('signupPassword').value
  };

  const res = await apiFetch('/api/auth/signup', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  // const res = await fetch('/api/auth/signup', {
  //   method: 'POST',
  //   headers: {'Content-Type': 'application/json'},
  //   body: JSON.stringify(payload)
  // });

  const data = await res.json();
  alert(data.message);
}

async function userLogin() {
  const payload = {
    email: document.getElementById('loginEmail').value,
    password: document.getElementById('loginPassword').value
  };

  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('userToken', data.token);
    window.location.href = 'home.html';
  } else {
    alert(data.message);
  }
}



// FAMILY LOGIN (OTP)

async function sendOtp() {
  const mobile = document.getElementById('mobile').value.trim();

  if (!mobile) {
    alert('Enter mobile number');
    return;
  }

  const res = await apiFetch('/api/auth/send-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ mobile })
  });

  const data = await res.json();

  if (res.ok) {
    alert(`OTP Sent: ${data.otp}`);
  } else {
    alert(data.message);
  }
}

async function verifyOtp() {
  const mobile = document.getElementById('mobile').value.trim();
  const otp = document.getElementById('otp').value.trim();

  const res = await apiFetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ mobile, otp })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('mobile', mobile);
    window.location.href = 'dashboard.html';
  } else {
    alert(data.message);
  }
}



// FAMILY VISIT REQUEST

async function sendRequest() {
  const payload = {
    patientId: document.getElementById('patientId').value.trim(),
    familyName: document.getElementById('familyName').value.trim(),
    mobile: localStorage.getItem('mobile'),
    relation: document.getElementById('relation').value.trim(),
    preferredSlot: document.getElementById('preferredSlot').value,
    message: document.getElementById('message').value.trim()
  };

  const res = await apiFetch('/api/family/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (res.ok) {
    alert('Visit request sent successfully');
  } else {
    alert(data.message);
  }
}



// NURSE DASHBOARD

async function loadPendingRequests() {
  const list = document.getElementById('pendingRequests');
  if (!list) return;

  const res = await apiFetch('/api/nurse/pending');
  const requests = await res.json();

  list.innerHTML = requests.map(req => `
    <div class="request-card">
      <p><strong>Patient ID:</strong> ${req.patientId}</p>
      <p><strong>Family:</strong> ${req.familyName}</p>
      <p><strong>Relation:</strong> ${req.relation}</p>
      <p><strong>Slot:</strong> ${req.preferredSlot}</p>
      <p><strong>Status:</strong> ${req.status}</p>

      <button onclick="approveRequest('${req._id}')">Approve</button>
      <button onclick="rejectRequest('${req._id}')">Reject</button>
      <button onclick="markDnd('${req.patientId}')">Critical DND</button>
    </div>
  `).join('');
}

async function approveRequest(id) {
  const timeLimit = prompt('Enter call time limit in seconds', '300');

  const res = await apiFetch(`/api/nurse/approve/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ timeLimit })
  });

  const data = await res.json();

  if (res.ok) {
    alert(`Approved\nRoom ID: ${data.roomId}`);
    loadPendingRequests();
  } else {
    alert(data.message);
  }
}

async function rejectRequest(id) {
  const res = await apiFetch(`/api/nurse/reject/${id}`, {
    method: 'POST'
  });

  const data = await res.json();

  if (res.ok) {
    alert('Request rejected');
    loadPendingRequests();
  } else {
    alert(data.message);
  }
}

async function markDnd(patientId) {
  const res = await apiFetch(`/api/nurse/dnd/${patientId}`, {
    method: 'POST'
  });

  const data = await res.json();

  if (res.ok) {
    alert('Patient marked as critical');
  } else {
    alert(data.message);
  }
}



// HISTORY PAGE

async function loadHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;

  const mobile = localStorage.getItem('mobile');

  const res = await apiFetch(`/api/family/history/${mobile}`);
  const history = await res.json();

  list.innerHTML = history.map(item => `
    <div class="request-card">
      <p><strong>Patient:</strong> ${item.patientId}</p>
      <p><strong>Status:</strong> ${item.status}</p>
      <p><strong>Slot:</strong> ${item.preferredSlot}</p>
      <p><strong>Room:</strong> ${item.roomId || 'Pending'}</p>
    </div>
  `).join('');
}



// FEEDBACK

async function submitFeedback() {
  const roomId = document.getElementById('roomId').value;
  const rating = document.getElementById('rating').value;
  const comment = document.getElementById('comment').value.trim();

  const res = await apiFetch('/api/session/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      roomId,
      rating,
      comment
    })
  });

  const data = await res.json();

  if (res.ok) {
    alert('Feedback submitted successfully');
    window.location.href = 'dashboard.html';
  } else {
    alert(data.message);
  }
}



// SESSION LOG SAVE

async function saveSessionLog(sessionData) {
  await apiFetch('/api/session/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sessionData)
  });
}



// AUTO LOAD SAFE FUNCTIONS

document.addEventListener('DOMContentLoaded', () => {
  checkWebsiteLogin();
  loadPendingRequests();
  loadHistory();
  checkNurseAuth();
});

function nurseLogin() {
  const nurseId = document.getElementById('nurseId').value;
  const password = document.getElementById('nursePassword').value;

  const validId = "NURSE";
  const validPassword = "12345";

  if (nurseId === validId && password === validPassword) {
    localStorage.setItem("nurseAuth", "true");
    window.location.href = "nurse.html";
  } else {
    alert("Invalid Nurse Credentials");
  }
}

function checkNurseAuth() {
  if (
    window.location.pathname.includes("nurse.html") &&
    localStorage.getItem("nurseAuth") !== "true"
  ) {
    window.location.href = "nurse-login.html";
  }
}