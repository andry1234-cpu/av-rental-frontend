// Variabili globali
let allResponsibili = [];
let allPersonnel = [];
let allMaterials = [];
let allEquipment = [];
let allJobs = [];
let selectedPersonnel = [];
let selectedMaterials = [];
let selectedEquipment = [];

const API_BASE = 'https://av-rental-backend.onrender.com/api/jobs';
const EQUIPMENT_API = 'https://av-rental-backend.onrender.com/api/equipment';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  setupTabNavigation();
  loadResponsibili();
  loadPersonnel();
  loadMaterials();
  loadEquipment();
  loadJobs();
  setupFormListeners();
});

// ===== TAB NAVIGATION =====
function setupTabNavigation() {
  var tabBtns = document.querySelectorAll('.tab-btn');
  var tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tabName = btn.getAttribute('data-tab');
      
      tabBtns.forEach(function(b) { b.classList.remove('active'); });
      tabContents.forEach(function(tc) { tc.classList.remove('active'); });
      
      btn.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    });
  });
}

// ===== FORM LISTENERS =====
function setupFormListeners() {
  document.getElementById('new-job-form').addEventListener('submit', createJob);
  document.getElementById('responsibile-form').addEventListener('submit', createResponsibile);
  document.getElementById('personnel-form').addEventListener('submit', createPersonnel);
  document.getElementById('material-form').addEventListener('submit', createMaterial);
}

// ===== LOAD DATA =====
async function loadResponsibili() {
  try {
    var res = await fetch(API_BASE + '/responsibili/list');
    allResponsibili = await res.json();
    populateResponsibileSelect();
    displayResponsibili();
  } catch (error) {
    console.error('Errore caricamento responsabili:', error);
  }
}

async function loadPersonnel() {
  try {
    var res = await fetch(API_BASE + '/personnel/list');
    allPersonnel = await res.json();
    displayPersonnel();
  } catch (error) {
    console.error('Errore caricamento personale:', error);
  }
}

async function loadMaterials() {
  try {
    var res = await fetch(API_BASE + '/materials/list');
    allMaterials = await res.json();
    displayMaterials();
  } catch (error) {
    console.error('Errore caricamento materiali:', error);
  }
}

async function loadEquipment() {
  try {
    var res = await fetch(API_BASE + '/equipment/list');
    allEquipment = await res.json();
  } catch (error) {
    console.error('Errore caricamento equipment:', error);
  }
}

async function loadJobs() {
  try {
    var res = await fetch(API_BASE);
    allJobs = await res.json();
    displayJobs();
  } catch (error) {
    console.error('Errore caricamento lavori:', error);
  }
}

// ===== POPULATE SELECTS =====
function populateResponsibileSelect() {
  var select = document.getElementById('job-responsibile');
  select.innerHTML = '<option value="">-- Seleziona Responsabile --</option>';
  
  allResponsibili.forEach(function(resp) {
    var option = document.createElement('option');
    option.value = resp._id;
    option.textContent = resp.name;
    select.appendChild(option);
  });
}

// ===== CREATE FUNCTIONS =====
async function createJob(e) {
  e.preventDefault();
  
  var jobData = {
    name: document.getElementById('job-name').value,
    startDate: document.getElementById('job-start-date').value,
    endDate: document.getElementById('job-end-date').value,
    location: document.getElementById('job-location').value,
    responsibile: document.getElementById('job-responsibile').value,
    personnel: selectedPersonnel,
    materials: selectedMaterials,
    notes: document.getElementById('job-notes').value,
    status: 'confirmed'
  };
  
  try {
    var res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });
    
    if (res.ok) {
      alert('Lavoro creato con successo!');
      document.getElementById('new-job-form').reset();
      selectedPersonnel = [];
      selectedMaterials = [];
      document.getElementById('personnel-list').innerHTML = '';
      document.getElementById('materials-list').innerHTML = '';
      loadJobs();
    } else {
      alert('Errore nella creazione del lavoro');
    }
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore nella creazione del lavoro');
  }
}

