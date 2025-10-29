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
  const grid = document.getElementById('equipment-grid');
  console.log('Iniziato caricamento equipment, tentativo:', retryCount);
  
  try {
    if (retryCount === 0) {
      grid.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Caricamento in corso...</p></div>';
    } else {
      grid.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Tentativo ' + (retryCount + 1) + ' di riconnessione</p></div>';
    }
    
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
    displayEquipment('all');
    startKeepAlive();
    
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
  } catch (error) {
    console.error('Errore nel caricamento dei dati:', error);
    if (retryCount < 3) {
      grid.innerHTML = '<div class="warning">Server in riavvio, nuovo tentativo tra 10 secondi... (tentativo ' + (retryCount + 1) + ' di 3)</div>';
      retryTimeout = setTimeout(function() { loadEquipment(retryCount + 1); }, 10000);
    } else {
      grid.innerHTML = '<div class="error">Errore nel caricamento dei dati. Ricarica la pagina per riprovare.</div>';
    }
  }
}


function showSpecsModal(item) {
  console.log('Mostrando specifiche per:', item);
  const modal = document.getElementById('specs-modal');
  const title = document.getElementById('modal-title');
  const content = document.getElementById('specs-content');

  title.textContent = item.name;
  content.innerHTML = '';

  var addSpec = function(label, value, unit) {
    if (unit === undefined) unit = '';
    if (value !== undefined && value !== null && value !== '') {
      const specItem = document.createElement('div');
      specItem.className = 'spec-item';
      specItem.innerHTML = '<div class="spec-label">' + label + '</div><div class="spec-value">' + value + unit + '</div>';
      content.appendChild(specItem);
    }
  };

  addSpec('Categoria', item.category, '');
  addSpec('Disponibilità', item.quantity, ' pezzi');

  if (item.weight && item.weight.value) {
    addSpec('Peso', item.weight.value, ' ' + (item.weight.unit || 'kg'));
  }

  if (item.dimensions && item.dimensions.length && item.dimensions.width && item.dimensions.height) {
    addSpec('Dimensioni', item.dimensions.length + ' × ' + item.dimensions.width + ' × ' + item.dimensions.height, ' ' + (item.dimensions.unit || 'cm'));
  }

  if (item.powerConsumption && item.powerConsumption.value) {
    addSpec('Consumo', item.powerConsumption.value, ' ' + (item.powerConsumption.unit || 'W'));
  }

  if (item.voltage && item.voltage.value) {
    addSpec('Voltaggio', item.voltage.value, ' ' + (item.voltage.unit || 'V'));
  }

  modal.classList.add('active');
}


function displayEquipment(categoryFilter) {
  console.log('Visualizzazione equipment, filtro:', categoryFilter);
  console.log('Dati disponibili:', equipmentData);
  
  const grid = document.getElementById('equipment-grid');
  grid.innerHTML = '';

  if (!Array.isArray(equipmentData) || equipmentData.length === 0) {
    console.log('Nessun dato da visualizzare');
    grid.innerHTML = '<div class="error">Nessun articolo trovato.</div>';
    return;
  }

  var i;
  for (i = 0; i < equipmentData.length; i++) {
    var item = equipmentData[i];
    if (categoryFilter === 'all' || item.category === categoryFilter) {
      const card = document.createElement('div');
      card.className = 'card';
      card.setAttribute('data-category', item.category);

      card.addEventListener('click', (function(currentItem) {
        return function() { showSpecsModal(currentItem); };
      })(item));

      const imageContainer = document.createElement('div');
      imageContainer.className = 'image-container';
      
      const img = document.createElement('img');
      img.src = item.imageUrl || 'fallback.jpg';
      img.alt = item.name;
      
      imageContainer.appendChild(img);

      const info = document.createElement('div');
      info.className = 'info';

      const title = document.createElement('h3');
      title.textContent = item.name;

      const category = document.createElement('p');
      category.textContent = item.category;

      const quantity = document.createElement('p');
      quantity.textContent = 'Disponibili: ' + item.quantity;

      const specsButton = document.createElement('button');
      specsButton.className = 'specs-button';
      specsButton.textContent = 'Vedi specifiche tecniche';
      specsButton.onclick = (function(currentItem) {
        return function(e) {
          e.stopPropagation();
          showSpecsModal(currentItem);
        };
      })(item);

      info.appendChild(title);
      info.appendChild(category);
      info.appendChild(quantity);
      info.appendChild(specsButton);
      card.appendChild(imageContainer);
      card.appendChild(info);
      grid.appendChild(card);
    }
  }
}


function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      filterButtons.forEach(function(btn) { btn.classList.remove('active'); });
      button.classList.add('active');
      const category = button.getAttribute('data-category');
      displayEquipment(category);
    });
  });
}

function closeModal() {
  const modal = document.getElementById('specs-modal');
  modal.classList.remove('active');
}

function setupModalEvents() {
  document.querySelector('.modal-close').addEventListener('click', closeModal);
  
  document.getElementById('specs-modal').addEventListener('click', function(e) {
    if (e.target.id === 'specs-modal') {
      closeModal();
    }
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('specs-modal').classList.contains('active')) {
      closeModal();
    }
  });
}

loadEquipment();
setupFilters();
setupModalEvents();
