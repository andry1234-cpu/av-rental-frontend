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
  setupDatePickers();
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
  
  // Carica la tab salvata nel localStorage
  var savedTab = localStorage.getItem('lavoriActiveTab');
  if (savedTab) {
    // Rimuovi active da tutti
    tabBtns.forEach(function(b) { b.classList.remove('active'); });
    tabContents.forEach(function(tc) { tc.classList.remove('active'); });
    
    // Attiva la tab salvata
    var savedBtn = document.querySelector('[data-tab="' + savedTab + '"]');
    if (savedBtn) {
      savedBtn.classList.add('active');
      document.getElementById(savedTab).classList.add('active');
    }
  }
  
  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tabName = btn.getAttribute('data-tab');
      
      // Salva la tab nel localStorage
      localStorage.setItem('lavoriActiveTab', tabName);
      
      tabBtns.forEach(function(b) { b.classList.remove('active'); });
      tabContents.forEach(function(tc) { tc.classList.remove('active'); });
      
      btn.classList.add('active');
      document.getElementById(tabName).classList.add('active');
      
      // Se torna sulla tab "Nuovo Lavoro", ripristina lo stato del wizard
      if (tabName === 'new-job') {
        loadWizardState();
      }
    });
  });
}

// ===== WIZARD FORM =====
let currentStep = 1;

// Salva lo stato del wizard in localStorage
function saveWizardState() {
  var wizardData = {
    currentStep: currentStep,
    formData: {
      jobName: document.getElementById('job-name').value,
      jobStartDate: document.getElementById('job-start-date').value,
      jobEndDate: document.getElementById('job-end-date').value,
      jobLocation: document.getElementById('job-location').value,
      jobResponsible: document.getElementById('job-responsibile').value,
      selectedPersonnel: selectedPersonnel
    }
  };
  localStorage.setItem('wizardState', JSON.stringify(wizardData));
}

// Carica lo stato del wizard da localStorage
function loadWizardState() {
  var saved = localStorage.getItem('wizardState');
  if (saved) {
    try {
      var data = JSON.parse(saved);
      currentStep = data.currentStep || 1;
      
      // Ripristina i campi del form
      if (data.formData) {
        document.getElementById('job-name').value = data.formData.jobName || '';
        document.getElementById('job-start-date').value = data.formData.jobStartDate || '';
        document.getElementById('job-end-date').value = data.formData.jobEndDate || '';
        document.getElementById('job-location').value = data.formData.jobLocation || '';
        document.getElementById('job-responsibile').value = data.formData.jobResponsible || '';
        selectedPersonnel = data.formData.selectedPersonnel || [];
        displaySelectedPersonnel();
      }
      
      updateWizardUI();
    } catch (e) {
      console.error('Errore nel caricamento dello stato wizard:', e);
    }
  }
}

// Pulisci lo stato quando il form viene inviato
function clearWizardState() {
  localStorage.removeItem('wizardState');
  selectedPersonnel = [];
  document.getElementById('new-job-form').reset();
  currentStep = 1;
}

function nextStep() {
  saveWizardState();
  if (validateStep(currentStep)) {
    if (currentStep < 3) {
      currentStep++;
      saveWizardState();
      updateWizardUI();
    }
  }
}

function previousStep() {
  if (currentStep > 1) {
    currentStep--;
    saveWizardState();
    updateWizardUI();
  }
}

function validateStep(step) {
  if (step === 1) {
    var name = document.getElementById('job-name').value.trim();
    var startDate = document.getElementById('job-start-date').value;
    var endDate = document.getElementById('job-end-date').value;
    var location = document.getElementById('job-location').value.trim();
    
    if (!name || !startDate || !endDate || !location) {
      alert('Completa tutti i campi dello Step 1');
      return false;
    }
    
    if (new Date(startDate) >= new Date(endDate)) {
      alert('La data fine deve essere dopo la data inizio');
      return false;
    }
  }
  
  if (step === 2) {
    var responsibile = document.getElementById('job-responsibile').value;
    if (!responsibile) {
      alert('Seleziona un Responsabile');
      return false;
    }
  }
  
  return true;
}