async function createResponsibile(e) {
  e.preventDefault();
  
  var respData = {
    name: document.getElementById('resp-name').value,
    email: document.getElementById('resp-email').value,
    phone: document.getElementById('resp-phone').value
  };
  
  try {
    var res = await fetch(API_BASE + '/responsibili/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(respData)
    });
    
    if (res.ok) {
      alert('Responsabile aggiunto!');
      document.getElementById('responsibile-form').reset();
      loadResponsibili();
    } else {
      alert('Responsabile già esiste');
    }
  } catch (error) {
    console.error('Errore:', error);
  }
}

async function createPersonnel(e) {
  e.preventDefault();
  
  var persData = {
    name: document.getElementById('pers-name').value,
    role: document.getElementById('pers-role').value,
    email: document.getElementById('pers-email').value,
    phone: document.getElementById('pers-phone').value
  };
  
  try {
    var res = await fetch(API_BASE + '/personnel/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(persData)
    });
    
    if (res.ok) {
      alert('Personale aggiunto!');
      document.getElementById('personnel-form').reset();
      loadPersonnel();
    } else {
      alert('Personale già esiste');
    }
  } catch (error) {
    console.error('Errore:', error);
  }
}

async function createMaterial(e) {
  e.preventDefault();
  
  var matData = {
    name: document.getElementById('mat-name').value,
    category: document.getElementById('mat-category').value,
    description: document.getElementById('mat-description').value
  };
  
  try {
    var res = await fetch(API_BASE + '/materials/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matData)
    });
    
    if (res.ok) {
      alert('Materiale aggiunto!');
      document.getElementById('material-form').reset();
      loadMaterials();
    } else {
      alert('Materiale già esiste');
    }
  } catch (error) {
    console.error('Errore:', error);
  }
}

// ===== DISPLAY FUNCTIONS =====
function displayResponsibili() {
  var container = document.getElementById('responsibili-list');
  container.innerHTML = '';
  
  allResponsibili.forEach(function(resp) {
    var item = document.createElement('div');
    item.className = 'data-item';
    item.innerHTML = '<div><div class="data-item-name">' + resp.name + '</div>' +
                     '<div class="data-item-meta">' + resp.email + ' | ' + resp.phone + '</div></div>';
    container.appendChild(item);
  });
}

function displayPersonnel() {
  var container = document.getElementById('personnel-list-admin');
  container.innerHTML = '';
  
  allPersonnel.forEach(function(pers) {
    var item = document.createElement('div');
    item.className = 'data-item';
    item.innerHTML = '<div><div class="data-item-name">' + pers.name + '</div>' +
                     '<div class="data-item-meta">' + pers.role + ' | ' + pers.email + '</div></div>';
    container.appendChild(item);
  });
}

function displayMaterials() {
  var container = document.getElementById('materials-list-admin');
  container.innerHTML = '';
  
  allMaterials.forEach(function(mat) {
    var item = document.createElement('div');
    item.className = 'data-item';
    item.innerHTML = '<div><div class="data-item-name">' + mat.name + '</div>' +
                     '<div class="data-item-meta">' + mat.category + '</div></div>';
    container.appendChild(item);
  });
}

function displayJobs() {
  var container = document.getElementById('jobs-archive');
  container.innerHTML = '';
  
  if (allJobs.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #888;">Nessun lavoro registrato</p>';
    return;
  }
  
  allJobs.forEach(function(job) {
    var startDate = new Date(job.startDate).toLocaleDateString('it-IT');
    var endDate = new Date(job.endDate).toLocaleDateString('it-IT');
    
    var card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = '<h4>' + job.name + '</h4>' +
                     '<div class="job-card-row">' +
                     '  <div class="job-card-item">' +
                     '    <div class="job-card-label">Data</div>' +
                     '    <div class="job-card-value">' + startDate + ' - ' + endDate + '</div>' +
                     '  </div>' +
                     '  <div class="job-card-item">' +
                     '    <div class="job-card-label">Luogo</div>' +
                     '    <div class="job-card-value">' + job.location + '</div>' +
                     '  </div>' +
                     '</div>' +
                     '<div class="job-card-row">' +
                     '  <div class="job-card-item">' +
                     '    <div class="job-card-label">Responsabile</div>' +
                     '    <div class="job-card-value">' + (job.responsibile ? job.responsibile.name : '-') + '</div>' +
                     '  </div>' +
                     '  <div class="job-card-item">' +
                     '    <div class="job-card-label">Status</div>' +
                     '    <div class="job-card-value">' + job.status + '</div>' +
                     '  </div>' +
                     '</div>';
    container.appendChild(card);
  });
}

