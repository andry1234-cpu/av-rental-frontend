// ANAGRAFICA PAGE - Responsabili, Tecnici, Luoghi

const API_BASE = 'https://av-rental-backend.onrender.com/api';

let allResponsabili = [];
let allTecnici = [];
let allLuoghi = [];

let currentResponsabileId = null;
let currentTecnicoId = null;
let currentLuogoId = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  setupTabNavigation();
  loadResponsabili();
  loadTecnici();
  loadLuoghi();
  
  // Form submission handlers
  document.getElementById('responsabile-form').addEventListener('submit', saveResponsabile);
  document.getElementById('tecnico-form').addEventListener('submit', saveTecnico);
  document.getElementById('luogo-form').addEventListener('submit', saveLuogo);
});

// ===== TAB NAVIGATION =====
function setupTabNavigation() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      this.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    });
  });
}

// ===== RESPONSABILI =====
async function loadResponsabili() {
  try {
    const res = await fetch(API_BASE + '/responsibili');
    if (res.ok) {
      allResponsabili = await res.json();
      displayResponsabili();
    }
  } catch (e) {
    console.error('Errore caricamento responsabili:', e);
  }
}

function displayResponsabili() {
  const container = document.getElementById('responsabili-list');
  if (allResponsabili.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👤</div><p>Nessun responsabile presente</p></div>';
    return;
  }
  
  container.innerHTML = allResponsabili.map(resp => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">${resp.name} ${resp.surname || ''}</div>
        ${resp.phone ? `<div class="item-detail"><span class="item-detail-label">Telefono:</span> ${resp.phone}</div>` : ''}
        ${resp.email ? `<div class="item-detail"><span class="item-detail-label">Email:</span> ${resp.email}</div>` : ''}
      </div>
      <div class="item-actions">
        <button class="btn-small btn-edit" onclick="editResponsabile('${resp._id}')">Modifica</button>
        <button class="btn-small btn-delete" onclick="deleteResponsabile('${resp._id}')">Elimina</button>
      </div>
    </div>
  `).join('');
}

function openResponsabileModal() {
  currentResponsabileId = null;
  document.getElementById('responsabile-form').reset();
  document.getElementById('responsabile-modal').classList.add('active');
}

function closeResponsabileModal() {
  document.getElementById('responsabile-modal').classList.remove('active');
}

function editResponsabile(id) {
  const resp = allResponsabili.find(r => r._id === id);
  if (!resp) return;
  
  currentResponsabileId = id;
  document.getElementById('resp-name').value = resp.name || '';
  document.getElementById('resp-surname').value = resp.surname || '';
  document.getElementById('resp-phone').value = resp.phone || '';
  document.getElementById('resp-email').value = resp.email || '';
  
  document.getElementById('responsabile-modal').classList.add('active');
}

async function saveResponsabile(e) {
  e.preventDefault();
  
  const data = {
    name: document.getElementById('resp-name').value,
    surname: document.getElementById('resp-surname').value,
    phone: document.getElementById('resp-phone').value,
    email: document.getElementById('resp-email').value
  };
  
  try {
    const url = currentResponsabileId 
      ? API_BASE + '/responsibili/' + currentResponsabileId
      : API_BASE + '/responsibili';
    
    const method = currentResponsabileId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      await loadResponsabili();
      closeResponsabileModal();
      alert(currentResponsabileId ? 'Responsabile aggiornato' : 'Responsabile creato');
    } else {
      alert('Errore nel salvataggio');
    }
  } catch (e) {
    console.error('Errore:', e);
    alert('Errore nel salvataggio');
  }
}

async function deleteResponsabile(id) {
  if (!confirm('Sei sicuro?')) return;
  
  try {
    const res = await fetch(API_BASE + '/responsibili/' + id, { method: 'DELETE' });
    if (res.ok) {
      await loadResponsabili();
      alert('Responsabile eliminato');
    }
  } catch (e) {
    console.error('Errore:', e);
  }
}

// ===== TECNICI =====
async function loadTecnici() {
  try {
    const res = await fetch(API_BASE + '/personnel');
    if (res.ok) {
      allTecnici = await res.json();
      displayTecnici();
    }
  } catch (e) {
    console.error('Errore caricamento tecnici:', e);
  }
}

function displayTecnici() {
  const container = document.getElementById('tecnici-list');
  if (allTecnici.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔧</div><p>Nessun tecnico presente</p></div>';
    return;
  }
  
  container.innerHTML = allTecnici.map(tec => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">${tec.name} ${tec.surname || ''}</div>
        ${tec.phone ? `<div class="item-detail"><span class="item-detail-label">Telefono:</span> ${tec.phone}</div>` : ''}
        ${tec.specialization ? `<div class="item-detail"><span class="item-detail-label">Specializzazione:</span> ${tec.specialization}</div>` : ''}
      </div>
      <div class="item-actions">
        <button class="btn-small btn-edit" onclick="editTecnico('${tec._id}')">Modifica</button>
        <button class="btn-small btn-delete" onclick="deleteTecnico('${tec._id}')">Elimina</button>
      </div>
    </div>
  `).join('');
}

function openTecnicoModal() {
  currentTecnicoId = null;
  document.getElementById('tecnico-form').reset();
  document.getElementById('tecnico-modal').classList.add('active');
}