function updateWizardUI() {
  // Nascondi tutti gli step
  document.querySelectorAll('.wizard-step-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
  
  // Mostra lo step corrente
  document.getElementById('step-' + currentStep).classList.add('active');
  document.getElementById('step-' + currentStep + '-indicator').classList.add('active');
  
  // Aggiorna pulsanti di navigazione
  var btnPrev = document.getElementById('btn-prev');
  var btnNext = document.getElementById('btn-next');
  var btnSubmit = document.getElementById('btn-submit');
  
  if (currentStep === 1) {
    btnPrev.style.display = 'none';
    btnNext.style.display = 'block';
    btnSubmit.style.display = 'none';
  } else if (currentStep === 2) {
    btnPrev.style.display = 'block';
    btnNext.style.display = 'block';
    btnSubmit.style.display = 'none';
  } else if (currentStep === 3) {
    btnPrev.style.display = 'block';
    btnNext.style.display = 'none';
    btnSubmit.style.display = 'block';
  }
}

// ===== DATE PICKER ENHANCEMENT =====
function setupDatePickers() {
  // Apri il picker quando clicchi ovunque nel campo data
  var dateInputs = document.querySelectorAll('input[type="datetime-local"]');
  dateInputs.forEach(function(input) {
    input.addEventListener('click', function() {
      this.showPicker();
    });
  });
}

// ===== PERSONNEL SEARCH DROPDOWN =====
function setupPersonnelSearch() {
  var searchInput = document.getElementById('personnel-search');
  var dropdown = document.getElementById('personnel-dropdown');
  
  if (!searchInput || !dropdown) return;
  
  searchInput.addEventListener('focus', function() {
    renderPersonnelDropdown('');
    dropdown.classList.add('show');
  });
  
  searchInput.addEventListener('input', function() {
    var query = this.value.toLowerCase().trim();
    renderPersonnelDropdown(query);
    if (query || allPersonnel.length > 0) {
      dropdown.classList.add('show');
    }
  });
  
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.personnel-search-container')) {
      dropdown.classList.remove('show');
    }
  });
}

function renderPersonnelDropdown(query) {
  var dropdown = document.getElementById('personnel-dropdown');
  if (!dropdown) return;
  
  var filtered = allPersonnel.filter(p => 
    p.name.toLowerCase().includes(query) || 
    (p.role && p.role.toLowerCase().includes(query))
  );
  
  if (filtered.length === 0) {
    dropdown.innerHTML = '<div style="padding: 1rem; text-align: center; color: #888;">Nessun personale trovato</div>';
    return;
  }
  
  dropdown.innerHTML = filtered.map(p => 
    '<div class="personnel-item" onclick="addPersonnelToJob(\'' + p._id + '\', \'' + p.name.replace(/'/g, "\\'") + '\')">' +
      '<div class="personnel-item-name">' + p.name + '</div>' +
      '<div class="personnel-item-role">' + (p.role || 'N/A') + '</div>' +
    '</div>'
  ).join('');
}

function addPersonnelToJob(id, name) {
  // Controlla se già aggiunto
  if (selectedPersonnel.find(p => p === id)) {
    alert('Personale già aggiunto');
    return;
  }
  
  selectedPersonnel.push(id);
  displaySelectedPersonnel();
  
  // Chiudi dropdown e pulisci search
  document.getElementById('personnel-search').value = '';
  document.getElementById('personnel-dropdown').classList.remove('show');
}

function displaySelectedPersonnel() {
  var container = document.getElementById('personnel-list');
  container.innerHTML = selectedPersonnel.map(personId => {
    var person = allPersonnel.find(p => p._id === personId);
    return '<div class="multi-item">' + (person ? person.name : 'Sconosciuto') + 
           ' <button type="button" class="remove-btn" onclick="removePersonnelFromJob(\'' + personId + '\')">×</button></div>';
  }).join('');
}

function removePersonnelFromJob(id) {
  selectedPersonnel = selectedPersonnel.filter(p => p !== id);
  displaySelectedPersonnel();
}

// ===== FORM LISTENERS =====
function setupFormListeners() {
  document.getElementById('new-job-form').addEventListener('submit', createJob);
  document.getElementById('responsibile-form').addEventListener('submit', createResponsibile);
  document.getElementById('personnel-form').addEventListener('submit', createPersonnel);
  
  setupPersonnelSearch();
  
  // Archive filters - auto-apply on change
  var filterSearch = document.getElementById('filter-search');
  var resetBtn = document.getElementById('reset-filters-btn');
  
  if (filterSearch) filterSearch.addEventListener('input', applyJobFilters);
  if (resetBtn) resetBtn.addEventListener('click', clearJobFilters);
  
  // Populate year and month checkboxes on page load
  populateYearCheckboxes();
  populateMonthCheckboxes();
  
  // Setup dropdown toggles
  setupDropdownToggles();
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown-filter')) {
      document.querySelectorAll('.dropdown-content').forEach(function(d) {
        d.classList.remove('show');
      });
    }
  });
}

