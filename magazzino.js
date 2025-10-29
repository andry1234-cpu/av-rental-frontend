let equipmentData = [];
let retryTimeout = null;
let pingInterval = null;

// Helper: colore per categoria
function getCategoryColor(category) {
  var colors = {
    'Audio': '#FF5252',
    'Video': '#FF9800',
    'Luci': '#FFEB3B',
    'Strutture': '#8BC34A',
    'Cablaggi': '#9C27B0',
    'IT e Reti': '#00BCD4'
  };
  return colors[category] || '#666';
}

// Helper: scurisci colore
function shadeColor(color, percent) {
  var R = parseInt(color.substring(1,3),16);
  var G = parseInt(color.substring(3,5),16);
  var B = parseInt(color.substring(5,7),16);
  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);
  R = (R<255)?R:255;
  G = (G<255)?G:255;
  B = (B<255)?B:255;
  var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
  var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
  var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));
  return "#"+RR+GG+BB;
}

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


function displayEquipment(categoryFilter, searchTerm) {
  console.log('Visualizzazione equipment, filtro:', categoryFilter, 'ricerca:', searchTerm);
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
    var categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    var searchMatch = !searchTerm || item.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
    
    if (categoryMatch && searchMatch) {
      const card = document.createElement('div');
      card.className = 'card';
      card.setAttribute('data-category', item.category);

      card.addEventListener('click', (function(currentItem) {
        return function() { showSpecsModal(currentItem); };
      })(item));

      const imageContainer = document.createElement('div');
      imageContainer.className = 'image-container';
      imageContainer.setAttribute('data-category', item.category);

      const img = document.createElement('img');
      img.alt = item.name;
      img.onerror = function() {
        // Se l'immagine fallisce, nascondi l'img e mostra il placeholder
        img.style.display = 'none';
        imageContainer.style.background = 'linear-gradient(135deg, ' + getCategoryColor(item.category) + ' 0%, ' + shadeColor(getCategoryColor(item.category), -20) + ' 100%)';
        var placeholder = document.createElement('div');
        placeholder.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 3rem; opacity: 0.3; text-align: center; padding: 1rem;';
        placeholder.textContent = item.category.substring(0, 2).toUpperCase();
        imageContainer.appendChild(placeholder);
      };
      img.src = item.imageUrl;
      imageContainer.appendChild(img);      const info = document.createElement('div');
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
      var searchTerm = document.getElementById('search-input') ? document.getElementById('search-input').value : '';
      updateCurrentLayout(category, searchTerm);
    });
  });
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      var searchTerm = this.value;
      var activeCategory = 'all';
      var activeButton = document.querySelector('.filter-btn.active');
      if (activeButton) {
        activeCategory = activeButton.getAttribute('data-category');
      }
      updateCurrentLayout(activeCategory, searchTerm);
    });
  }
}

function updateCurrentLayout(category, searchTerm) {
  var grid = document.getElementById('equipment-grid');
  var table = document.getElementById('equipment-table');
  
  if (grid.style.display !== 'none') {
    displayEquipment(category, searchTerm);
  } else if (table.style.display !== 'none') {
    displayEquipmentTable(category, searchTerm);
  }
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

function displayEquipmentTable(categoryFilter, searchTerm) {
  console.log('Visualizzazione tabella, filtro:', categoryFilter, 'ricerca:', searchTerm);
  
  const tableContainer = document.getElementById('equipment-table');
  tableContainer.innerHTML = '';

  if (!Array.isArray(equipmentData) || equipmentData.length === 0) {
    tableContainer.innerHTML = '<div class="error">Nessun articolo trovato.</div>';
    return;
  }

  var table = document.createElement('table');
  table.className = 'equipment-table';

  var thead = document.createElement('thead');
  var headerRow = document.createElement('tr');
  
  var headers = ['Immagine', 'Nome', 'Categoria', 'Quantità'];
  var i;
  for (i = 0; i < headers.length; i++) {
    var th = document.createElement('th');
    th.textContent = headers[i];
    headerRow.appendChild(th);
  }
  
  thead.appendChild(headerRow);
  table.appendChild(thead);

  var tbody = document.createElement('tbody');

  for (i = 0; i < equipmentData.length; i++) {
    var item = equipmentData[i];
    var categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    var searchMatch = !searchTerm || item.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
    
    if (categoryMatch && searchMatch) {
      var row = document.createElement('tr');
      row.addEventListener('click', (function(currentItem) {
        return function() { showSpecsModal(currentItem); };
      })(item));

      var imgCell = document.createElement('td');
      var img = document.createElement('img');
      img.alt = item.name;
      img.onerror = function() {
        // Se l'immagine fallisce, mostra placeholder colorato
        img.style.display = 'none';
        imgCell.style.background = getCategoryColor(item.category);
        var placeholder = document.createElement('div');
        placeholder.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.5rem; opacity: 0.4;';
        placeholder.textContent = item.category.substring(0, 2).toUpperCase();
        imgCell.appendChild(placeholder);
      };
      img.src = item.imageUrl;
      imgCell.appendChild(img);
      row.appendChild(imgCell);

      var nameCell = document.createElement('td');
      nameCell.textContent = item.name;
      row.appendChild(nameCell);

      var categoryCell = document.createElement('td');
      categoryCell.className = 'category ' + item.category;
      categoryCell.textContent = item.category;
      row.appendChild(categoryCell);

      var quantityCell = document.createElement('td');
      quantityCell.className = 'quantity';
      quantityCell.textContent = item.quantity;
      row.appendChild(quantityCell);

      tbody.appendChild(row);
    }
  }

  table.appendChild(tbody);
  tableContainer.appendChild(table);
}

function setupLayoutToggle() {
  var cardsBtn = document.getElementById('layout-cards');
  var tableBtn = document.getElementById('layout-table');
  var grid = document.getElementById('equipment-grid');
  var table = document.getElementById('equipment-table');
  var currentLayout = 'cards';

  cardsBtn.addEventListener('click', function() {
    currentLayout = 'cards';
    cardsBtn.classList.add('active');
    tableBtn.classList.remove('active');
    grid.style.display = '';
    table.style.display = 'none';
    
    var searchTerm = document.getElementById('search-input') ? document.getElementById('search-input').value : '';
    var activeCategory = 'all';
    var activeButton = document.querySelector('.filter-btn.active');
    if (activeButton) {
      activeCategory = activeButton.getAttribute('data-category');
    }
    displayEquipment(activeCategory, searchTerm);
  });

  tableBtn.addEventListener('click', function() {
    currentLayout = 'table';
    tableBtn.classList.add('active');
    cardsBtn.classList.remove('active');
    grid.style.display = 'none';
    table.style.display = '';
    
    var searchTerm = document.getElementById('search-input') ? document.getElementById('search-input').value : '';
    var activeCategory = 'all';
    var activeButton = document.querySelector('.filter-btn.active');
    if (activeButton) {
      activeCategory = activeButton.getAttribute('data-category');
    }
    displayEquipmentTable(activeCategory, searchTerm);
  });
}

loadEquipment();
setupFilters();
setupSearch();
setupModalEvents();
setupLayoutToggle();
