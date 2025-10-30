let equipmentData = [];
let dashboardStats = {};
let todayActiveJobs = [];
let retryTimeout = null;
let pingInterval = null;

async function pingServer() {
  try {
    const res = await fetch('https://av-rental-backend.onrender.com/api/equipment/stats/dashboard');
    if (!res.ok) {
      console.warn('Ping fallito, il server potrebbe essere in spin down');
    } else {
      console.log('Server ping riuscito:', new Date().toLocaleTimeString());
    }
  } catch (error) {
    console.warn('Errore durante il ping del server:', error);
  }
}

function startKeepAlive() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = setInterval(pingServer, 14 * 60 * 1000);
}

async function loadDashboardStats(retryCount) {
  if (retryCount === undefined) retryCount = 0;
  console.log('Caricamento statistiche dashboard, tentativo:', retryCount);
  
  try {
    console.log('Invio richiesta al backend /api/equipment/stats/dashboard...');
    const res = await fetch('https://av-rental-backend.onrender.com/api/equipment/stats/dashboard', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Risposta ricevuta, status:', res.status);
    if (!res.ok) {
      throw new Error('HTTP error! status: ' + res.status);
    }
    
    const data = await res.json();
    console.log('Dati statistiche ricevuti:', data);
    dashboardStats = data;
    equipmentData = data.equipment;
    displayDashboardStats();
    loadTodayActiveJobs();
    startKeepAlive();
    
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
  } catch (error) {
    console.error('Errore nel caricamento dei dati:', error);
    if (retryCount < 3) {
      retryTimeout = setTimeout(function() { loadDashboardStats(retryCount + 1); }, 10000);
    }
  }
}

async function loadTodayActiveJobs(retryCount) {
  if (retryCount === undefined) retryCount = 0;
  
  try {
    console.log('Caricamento lavori attivi oggi...');
    const res = await fetch('https://av-rental-backend.onrender.com/api/jobs/stats/today', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!res.ok) {
      throw new Error('HTTP error! status: ' + res.status);
    }
    
    const data = await res.json();
    console.log('Lavori attivi oggi:', data);
    todayActiveJobs = data.jobs || [];
    displayTodayActiveJobs();
    updateActiveJobsCount(); // Aggiorna il conteggio nel card

    
  } catch (error) {
    console.error('Errore nel caricamento lavori attivi:', error);
    if (retryCount < 3) {
      setTimeout(function() { loadTodayActiveJobs(retryCount + 1); }, 5000);
    }
  }
}

function displayDashboardStats() {
  console.log('Visualizzazione statistiche dashboard', dashboardStats);
  
  if (!dashboardStats || Object.keys(dashboardStats).length === 0) {
    console.log('Nessun dato da visualizzare');
    return;
  }

  // Helper per impostare il valore di un elemento se esiste
  var setStat = (id, value) => {
    var el = document.getElementById(id);
    if (el) el.textContent = value || 0;
  };

  // Totale quantità in magazzino (quantity - brokenQuantity)
  setStat('total-items', dashboardStats.totalItems || 0);

  // In magazzino (quantità disponibile NON assegnate a lavori attivi)
  setStat('in-stock', dashboardStats.inStock || 0);

  // In utilizzo (quantità assegnata a lavori attivi)
  setStat('in-use', dashboardStats.inUse || 0);

  // Guasti (quantità rotta)
  setStat('broken', dashboardStats.broken || 0);

  // Lavori attivi
  setStat('active-jobs', dashboardStats.activeJobs || 0);
}

function displayTodayActiveJobs() {
  console.log('Visualizzazione lavori attivi oggi', todayActiveJobs);
  
  var categoryStats = document.getElementById('category-stats');
  categoryStats.innerHTML = '';
  
  if (!Array.isArray(todayActiveJobs) || todayActiveJobs.length === 0) {
    categoryStats.innerHTML = '<div style="text-align: center; padding: 1rem; color: #888;">Nessun lavoro attivo oggi</div>';
    return;
  }
  
  // Filtra i lavori per verificare che oggi sia effettivamente compreso tra startDate e endDate
  var today = new Date();
  today.setHours(0, 0, 0, 0); // Midnight
  
  var activeJobsFiltered = todayActiveJobs.filter(function(job) {
    var startDate = new Date(job.startDate);
    var endDate = new Date(job.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Verifica che oggi sia compreso nel range
    return today >= startDate && today <= endDate;
  });
  
  if (activeJobsFiltered.length === 0) {
    categoryStats.innerHTML = '<div style="text-align: center; padding: 1rem; color: #888;">Nessun lavoro attivo oggi</div>';
    return;
  }
  
  // Aggiungi ogni lavoro come riga
  var i;
  for (i = 0; i < activeJobsFiltered.length; i++) {
    var job = activeJobsFiltered[i];
    var item = document.createElement('div');
    item.className = 'active-job-item';
    
    // Formatta date
    var startDate = new Date(job.startDate);
    var endDate = new Date(job.endDate);
    var dateRange = formatDate(startDate) + ' - ' + formatDate(endDate);
    
    var responsibileName = job.responsibile ? job.responsibile.name : 'N/D';
    
    item.innerHTML = '<div class="job-name">' + job.name + '</div><div class="job-info"><span class="job-date">' + dateRange + '</span> | <span class="job-resp">' + responsibileName + '</span></div>';
    categoryStats.appendChild(item);
  }
}

// Funzione per contare e aggiornare il numero di lavori attivi veramente oggi
function updateActiveJobsCount() {
  if (!Array.isArray(todayActiveJobs) || todayActiveJobs.length === 0) {
    setStat('active-jobs', 0);
    return;
  }
  
  // Filtra i lavori per verificare che oggi sia effettivamente compreso tra startDate e endDate
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  
  var activeJobsFiltered = todayActiveJobs.filter(function(job) {
    var startDate = new Date(job.startDate);
    var endDate = new Date(job.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return today >= startDate && today <= endDate;
  });
  
  setStat('active-jobs', activeJobsFiltered.length);
}

function formatDate(date) {
  var day = String(date.getDate()).padStart(2, '0');
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var year = date.getFullYear();
  return day + '/' + month + '/' + year;
}

// Al caricamento pagina
document.addEventListener('DOMContentLoaded', function() {
  loadDashboardStats();
});