function setupDropdownToggles() {
  var yearsBtn = document.getElementById('years-dropdown-btn');
  var monthsBtn = document.getElementById('months-dropdown-btn');
  var yearsContent = document.getElementById('filter-years').parentElement.querySelector('.dropdown-content');
  var monthsContent = document.getElementById('filter-months').parentElement.querySelector('.dropdown-content');
  
  if (yearsBtn && yearsContent) {
    yearsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      yearsContent.classList.toggle('show');
      monthsContent.classList.remove('show');
    });
  }
  
  if (monthsBtn && monthsContent) {
    monthsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      monthsContent.classList.toggle('show');
      yearsContent.classList.remove('show');
    });
  }
}


// ===== ARCHIVE FILTERS =====
function populateYearCheckboxes() {
  var currentYear = new Date().getFullYear();
  var filterYearsContainer = document.getElementById('filter-years');
  
  if (!filterYearsContainer) return;
  
  filterYearsContainer.innerHTML = '';
  
  // Aggiungi anni da -5 a +2
  for (var i = currentYear - 5; i <= currentYear + 2; i++) {
    var checkbox = document.createElement('div');
    checkbox.className = 'filter-checkbox';
    checkbox.innerHTML = '<input type="checkbox" class="year-filter" value="' + i + '" id="year-' + i + '">' +
                         '<label for="year-' + i + '">' + i + '</label>';
    
    checkbox.querySelector('input').addEventListener('change', applyJobFilters);
    filterYearsContainer.appendChild(checkbox);
  }
}

function populateMonthCheckboxes() {
  var months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  var filterMonthsContainer = document.getElementById('filter-months');
  
  if (!filterMonthsContainer) return;
  
  filterMonthsContainer.innerHTML = '';
  
  months.forEach(function(month, index) {
    var checkbox = document.createElement('div');
    checkbox.className = 'filter-checkbox';
    checkbox.innerHTML = '<input type="checkbox" class="month-filter" value="' + index + '" id="month-' + index + '">' +
                         '<label for="month-' + index + '">' + month + '</label>';
    
    checkbox.querySelector('input').addEventListener('change', applyJobFilters);
    filterMonthsContainer.appendChild(checkbox);
  });
}

function applyJobFilters() {
  // Ottieni anni selezionati
  var selectedYears = [];
  document.querySelectorAll('.year-filter:checked').forEach(function(cb) {
    selectedYears.push(parseInt(cb.value));
  });
  
  // Ottieni mesi selezionati
  var selectedMonths = [];
  document.querySelectorAll('.month-filter:checked').forEach(function(cb) {
    selectedMonths.push(parseInt(cb.value));
  });
  
  // Ottieni termine ricerca
  var searchTerm = document.getElementById('filter-search').value.toLowerCase();
  
  var filtered = allJobs.filter(function(job) {
    // Filtra per anno se selezionato (se nessun anno selezionato, include tutti)
    if (selectedYears.length > 0) {
      var jobYear = new Date(job.startDate).getFullYear();
      if (selectedYears.indexOf(jobYear) === -1) return false;
    }
    
    // Filtra per mese se selezionato (se nessun mese selezionato, include tutti)
    if (selectedMonths.length > 0) {
      var jobMonth = new Date(job.startDate).getMonth();
      if (selectedMonths.indexOf(jobMonth) === -1) return false;
    }
    
    // Filtra per nome se inserito
    if (searchTerm) {
      if (!job.name.toLowerCase().includes(searchTerm)) return false;
    }
    
    return true;
  });
  
  displayArchivedJobs(filtered);
}

function clearJobFilters() {
  // Deseleziona tutti i checkbox
  document.querySelectorAll('.year-filter, .month-filter').forEach(function(cb) {
    cb.checked = false;
  });
  document.getElementById('filter-search').value = '';
  displayArchivedJobs(allJobs);
}