// ===== MODALS (placeholder) =====
function openResponsibileModal() {
  alert('Usa la scheda "Gestisci Dati" per aggiungere responsabili');
}

function openPersonnelModal() {
  // Crea modal per selezione personale
  var modal = '<div class="modal-overlay" id="personnel-modal-overlay">';
  modal += '<div class="modal-content">';
  modal += '<div class="modal-header">';
  modal += '<h3>Seleziona Personale</h3>';
  modal += '<span class="modal-close" onclick="closePersonnelModal()">&times;</span>';
  modal += '</div>';
  modal += '<div class="modal-body">';
  
  if (allPersonnel.length === 0) {
    modal += '<p style="text-align: center; color: #888;">Nessun personale disponibile. Aggiungi prima dalla scheda Gestisci Dati</p>';
  } else {
    modal += '<div class="modal-list">';
    allPersonnel.forEach(function(pers) {
      var isSelected = selectedPersonnel.indexOf(pers._id) > -1;
      modal += '<div class="modal-item' + (isSelected ? ' selected' : '') + '" onclick="togglePersonnelSelection(\'' + pers._id + '\', this)">';
      modal += '<input type="checkbox"' + (isSelected ? ' checked' : '') + '> ' + pers.name + ' (' + pers.role + ')';
      modal += '</div>';
    });
    modal += '</div>';
  }
  
  modal += '</div>';
  modal += '<div class="modal-footer">';
  modal += '<button class="btn-secondary" onclick="closePersonnelModal()">Chiudi</button>';
  modal += '</div>';
  modal += '</div>';
  modal += '</div>';
  
  document.body.insertAdjacentHTML('beforeend', modal);
  updatePersonnelDisplay();
}

function closePersonnelModal() {
  var overlay = document.getElementById('personnel-modal-overlay');
  if (overlay) overlay.remove();
}

function togglePersonnelSelection(id, elem) {
  var idx = selectedPersonnel.indexOf(id);
  if (idx > -1) {
    selectedPersonnel.splice(idx, 1);
    elem.classList.remove('selected');
    elem.querySelector('input[type="checkbox"]').checked = false;
  } else {
    selectedPersonnel.push(id);
    elem.classList.add('selected');
    elem.querySelector('input[type="checkbox"]').checked = true;
  }
}

function updatePersonnelDisplay() {
  var list = document.getElementById('personnel-list');
  list.innerHTML = '';
  
  selectedPersonnel.forEach(function(id) {
    var pers = allPersonnel.find(function(p) { return p._id === id; });
    if (pers) {
      var item = document.createElement('div');
      item.className = 'multi-item';
      item.innerHTML = pers.name + '<span class="multi-item-close" onclick="removePersonnelFromSelection(\'' + id + '\')">&times;</span>';
      list.appendChild(item);
    }
  });
}

function removePersonnelFromSelection(id) {
  var idx = selectedPersonnel.indexOf(id);
  if (idx > -1) {
    selectedPersonnel.splice(idx, 1);
    updatePersonnelDisplay();
  }
}

