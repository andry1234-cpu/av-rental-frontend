// Variabili globali
let allResponsibili = [];
let allPersonnel = [];
let allMaterials = [];
let allEquipment = [];
let allJobs = [];
let selectedPersonnel = [];
let selectedMaterials = [];
let selectedEquipment = [];
let isEditingJob = false; // Traccia se siamo in modalità edit
let currentEditJobId = null; // ID del lavoro in corso di modifica

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
  
  // Solo se siamo in modalità edit, ripristina lo stato del wizard
  // Se siamo in modalità "new", non carichedare lo stato salvato
  var activeTab = localStorage.getItem('lavoriActiveTab');
  var wizardEditMode = localStorage.getItem('wizardEditMode');
  if (activeTab === 'new-job' && wizardEditMode === 'true') {
    loadWizardState();
  }
});

// ===== EDIT JOB (apre il wizard con i dati del lavoro) - GLOBAL =====
async function editJob(jobId) {
  console.log('editJob called for', jobId);
  
  // Imposta la modalità edit
  isEditingJob = true;
  currentEditJobId = jobId;
  localStorage.setItem('wizardEditMode', 'true');

  // Try to find the job in-memory; if not found, fetch from API
  var job = allJobs.find(j => (j._id === jobId || j.id === jobId));
  if (!job) {
    try {
      var res = await fetch(API_BASE + '/' + jobId);
      if (res.ok) {
        job = await res.json();
      }
    } catch (e) {
      console.warn('Impossibile recuperare il lavoro dal server:', e);
    }
  }

  if (!job) {
    alert('Lavoro non trovato');
    return;
  }

  // Assicuriamoci di avere responsabili/personale/equipment caricati
  try {
    await loadResponsibili();
    await loadPersonnel();
    await loadEquipment();
  } catch (e) {
    console.warn('Errore nel ricaricare dati necessari per modifica:', e);
  }

  // Switch alla tab Nuovo Lavoro
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  var newBtn = document.querySelector('[data-tab="new-job"]');
  if (newBtn) newBtn.classList.add('active');
  var newContent = document.getElementById('new-job');
  if (newContent) newContent.classList.add('active');
  localStorage.setItem('lavoriActiveTab', 'new-job');

  // Helper to convert ISO date (2025-10-31T18:23:00.000Z) to datetime-local format (2025-10-31T18:23)
  var convertToDatetimeLocal = (isoDate) => {
    if (!isoDate) return '';
    try {
      // Remove Z and milliseconds if present, keep only yyyy-MM-ddThh:mm:ss
      var dateStr = isoDate.split('.')[0]; // Remove milliseconds
      return dateStr; // Should be in format 2025-10-31T18:23:00
    } catch (e) {
      return isoDate;
    }
  };

  // Popola i campi del wizard
  var setIfExists = (id, value) => {
    var el = document.getElementById(id);
    if (el) el.value = value || '';
  };
  setIfExists('job-name', job.name || '');
  setIfExists('job-start-date', convertToDatetimeLocal(job.startDate || ''));
  setIfExists('job-end-date', convertToDatetimeLocal(job.endDate || ''));
  setIfExists('job-location', job.location || '');

  // Responsabile (può essere object, id o nome)
  var respSelect = document.getElementById('job-responsibile');
  if (respSelect) {
    var respVal = '';
    if (job.responsibile) {
      if (typeof job.responsibile === 'string') {
        respVal = job.responsibile;
      } else if (typeof job.responsibile === 'object') {
        respVal = job.responsibile._id || job.responsibile.id || job.responsibile;
      }

      // If respVal is still empty, try matching by name
      if (!respVal && typeof job.responsibile === 'string') {
        var match = allResponsibili.find(r => r.name === job.responsibile || (r.name + ' ' + (r.surname || '')).trim() === job.responsibile);
        if (match) respVal = match._id;
      }

      // If still not found but job.responsibile has name field, try that
      if (!respVal && job.responsibile.name) {
        var match2 = allResponsibili.find(r => r.name === job.responsibile.name);
        if (match2) respVal = match2._id;
      }

      // Set value if option exists, otherwise add an option
      if (respVal) {
        var opt = respSelect.querySelector('option[value="' + respVal + '"]');
        if (!opt) {
          var newOpt = document.createElement('option');
          newOpt.value = respVal;
          newOpt.textContent = (job.responsibile.name || job.responsibile) || respVal;
          respSelect.appendChild(newOpt);
        }
        respSelect.value = respVal;
      }
    }
  }

  // Personale
  selectedPersonnel = [];
  if (job.personnel && Array.isArray(job.personnel)) {
    job.personnel.forEach(p => {
      if (typeof p === 'string') selectedPersonnel.push(p);
      else if (p && typeof p === 'object') selectedPersonnel.push(p._id || p.id);
    });
  }
  displaySelectedPersonnel();

  // Equipment/Materiali - restore from job
  selectedEquipment = [];
  if (job.equipment && Array.isArray(job.equipment)) {
    job.equipment.forEach(eq => {
      if (typeof eq === 'string') {
        // È un ID
        selectedEquipment.push({ equipmentId: eq, quantity: 1 });
      } else if (eq && typeof eq === 'object') {
        // È un oggetto con equipmentId e quantity
        if (eq.equipmentId) {
          var id = (typeof eq.equipmentId === 'string') ? eq.equipmentId : (eq.equipmentId._id || eq.equipmentId.id);
          selectedEquipment.push({ equipmentId: id, quantity: eq.quantity || 1 });
        } else if (eq._id) {
          // Fallback: usa _id direttamente
          selectedEquipment.push({ equipmentId: eq._id, quantity: eq.quantity || 1 });
        }
      }
    });
  }
  
  // Aggiorna la UI della lista materials (Step 3)
  var matsListEl = document.getElementById('materials-list');
  if (matsListEl) {
    matsListEl.innerHTML = '';
    if (selectedEquipment.length > 0) {
      selectedEquipment.forEach((sel, idx) => {
        var eq = allEquipment.find(e => e._id === sel.equipmentId);
        if (eq) {
          var item = document.createElement('div');
          item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f5f5f5; border-radius: 4px; margin-bottom: 0.5rem;';
          item.innerHTML = '<span>' + eq.name + ' (x' + sel.quantity + ')</span>' +
            '<button type="button" class="btn-small" onclick="removeEquipment(' + idx + ')">Rimuovi</button>';
          matsListEl.appendChild(item);
        }
      });
    }
  }

  // Set wizard to step 1 (Details)
  currentStep = 1;
  saveWizardState();
  updateWizardUI();

  // Chiudi modal dettagli
  closeJobDetailsModal();
}

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
      
      // Se clicchiamo su "new-job" e NON siamo in modalità edit, reset il form
      if (tabName === 'new-job' && !isEditingJob) {
        clearWizardState();
        isEditingJob = false;
        currentEditJobId = null;
        localStorage.setItem('wizardEditMode', 'false');
      }
      
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
  localStorage.removeItem('wizardEditMode');
  selectedPersonnel = [];
  selectedMaterials = [];
  selectedEquipment = [];
  document.getElementById('new-job-form').reset();
  isEditingJob = false;
  currentEditJobId = null;
  currentStep = 1;
  updateWizardUI();
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

  // Ripristina i valori del form dal wizardState (utile quando si naviga tra i step)
  var saved = localStorage.getItem('wizardState');
  if (saved) {
    try {
      var data = JSON.parse(saved);
      if (data.formData) {
        document.getElementById('job-name').value = data.formData.jobName || '';
        document.getElementById('job-start-date').value = data.formData.jobStartDate || '';
        document.getElementById('job-end-date').value = data.formData.jobEndDate || '';
        document.getElementById('job-location').value = data.formData.jobLocation || '';
        document.getElementById('job-responsibile').value = data.formData.jobResponsible || '';
      }
    } catch (e) {
      // silent fail
    }
  }
  
  // Aggiorna pulsanti di navigazione
  var btnPrev = document.getElementById('btn-prev');
  var btnNext = document.getElementById('btn-next');
  var btnSubmit = document.getElementById('btn-submit');
  
  if (currentStep === 1) {
    btnPrev.disabled = true;
    btnNext.style.display = 'block';
    btnSubmit.style.display = 'none';
  } else if (currentStep === 2) {
    btnPrev.disabled = false;
    btnNext.style.display = 'block';
    btnSubmit.style.display = 'none';
  } else if (currentStep === 3) {
    btnPrev.disabled = false;
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
  
  if (!searchInput || !dropdown) {
    console.error('Elementi personale-search non trovati');
    return;
  }
  
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
  saveWizardState();
}