function displayArchivedJobs(jobs) {
  var archiveList = document.getElementById('jobs-archive');
  if (!archiveList) return;
  
  if (jobs.length === 0) {
    archiveList.innerHTML = '<p style="padding: 2rem; color: #00BCD4; text-align: center;">Nessun lavoro trovato</p>';
    return;
  }
  
  archiveList.innerHTML = '';
  
  jobs.forEach(function(job) {
    var startDate = new Date(job.startDate).toLocaleDateString('it-IT');
    var endDate = new Date(job.endDate).toLocaleDateString('it-IT');
    
    var responsibleName = job.responsibile ? (job.responsibile.name || 'N/A') : 'N/A';
    
    var jobCard = document.createElement('div');
    jobCard.className = 'job-archive-card';
    jobCard.style.cssText = 'padding: 1rem; background: rgba(0,188,212,0.08); border-left: 3px solid #00BCD4; margin-bottom: 0.8rem; border-radius: 5px;';
    
    jobCard.innerHTML = '<h4 style="margin: 0 0 0.5rem 0; color: #f0f0f0; font-family: Poppins, sans-serif;">' + job.name + '</h4>' +
      '<p style="margin: 0.3rem 0; font-size: 0.85rem; color: #aaa;"><strong>Data:</strong> ' + startDate + ' - ' + endDate + '</p>' +
      '<p style="margin: 0.3rem 0; font-size: 0.85rem; color: #aaa;"><strong>Responsabile:</strong> ' + responsibleName + '</p>';
    
    archiveList.appendChild(jobCard);
  });
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
    displayArchivedJobs(allJobs);
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
  
  // Converti selectedMaterials in formato equipment con quantità
  var equipment = selectedMaterials.map(function(item) {
    if (typeof item === 'object') {
      return { equipmentId: item.id, quantity: item.qty };
    }
    return item;
  });
  
  var jobData = {
    name: document.getElementById('job-name').value,
    startDate: document.getElementById('job-start-date').value,
    endDate: document.getElementById('job-end-date').value,
    location: document.getElementById('job-location').value,
    responsibile: document.getElementById('job-responsibile').value,
    personnel: selectedPersonnel,
    equipment: equipment,
    notes: document.getElementById('job-notes').value,
    status: 'confirmed'
  };
  
  console.log('Dati job da inviare:', jobData);
  console.log('URL endpoint:', API_BASE);
  
  try {
    var res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });
    
    if (res.ok) {
      alert('Lavoro creato con successo!');
      clearWizardState();
      document.getElementById('personnel-list').innerHTML = '';
      document.getElementById('materials-list').innerHTML = '';
      loadJobs();
    } else {
      var errorResponse = await res.json();
      console.error('Errore risposta server:', res.status, errorResponse);
      alert('Errore nella creazione del lavoro: ' + (errorResponse.error || res.statusText));
    }
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore nella creazione del lavoro: ' + error.message);
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
  // Raggruppa equipment per categoria
  var categories = {};
  allEquipment.forEach(function(eq) {
    if (!categories[eq.category]) {
      categories[eq.category] = [];
    }
    categories[eq.category].push(eq);
  });
  
  var modal = '<div class="modal-overlay" id="material-modal-overlay">';
  modal += '<div class="modal-content modal-large">';
  modal += '<div class="modal-header">';
  modal += '<h3>Seleziona Equipment</h3>';
  modal += '<span class="modal-close" onclick="closeMaterialModal()">&times;</span>';
  modal += '</div>';
  modal += '<div class="modal-body">';
  
  if (allEquipment.length === 0) {
    modal += '<p style="text-align: center; color: #888;">Nessun equipment disponibile</p>';
  } else {
    modal += '<div class="equipment-categories">';
    
    // Ordina categorie alfabeticamente
    var sortedCategories = Object.keys(categories).sort();
    
    sortedCategories.forEach(function(category) {
      modal += '<div class="equipment-category">';
      modal += '<h4 class="category-title">' + category + '</h4>';
      modal += '<input type="text" class="category-search" placeholder="Cerca in ' + category + '..." onkeyup="filterEquipmentByCategory(this, \'' + category + '\')">';
      modal += '<div class="equipment-list" data-category="' + category + '">';
      
      categories[category].forEach(function(eq) {
        var selectedQty = getSelectedEquipmentQty(eq._id);
        var availableQty = eq.quantity - selectedQty;
        var maxQty = eq.quantity;
        
        modal += '<div class="equipment-item" data-equipment-id="' + eq._id + '" data-equipment-name="' + eq.name.toLowerCase() + '">';
        modal += '<div class="equipment-info">';
        modal += '<span class="equipment-name">' + eq.name + '</span>';
        modal += '<span class="equipment-available">Disponibile: <strong>' + availableQty + '</strong>/' + maxQty + '</span>';
        modal += '</div>';
        modal += '<div class="equipment-qty">';
        
        if (selectedQty > 0) {
          modal += '<button type="button" class="qty-btn" onclick="updateEquipmentQty(\'' + eq._id + '\', -1, ' + maxQty + ')">−</button>';
          modal += '<input type="number" class="qty-input" value="' + selectedQty + '" min="0" max="' + maxQty + '" onchange="updateEquipmentQtyDirect(\'' + eq._id + '\', this.value, ' + maxQty + ')">';
          modal += '<button type="button" class="qty-btn" onclick="updateEquipmentQty(\'' + eq._id + '\', 1, ' + maxQty + ')">+</button>';
        } else {
          modal += '<button type="button" class="qty-btn-add" onclick="updateEquipmentQty(\'' + eq._id + '\', 1, ' + maxQty + ')">Aggiungi</button>';
        }
        
        modal += '</div>';
        modal += '</div>';
      });
      
      modal += '</div>';
      modal += '</div>';
    });
    
    modal += '</div>';
  }
  
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

