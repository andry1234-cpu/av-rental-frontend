// Variabili globali
let allResponsibili = [];
let allPersonnel = [];
let allMaterials = [];
let allJobs = [];
let selectedPersonnel = [];
let selectedMaterials = [];

const API_BASE = 'https://av-rental-backend.onrender.com/api/jobs';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  setupTabNavigation();
  loadResponsibili();
  loadPersonnel();
  loadMaterials();
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
  // Toggle selezione personale (semplificato)
  var list = document.getElementById('personnel-list');
  list.innerHTML = '';
  
  allPersonnel.forEach(function(pers) {
    var btn = document.createElement('div');
    btn.className = 'multi-item';
    btn.innerHTML = pers.name + '<span class="multi-item-close" onclick="removePersonnelFromSelection(\'' + pers._id + '\')">&times;</span>';
    list.appendChild(btn);
  });
}

function openMaterialModal() {
  // Toggle selezione materiali (semplificato)
  var list = document.getElementById('materials-list');
  list.innerHTML = '';
  
  allMaterials.forEach(function(mat) {
    var btn = document.createElement('div');
    btn.className = 'multi-item';
    btn.innerHTML = mat.name + '<span class="multi-item-close" onclick="removeMaterialFromSelection(\'' + mat._id + '\')">&times;</span>';
    list.appendChild(btn);
  });
}

function removePersonnelFromSelection(id) {
  selectedPersonnel = selectedPersonnel.filter(function(p) { return p !== id; });
  openPersonnelModal();
}

function removeMaterialFromSelection(id) {
  selectedMaterials = selectedMaterials.filter(function(m) { return m !== id; });
  openMaterialModal();
}
