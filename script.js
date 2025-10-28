async function loadEquipment() {
  const res = await fetch('https://av-rental-backend.onrender.com/api/equipment');
  const data = await res.json();
  const grid = document.getElementById('equipment-grid');

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';

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

    info.append(title, category, quantity);
    card.append(imageContainer, info);
    grid.appendChild(card);
  });
}

loadEquipment();