function displaySelectedPersonnel() {
  var container = document.getElementById('personnel-list');
  
  if (selectedPersonnel.length === 0) {
    // Nascondi il container quando non ci sono persone
    container.classList.add('hidden');
    container.innerHTML = '';
  } else {
    // Mostra il container quando ci sono persone
    container.classList.remove('hidden');
    container.innerHTML = selectedPersonnel.map(personId => {
      var person = allPersonnel.find(p => p._id === personId);
      return '<div class="multi-item">' + (person ? person.name : 'Sconosciuto') + 
             ' <button type="button" class="remove-btn" onclick="removePersonnelFromJob(\'' + personId + '\')">×</button></div>';
    }).join('');
  }
}

function removePersonnelFromJob(id) {
  selectedPersonnel = selectedPersonnel.filter(p => p !== id);
  displaySelectedPersonnel();
  saveWizardState();
}

// ===== FORM LISTENERS =====
function setupFormListeners() {
  var newJobForm = document.getElementById('new-job-form');
  var responsibleForm = document.getElementById('responsibile-form');
  var personnelForm = document.getElementById('personnel-form');
  
  if (newJobForm) newJobForm.addEventListener('submit', createJob);
  if (responsibleForm) responsibleForm.addEventListener('submit', createResponsibile);
  if (personnelForm) personnelForm.addEventListener('submit', createPersonnel);
  
  setupPersonnelSearch();
  
  // Setup date validation (end date cannot be before start date)
  var startDateInput = document.getElementById('job-start-date');
  var endDateInput = document.getElementById('job-end-date');
  
  if (startDateInput && endDateInput) {
    startDateInput.addEventListener('change', function() {
      // Quando cambia la data di inizio, imposta il minimo della data di fine
      if (startDateInput.value) {
        endDateInput.min = startDateInput.value;
        // Se la data di fine è antecedente, resettiamo il campo
        if (endDateInput.value && endDateInput.value < startDateInput.value) {
          endDateInput.value = startDateInput.value;
        }
      }
    });
    
    endDateInput.addEventListener('change', function() {
      // Se l'utente prova a inserire una data di fine antecedente, blocchiamo
      if (endDateInput.value && startDateInput.value && endDateInput.value < startDateInput.value) {
        endDateInput.value = startDateInput.value;
        alert('La data di fine non può essere antecedente alla data di inizio');
      }
    });
  }
  
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
    jobCard.style.cssText = 'padding: 1rem; background: rgba(0,188,212,0.08); border-left: 3px solid #00BCD4; margin-bottom: 0.8rem; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;';
    
    var jobInfo = document.createElement('div');
    jobInfo.innerHTML = '<h4 style="margin: 0 0 0.5rem 0; color: #f0f0f0; font-family: Poppins, sans-serif;">' + job.name + '</h4>' +
      '<p style="margin: 0.3rem 0; font-size: 0.85rem; color: #aaa;"><strong>Data:</strong> ' + startDate + ' - ' + endDate + '</p>' +
      '<p style="margin: 0.3rem 0; font-size: 0.85rem; color: #aaa;"><strong>Responsabile:</strong> ' + responsibleName + '</p>';
    
    var viewBtn = document.createElement('button');
    viewBtn.className = 'btn-primary';
    viewBtn.textContent = 'Visualizza';
    viewBtn.style.cssText = 'padding: 0.6rem 1.2rem; white-space: nowrap; margin-left: 1rem;';
    viewBtn.onclick = function() { showJobDetails(job._id); };
    
    jobCard.appendChild(jobInfo);
    jobCard.appendChild(viewBtn);
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
  
  // Se siamo in modalità edit, faccio un UPDATE invece di CREATE
  if (isEditingJob && currentEditJobId) {
    return updateJob(e);
  }
  
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

async function updateJob(e) {
  e.preventDefault();
  
  if (!currentEditJobId) {
    alert('Errore: ID lavoro mancante');
    return;
  }
  
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
  
  console.log('Dati job da aggiornare:', jobData);
  console.log('URL endpoint PUT:', API_BASE + '/' + currentEditJobId);
  
  try {
    var res = await fetch(API_BASE + '/' + currentEditJobId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });
    
    if (res.ok) {
      alert('Lavoro aggiornato con successo!');
      isEditingJob = false;
      currentEditJobId = null;
      clearWizardState();
      document.getElementById('personnel-list').innerHTML = '';
      document.getElementById('materials-list').innerHTML = '';
      loadJobs();
    } else {
      var errorResponse = await res.json();
      console.error('Errore risposta server:', res.status, errorResponse);
      alert('Errore nell\'aggiornamento del lavoro: ' + (errorResponse.error || res.statusText));
    }
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore nell\'aggiornamento del lavoro: ' + error.message);
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

async function createResponsibileFromModal(nome, cognome, email, phone) {
  var respData = {
    name: nome + ' ' + cognome,
    email: email,
    phone: phone
  };
  
  try {
    var res = await fetch(API_BASE + '/responsibili/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(respData)
    });
    
    if (res.ok) {
      alert('Responsabile aggiunto!');
      closeResponsibileModal();
      loadResponsibili();
    } else {
      alert('Responsabile già esiste');
    }
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore nell\'aggiunta del responsabile');
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
  if (!container) return; // Se non esiste, non fare nulla
  
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
  if (!container) return; // Se non esiste, non fare nulla
  
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
  document.getElementById('responsibile-modal-form').reset();
  document.getElementById('responsibile-modal').classList.remove('hidden');
}

