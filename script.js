let equipmentData = [];

async function loadEquipment() {
  const res = await fetch('https://av-rental-backend.onrender.com/api/equipment');
  equipmentData = await res.json();
  displayEquipment('all');
}

function displayEquipment(categoryFilter) {
  const grid = document.getElementById('equipment-grid');
  grid.innerHTML = ''; // Pulisce il contenuto esistente

  equipmentData.forEach(item => {
    if (categoryFilter === 'all' || item.category === categoryFilter) {
      const card = document.createElement('div');
      card.className = 'card';
      card.setAttribute('data-category', item.category);

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
      quantity.textContent = `Disponibili: ${item.quantity}`;

      // Aggiungiamo le specifiche tecniche
      const specs = document.createElement('div');
      specs.className = 'specs';

      if (item.weight && item.weight.value) {
        const weight = document.createElement('p');
        weight.className = 'spec-item';
        weight.innerHTML = `<strong>Peso:</strong> ${item.weight.value}${item.weight.unit}`;
        specs.appendChild(weight);
      }

      if (item.dimensions) {
        const dimensions = document.createElement('p');
        dimensions.className = 'spec-item';
        dimensions.innerHTML = `<strong>Dimensioni:</strong> ${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height}${item.dimensions.unit}`;
        specs.appendChild(dimensions);
      }

      if (item.powerConsumption && item.powerConsumption.value) {
        const power = document.createElement('p');
        power.className = 'spec-item';
        power.innerHTML = `<strong>Consumo:</strong> ${item.powerConsumption.value}${item.powerConsumption.unit}`;
        specs.appendChild(power);
      }

      info.append(title, category, quantity, specs);
      card.append(imageContainer, info);
      grid.appendChild(card);
    }
  });
}

// Gestione dei filtri
function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Rimuove la classe active da tutti i bottoni
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Aggiunge la classe active al bottone cliccato
      button.classList.add('active');
      // Filtra gli elementi
      const category = button.getAttribute('data-category');
      displayEquipment(category);
    });
  });
}

// Inizializzazione
loadEquipment();
setupFilters();