function getSelectedEquipmentQty(equipmentId) {
  var existing = selectedMaterials.find(function(item) {
    return typeof item === 'object' && item.id === equipmentId;
  });
  return existing ? existing.qty : 0;
}

function updateEquipmentQty(equipmentId, change, maxQty) {
  var currentQty = getSelectedEquipmentQty(equipmentId);
  var newQty = Math.max(0, Math.min(maxQty, currentQty + change));
  
  var idx = selectedMaterials.findIndex(function(item) {
    return typeof item === 'object' && item.id === equipmentId;
  });
  
  if (newQty === 0) {
    if (idx > -1) selectedMaterials.splice(idx, 1);
  } else {
    if (idx > -1) {
      selectedMaterials[idx].qty = newQty;
    } else {
      selectedMaterials.push({ id: equipmentId, qty: newQty });
    }
  }
  
  // Riapri il modal con valori aggiornati
  closeMaterialModal();
  openMaterialModal();
}

function updateEquipmentQtyDirect(equipmentId, value, maxQty) {
  var newQty = Math.max(0, Math.min(maxQty, parseInt(value) || 0));
  
  var idx = selectedMaterials.findIndex(function(item) {
    return typeof item === 'object' && item.id === equipmentId;
  });
  
  if (newQty === 0) {
    if (idx > -1) selectedMaterials.splice(idx, 1);
  } else {
    if (idx > -1) {
      selectedMaterials[idx].qty = newQty;
    } else {
      selectedMaterials.push({ id: equipmentId, qty: newQty });
    }
  }
}

function updateMaterialDisplay() {
  var list = document.getElementById('materials-list');
  list.innerHTML = '';
  
  selectedMaterials.forEach(function(item) {
    if (typeof item === 'object') {
      var eq = allEquipment.find(function(e) { return e._id === item.id; });
      if (eq) {
        var div = document.createElement('div');
        div.className = 'multi-item';
        div.innerHTML = eq.name + ' (Q: ' + item.qty + ')<span class="multi-item-close" onclick="removeMaterialFromSelection(\'' + item.id + '\')">&times;</span>';
        list.appendChild(div);
      }
    }
  });
}

function removeMaterialFromSelection(id) {
  selectedMaterials = selectedMaterials.filter(function(item) {
    if (typeof item === 'object') return item.id !== id;
    return item !== id;
  });
  updateMaterialDisplay();
}

function filterEquipmentByCategory(input, category) {
  var searchValue = input.value.toLowerCase();
  var list = document.querySelector('.equipment-list[data-category="' + category + '"]');
  var items = list.querySelectorAll('.equipment-item');
  
  items.forEach(function(item) {
    var name = item.getAttribute('data-equipment-name');
    if (name.includes(searchValue)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}