function closeTecnicoModal() {
  document.getElementById('tecnico-modal').classList.remove('active');
}

function editTecnico(id) {
  const tec = allTecnici.find(t => t._id === id);
  if (!tec) return;
  
  currentTecnicoId = id;
  document.getElementById('tec-name').value = tec.name || '';
  document.getElementById('tec-surname').value = tec.surname || '';
  document.getElementById('tec-phone').value = tec.phone || '';
  document.getElementById('tec-specialization').value = tec.specialization || '';
  
  document.getElementById('tecnico-modal').classList.add('active');
}

async function saveTecnico(e) {
  e.preventDefault();
  
  const data = {
    name: document.getElementById('tec-name').value,
    surname: document.getElementById('tec-surname').value,
    phone: document.getElementById('tec-phone').value,
    specialization: document.getElementById('tec-specialization').value
  };
  
  try {
    const url = currentTecnicoId 
      ? API_BASE + '/personnel/' + currentTecnicoId
      : API_BASE + '/personnel';
    
    const method = currentTecnicoId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      await loadTecnici();
      closeTecnicoModal();
      alert(currentTecnicoId ? 'Tecnico aggiornato' : 'Tecnico creato');
    } else {
      alert('Errore nel salvataggio');
    }
  } catch (e) {
    console.error('Errore:', e);
    alert('Errore nel salvataggio');
  }
}

async function deleteTecnico(id) {
  if (!confirm('Sei sicuro?')) return;
  
  try {
    const res = await fetch(API_BASE + '/personnel/' + id, { method: 'DELETE' });
    if (res.ok) {
      await loadTecnici();
      alert('Tecnico eliminato');
    }
  } catch (e) {
    console.error('Errore:', e);
  }
}

// ===== LUOGHI =====
async function loadLuoghi() {
  try {
    const res = await fetch(API_BASE + '/locations');
    if (res.ok) {
      allLuoghi = await res.json();
      displayLuoghi();
    }
  } catch (e) {
    console.error('Errore caricamento luoghi:', e);
  }
}

function displayLuoghi() {
  const container = document.getElementById('luoghi-list');
  if (allLuoghi.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📍</div><p>Nessun luogo presente</p></div>';
    return;
  }
  
  container.innerHTML = allLuoghi.map(luogo => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">${luogo.name}</div>
        ${luogo.address ? `<div class="item-detail"><span class="item-detail-label">Indirizzo:</span> ${luogo.address}</div>` : ''}
        ${luogo.city ? `<div class="item-detail"><span class="item-detail-label">Città:</span> ${luogo.city} ${luogo.cap ? luogo.cap : ''}</div>` : ''}
      </div>
      <div class="item-actions">
        <button class="btn-small btn-edit" onclick="editLuogo('${luogo._id}')">Modifica</button>
        <button class="btn-small btn-delete" onclick="deleteLuogo('${luogo._id}')">Elimina</button>
      </div>
    </div>
  `).join('');
}

function openLuogoModal() {
  currentLuogoId = null;
  document.getElementById('luogo-form').reset();
  document.getElementById('luogo-modal').classList.add('active');
}

function closeLuogoModal() {
  document.getElementById('luogo-modal').classList.remove('active');
}

function editLuogo(id) {
  const luogo = allLuoghi.find(l => l._id === id);
  if (!luogo) return;
  
  currentLuogoId = id;
  document.getElementById('luogo-name').value = luogo.name || '';
  document.getElementById('luogo-address').value = luogo.address || '';
  document.getElementById('luogo-city').value = luogo.city || '';
  document.getElementById('luogo-cap').value = luogo.cap || '';
  
  document.getElementById('luogo-modal').classList.add('active');
}

async function saveLuogo(e) {
  e.preventDefault();
  
  const data = {
    name: document.getElementById('luogo-name').value,
    address: document.getElementById('luogo-address').value,
    city: document.getElementById('luogo-city').value,
    cap: document.getElementById('luogo-cap').value
  };
  
  try {
    const url = currentLuogoId 
      ? API_BASE + '/locations/' + currentLuogoId
      : API_BASE + '/locations';
    
    const method = currentLuogoId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      await loadLuoghi();
      closeLuogoModal();
      alert(currentLuogoId ? 'Luogo aggiornato' : 'Luogo creato');
    } else {
      alert('Errore nel salvataggio');
    }
  } catch (e) {
    console.error('Errore:', e);
    alert('Errore nel salvataggio');
  }
}

async function deleteLuogo(id) {
  if (!confirm('Sei sicuro?')) return;
  
  try {
    const res = await fetch(API_BASE + '/locations/' + id, { method: 'DELETE' });
    if (res.ok) {
      await loadLuoghi();
      alert('Luogo eliminato');
    }
  } catch (e) {
    console.error('Errore:', e);
  }
}

// Close modals when clicking outside
window.addEventListener('click', function(e) {
  const respModal = document.getElementById('responsabile-modal');
  const tecModal = document.getElementById('tecnico-modal');
  const luogoModal = document.getElementById('luogo-modal');
  
  if (e.target === respModal) respModal.classList.remove('active');
  if (e.target === tecModal) tecModal.classList.remove('active');
  if (e.target === luogoModal) luogoModal.classList.remove('active');
});
