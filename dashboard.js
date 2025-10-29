let equipmentData = [];
let retryTimeout = null;
let pingInterval = null;

async function pingServer() {
  try {
    const res = await fetch('https://av-rental-backend.onrender.com/api/equipment');
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

async function loadEquipment(retryCount) {
  if (retryCount === undefined) retryCount = 0;
  console.log('Caricamento equipment per dashboard, tentativo:', retryCount);
  
  try {
    console.log('Invio richiesta al backend...');
    const res = await fetch('https://av-rental-backend.onrender.com/api/equipment', {
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
    console.log('Dati ricevuti:', data);
    equipmentData = data;
    displayDashboardStats();
    startKeepAlive();
    
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
  } catch (error) {
    console.error('Errore nel caricamento dei dati:', error);
    if (retryCount < 3) {
      retryTimeout = setTimeout(function() { loadEquipment(retryCount + 1); }, 10000);
    }
  }
}

function displayDashboardStats() {
  console.log('Visualizzazione statistiche dashboard');
  
  if (!Array.isArray(equipmentData) || equipmentData.length === 0) {
    console.log('Nessun dato da visualizzare');
    return;
  }

  // Totale articoli
  var totalItems = 0;
  var i;
  for (i = 0; i < equipmentData.length; i++) {
    totalItems += equipmentData[i].quantity || 0;
  }
  document.getElementById('total-items').textContent = totalItems;

  // Categorie uniche
  var categories = {};
  for (i = 0; i < equipmentData.length; i++) {
    var cat = equipmentData[i].category;
    categories[cat] = (categories[cat] || 0) + 1;
  }
  var categoryCount = Object.keys(categories).length;
  document.getElementById('total-categories').textContent = categoryCount;

  // In magazzino
  var inStock = equipmentData.length;
  document.getElementById('in-stock').textContent = inStock;

  // Lavori attivi (placeholder - da integrare con backend)
  document.getElementById('active-jobs').textContent = '0';

  // Categoria con più articoli
  var categoryStats = document.getElementById('category-stats');
  categoryStats.innerHTML = '';

  var categoryArticles = {};
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

// Al caricamento pagina
document.addEventListener('DOMContentLoaded', function() {
  loadEquipment();
});
