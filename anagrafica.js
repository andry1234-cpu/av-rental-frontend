// ANAGRAFICA PAGE - Responsabili, Tecnici, Luoghi

const API_BASE = 'https://av-rental-backend.onrender.com/api';

let allResponsabili = [];
let allTecnici = [];
let allLuoghi = [];
let allTecniciCategories = [];
let selectedTecnicoFilter = 'all'; // Filtro categoria tecnici

let currentResponsabileId = null;
let currentTecnicoId = null;
let currentLuogoId = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  setupTabNavigation();
  restoreActiveTab();
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
      
      // Salva la scheda attiva nel localStorage
      localStorage.setItem('anagrafica-active-tab', tabName);
    });
  });
}

function restoreActiveTab() {
  const activeTab = localStorage.getItem('anagrafica-active-tab') || 'responsabili';
  
  // Rimuovi active da tutti
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  
  // Aggiungi active alla scheda salvata
  const btn = document.querySelector(`[data-tab="${activeTab}"]`);
  if (btn) {
    btn.classList.add('active');
    document.getElementById(activeTab).classList.add('active');
  }
}

// ===== RESPONSABILI =====
async function loadResponsabili() {
  try {
    const res = await fetch(API_BASE + '/jobs/responsibili/list');
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
      ? API_BASE + '/jobs/responsibili/' + currentResponsabileId
      : API_BASE + '/jobs/responsibili/create';
    
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
    const res = await fetch(API_BASE + '/jobs/responsibili/' + id, { method: 'DELETE' });
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
    const [resPersonnel, resCategories] = await Promise.all([
      fetch(API_BASE + '/jobs/personnel/list'),
      fetch(API_BASE + '/jobs/personnel/categories')
    ]);
    
    if (resPersonnel.ok) {
      allTecnici = await resPersonnel.json();
    }
    if (resCategories.ok) {
      allTecniciCategories = await resCategories.json();
    }
    
    displayTecnici();
    setupTecniciFilters();
  } catch (e) {
    console.error('Errore caricamento tecnici:', e);
  }
}

function setupTecniciFilters() {
  const filterContainer = document.getElementById('tecnici-filters');
  if (!filterContainer) return;
  
  filterContainer.innerHTML = '';
  
  // Pulsante "Tutti"
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.textContent = 'Tutti';
  allBtn.onclick = () => {
    selectedTecnicoFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    allBtn.classList.add('active');
    displayTecnici();
  };
  filterContainer.appendChild(allBtn);
  
  // Pulsanti per ogni categoria
  allTecniciCategories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = cat;
    btn.onclick = () => {
      selectedTecnicoFilter = cat;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      displayTecnici();
    };
    filterContainer.appendChild(btn);
  });
}

function displayTecnici() {
  const container = document.getElementById('tecnici-list');
  
  // Filtra tecnici per categoria
  let filtered = allTecnici;
  if (selectedTecnicoFilter !== 'all') {
    filtered = allTecnici.filter(t => t.role === selectedTecnicoFilter);
  }
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔧</div><p>Nessun tecnico presente</p></div>';
    return;
  }
  
  container.innerHTML = filtered.map(tec => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">${tec.name} ${tec.surname || ''}</div>
        ${tec.phone ? `<div class="item-detail"><span class="item-detail-label">Telefono:</span> ${tec.phone}</div>` : ''}
        ${tec.role ? `<div class="item-detail"><span class="item-detail-label">Categoria:</span> ${tec.role}</div>` : ''}
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
  document.getElementById('tec-role').value = tec.role || '';
  
  document.getElementById('tecnico-modal').classList.add('active');
}

async function saveTecnico(e) {
  e.preventDefault();
  
  const data = {
    name: document.getElementById('tec-name').value,
    surname: document.getElementById('tec-surname').value,
    phone: document.getElementById('tec-phone').value,
    role: document.getElementById('tec-role').value
  };
  
  try {
    const url = currentTecnicoId 
      ? API_BASE + '/jobs/personnel/' + currentTecnicoId
      : API_BASE + '/jobs/personnel/create';
    
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
    const res = await fetch(API_BASE + '/jobs/personnel/' + id, { method: 'DELETE' });
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
    // Tentativo di carico dai dati di Job locations
    const res = await fetch(API_BASE + '/jobs');
    if (res.ok) {
      const jobs = await res.json();
      // Estrai location unici dai jobs
      const locationSet = new Set();
      jobs.forEach(job => {
        if (job.location) locationSet.add(job.location);
      });
      allLuoghi = Array.from(locationSet).map(loc => ({
        _id: loc,
        name: loc,
        address: '',
        city: '',
        cap: ''
      }));
      displayLuoghi();
    }
  } catch (e) {
    console.error('Errore caricamento luoghi:', e);
    // Mostra un messaggio se nessun luogo trovato
    displayLuoghi();
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
  // I luoghi sono read-only
  alert('I luoghi vengono estratti automaticamente dai lavori.');
}

function closeLuogoModal() {
  document.getElementById('luogo-modal').classList.remove('active');
}

function editLuogo(id) {
  // I luoghi sono read-only per ora
  alert('I luoghi sono automaticamente sincronizzati dai lavori registrati.');
}

async function saveLuogo(e) {
  e.preventDefault();
  
  // Per ora i luoghi vengono estratti dai Jobs e sono read-only
  // Se vuoi permettere edit/delete, devi creare un modello Location nel backend
  alert('I luoghi vengono estratti automaticamente dai lavori registrati.');
  closeLuogoModal();
}

async function deleteLuogo(id) {
  // I luoghi sono read-only per ora (estratti da jobs)
  alert('I luoghi sono automaticamente sincronizzati dai lavori registrati.');
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