function closeResponsibileModal() {
  document.getElementById('responsibile-modal').classList.add('hidden');
}

function submitResponsibileModal() {
  var nome = document.getElementById('responsibile-modal-nome').value.trim();
  var cognome = document.getElementById('responsibile-modal-cognome').value.trim();
  var email = document.getElementById('responsibile-modal-email').value.trim();
  var phone = document.getElementById('responsibile-modal-phone').value.trim();
  
  if (!nome || !cognome || !email || !phone) {
    alert('Compila tutti i campi');
    return;
  }
  
  createResponsibileFromModal(nome, cognome, email, phone);
}

// ===== JOB DETAILS MODAL =====
var currentJobId = null;

function showJobDetails(jobId) {
  console.log('=== showJobDetails called with jobId =', jobId);
  currentJobId = jobId;
  var job = allJobs.find(j => j._id === jobId);
  console.log('=== found job =', job);
  if (!job) {
    alert('Lavoro non trovato');
    return;
  }
  
  var startDate = new Date(job.startDate).toLocaleDateString('it-IT');
  var endDate = new Date(job.endDate).toLocaleDateString('it-IT');
  var responsibleName = job.responsibile ? (job.responsibile.name || 'N/A') : 'N/A';
  
  // Nomi personale (gestisce sia array di id che array di oggetti)
  var personnelNames = 'Nessuno';
  if (job.personnel && Array.isArray(job.personnel) && job.personnel.length > 0) {
    personnelNames = job.personnel.map(p => {
      if (typeof p === 'string') {
        var person = allPersonnel.find(x => x._id === p);
        return person ? person.name : 'N/A';
      } else if (p && typeof p === 'object') {
        return p.name || p.fullName || 'N/A';
      }
      return 'N/A';
    }).join(', ');
  }

  // Materiali/Equipment (gestisce differenti shape)
  console.log('=== Before equipment check: job.equipment =', job.equipment);
  var equipmentNames = 'Nessuno';
  if (job.equipment && Array.isArray(job.equipment) && job.equipment.length > 0) {
    console.log('DEBUG showJobDetails: ENTERING equipment mapping, job.equipment =', job.equipment);
    equipmentNames = job.equipment.map(eq => {
      console.log('DEBUG: processing eq =', eq, ', typeof =', typeof eq);
      
      var item = null;
      var qty = 1;
      
      // eq può essere:
      // 1. Un oggetto completo con _id e name (come viene salvato dal backend)
      // 2. { equipmentId: {...}, quantity }  ← equipmentId è un oggetto completo
      // 3. { equipmentId: "ID_string", quantity }
      // 4. { _id, quantity }
      // 5. Solo un ID string
      
      if (typeof eq === 'string') {
        // È solo un ID
        qty = 1;
        item = allEquipment.find(e => e._id === eq);
        console.log('DEBUG: eq is string, found item =', item);
      } else if (typeof eq === 'object' && eq) {
        // È un oggetto
        console.log('DEBUG: eq is object, has name?', eq.name, ', has equipmentId?', typeof eq.equipmentId);
        
        if (eq.name && eq._id) {
          // È l'oggetto completo dell'equipment
          console.log('DEBUG: eq is complete equipment object');
          item = eq;
          qty = eq.quantity || 1;
        } else if (eq.equipmentId) {
          // È un reference con equipmentId (che può essere stringa o oggetto)
          qty = eq.quantity || eq.qty || 1;
          console.log('DEBUG: eq.equipmentId type =', typeof eq.equipmentId);
          
          if (typeof eq.equipmentId === 'object' && eq.equipmentId.name) {
            // equipmentId è già l'oggetto completo
            console.log('DEBUG: equipmentId è oggetto completo con name');
            item = eq.equipmentId;
          } else if (typeof eq.equipmentId === 'string') {
            // equipmentId è una stringa ID, cercalo in allEquipment
            console.log('DEBUG: equipmentId è string, searching in allEquipment');
            item = allEquipment.find(e => e._id === eq.equipmentId);
          } else {
            console.log('DEBUG: equipmentId è tipo', typeof eq.equipmentId, '=', eq.equipmentId);
          }
        } else {
          // Fallback: prova con _id direttamente
          var id = eq._id || eq.id;
          qty = eq.quantity || eq.qty || 1;
          console.log('DEBUG: trying _id or id =', id);
          item = allEquipment.find(e => e._id === id);
        }
      }
      
      var result = item ? (item.name + ' (x' + qty + ')') : 'N/A';
      console.log('DEBUG: returning result =', result);
      return result;
    }).join(', ');
  }
  
  var content = '<div style="display: flex; flex-direction: column; gap: 1rem;">' +
    '<div><strong>Nome:</strong> ' + job.name + '</div>' +
    '<div><strong>Data Inizio:</strong> ' + startDate + '</div>' +
    '<div><strong>Data Fine:</strong> ' + endDate + '</div>' +
    '<div><strong>Luogo:</strong> ' + job.location + '</div>' +
    '<div><strong>Responsabile:</strong> ' + responsibleName + '</div>' +
    '<div><strong>Personale:</strong> ' + personnelNames + '</div>' +
    '<div><strong>Materiali:</strong> ' + equipmentNames + '</div>' +
    '<div><strong>Note:</strong> ' + (job.notes || 'Nessuna') + '</div>' +
    '</div>';
  
  document.getElementById('job-details-title').textContent = job.name;
  document.getElementById('job-details-content').innerHTML = content;
  document.getElementById('job-details-modal').classList.remove('hidden');
}

function closeJobDetailsModal() {
  document.getElementById('job-details-modal').classList.add('hidden');
  currentJobId = null;
}

function deleteJobFromModal() {
  if (!currentJobId) return;
  
  if (!confirm('Sei sicuro di voler eliminare questo lavoro?')) {
    return;
  }
  
  deleteJob(currentJobId);
}

async function deleteJob(jobId) {
  try {
    var res = await fetch(API_BASE + '/' + jobId, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      alert('Lavoro eliminato con successo!');
      closeJobDetailsModal();
      loadJobs();
    } else {
      alert('Errore nell\'eliminazione del lavoro');
    }
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore nell\'eliminazione del lavoro: ' + error.message);
  }
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