function openMaterialModal() {
  // Crea modal con due tab: Materiali personalizzati + Equipment
  var modal = '<div class="modal-overlay" id="material-modal-overlay">';
  modal += '<div class="modal-content">';
  modal += '<div class="modal-header">';
  modal += '<h3>Seleziona Materiali</h3>';
  modal += '<span class="modal-close" onclick="closeMaterialModal()">&times;</span>';
  modal += '</div>';
  modal += '<div class="modal-tabs">';
  modal += '<button class="modal-tab-btn active" onclick="switchMaterialTab(\'custom\', this)">Materiali Personalizzati</button>';
  modal += '<button class="modal-tab-btn" onclick="switchMaterialTab(\'equipment\', this)">Equipment Magazzino</button>';
  modal += '</div>';
  modal += '<div class="modal-body">';
  
  // Tab Materiali
  modal += '<div id="material-tab-custom" class="modal-tab active">';
  if (allMaterials.length === 0) {
    modal += '<p style="text-align: center; color: #888;">Nessun materiale disponibile</p>';
  } else {
    modal += '<div class="modal-list">';
    allMaterials.forEach(function(mat) {
      var isSelected = selectedMaterials.indexOf(mat._id) > -1;
      modal += '<div class="modal-item' + (isSelected ? ' selected' : '') + '" onclick="toggleMaterialSelection(\'' + mat._id + '\', this, \'material\')">';
      modal += '<input type="checkbox"' + (isSelected ? ' checked' : '') + '> ' + mat.name + ' (' + mat.category + ')';
      modal += '</div>';
    });
    modal += '</div>';
  }
  modal += '</div>';
  
  // Tab Equipment
  modal += '<div id="material-tab-equipment" class="modal-tab">';
  if (allEquipment.length === 0) {
    modal += '<p style="text-align: center; color: #888;">Nessun equipment disponibile</p>';
  } else {
    modal += '<div class="modal-list">';
    allEquipment.forEach(function(eq) {
      var isSelected = selectedMaterials.indexOf(eq._id) > -1;
      modal += '<div class="modal-item' + (isSelected ? ' selected' : '') + '" onclick="toggleMaterialSelection(\'' + eq._id + '\', this, \'equipment\')">';
      modal += '<input type="checkbox"' + (isSelected ? ' checked' : '') + '> ' + eq.name + ' (' + eq.category + ') - Q: ' + eq.quantity;
      modal += '</div>';
    });
    modal += '</div>';
  }
  modal += '</div>';
  
  modal += '</div>';
  modal += '<div class="modal-footer">';
  modal += '<button class="btn-secondary" onclick="closeMaterialModal()">Chiudi</button>';
  modal += '</div>';
  modal += '</div>';
  modal += '</div>';
  
  document.body.insertAdjacentHTML('beforeend', modal);
  updateMaterialDisplay();
}

function closeMaterialModal() {
  var overlay = document.getElementById('material-modal-overlay');
  if (overlay) overlay.remove();
}

function switchMaterialTab(tabName, elem) {
  var tabs = document.querySelectorAll('.modal-tab');
  var btns = document.querySelectorAll('.modal-tab-btn');
  
  tabs.forEach(function(tab) { tab.classList.remove('active'); });
  btns.forEach(function(btn) { btn.classList.remove('active'); });
  
  document.getElementById('material-tab-' + tabName).classList.add('active');
  elem.classList.add('active');
}

function toggleMaterialSelection(id, elem, type) {
  var idx = selectedMaterials.indexOf(id);
  if (idx > -1) {
    selectedMaterials.splice(idx, 1);
    elem.classList.remove('selected');
    elem.querySelector('input[type="checkbox"]').checked = false;
  } else {
    selectedMaterials.push(id);
    elem.classList.add('selected');
    elem.querySelector('input[type="checkbox"]').checked = true;
  }
}

function updateMaterialDisplay() {
  var list = document.getElementById('materials-list');
  list.innerHTML = '';
  
  selectedMaterials.forEach(function(id) {
    var mat = allMaterials.find(function(m) { return m._id === id; });
    var eq = allEquipment.find(function(e) { return e._id === id; });
    var item = mat || eq;
    
    if (item) {
      var div = document.createElement('div');
      div.className = 'multi-item';
      div.innerHTML = item.name + '<span class="multi-item-close" onclick="removeMaterialFromSelection(\'' + id + '\')">&times;</span>';
      list.appendChild(div);
    }
  });
}

function removeMaterialFromSelection(id) {
  var idx = selectedMaterials.indexOf(id);
  if (idx > -1) {
    selectedMaterials.splice(idx, 1);
    updateMaterialDisplay();
  }
}
