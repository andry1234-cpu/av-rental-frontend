let equipmentData = [];
let dashboardStats = {};
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

function displayDashboardStats() {
  console.log('Visualizzazione statistiche dashboard', dashboardStats);
  
  if (!dashboardStats || Object.keys(dashboardStats).length === 0) {
    console.log('Nessun dato da visualizzare');
    return;
  }

  // Totale articoli (tipi di articoli, non quantità)
  document.getElementById('total-items').textContent = dashboardStats.totalItems || 0;

  // Categorie uniche
  document.getElementById('total-categories').textContent = dashboardStats.totalCategories || 0;

  // In magazzino (quantità disponibile)
  document.getElementById('in-stock').textContent = dashboardStats.inStock || 0;

  // In utilizzo (quantità assegnata a lavori)
  document.getElementById('in-use').textContent = dashboardStats.inUse || 0;

  // Guasti (quantità rotta)
  document.getElementById('broken').textContent = dashboardStats.broken || 0;

  // Lavori attivi
  document.getElementById('active-jobs').textContent = dashboardStats.activeJobs || 0;

  // Categoria con più articoli
  var categoryStats = document.getElementById('category-stats');
  categoryStats.innerHTML = '';

  if (Array.isArray(equipmentData) && equipmentData.length > 0) {
    var categoryArticles = {};
    var i;
    for (i = 0; i < equipmentData.length; i++) {
      var category = equipmentData[i].category;
      categoryArticles[category] = (categoryArticles[category] || 0) + 1;
    }

    var sortedCategories = Object.keys(categoryArticles).sort(function(a, b) {
      return categoryArticles[b] - categoryArticles[a];
    });

    for (i = 0; i < sortedCategories.length; i++) {
      var cat = sortedCategories[i];
      var count = categoryArticles[cat];
      var item = document.createElement('div');
      item.className = 'category-stat-item';
      item.innerHTML = '<span class="category-name">' + cat + '</span><span class="category-count">' + count + '</span>';
      categoryStats.appendChild(item);
    }
  }
}

// Al caricamento pagina
document.addEventListener('DOMContentLoaded', function() {
  loadDashboardStats();
});
