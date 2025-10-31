// Calendar Module - Gestisce il calendario mensile sulla Dashboard

let currentDate = new Date();
const API_BASE = 'https://av-rental-backend.onrender.com/api';

// Inizializza il calendario
function initCalendar() {
  renderCalendar(currentDate);
  document.getElementById('prev-month-btn').addEventListener('click', previousMonth);
  document.getElementById('next-month-btn').addEventListener('click', nextMonth);
}

// Renderizza il calendario per il mese
async function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Aggiorna il titolo
  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  document.getElementById('calendar-title').textContent = `${monthNames[month]} ${year}`;
  
  // Recupera i lavori del mese
  const jobs = await fetchJobsForMonth(year, month + 1);
  
  // Crea la griglia del calendario
  const calendarGrid = document.getElementById('calendar-grid');
  calendarGrid.innerHTML = '';
  
  // Aggiungi intestazioni giorni della settimana
  const dayHeaders = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];
  dayHeaders.forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    calendarGrid.appendChild(header);
  });
  
  // Primo giorno del mese e numero di giorni
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  // Giorni del mese precedente (sfumati)
  const startDay = firstDay === 0 ? 6 : firstDay - 1; // Inizia da lunedì
  for (let i = startDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    addDayToCalendar(calendarGrid, dayNum, month - 1, year, [], true);
  }
  
  // Giorni di questo mese
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = year === today.getFullYear() && 
                    month === today.getMonth() && 
                    day === today.getDate();
    
    // Filtra i lavori per questo giorno
    const dayJobs = jobs.filter(job => {
      const start = new Date(job.startDate);
      const end = new Date(job.endDate);
      const current = new Date(year, month, day);
      return start.toDateString() === current.toDateString() || 
             end.toDateString() === current.toDateString() ||
             (start < current && end > current);
    });
    
    addDayToCalendar(calendarGrid, day, month, year, dayJobs, false, isToday);
  }
  
  // Giorni del mese successivo (sfumati)
  const totalCells = calendarGrid.children.length - 7; // Escludi header
  const remainingCells = 42 - totalCells; // 6 righe * 7 giorni
  for (let day = 1; day <= remainingCells; day++) {
    addDayToCalendar(calendarGrid, day, month + 1, year, [], true);
  }
}

// Aggiunge un giorno alla griglia
function addDayToCalendar(grid, day, month, year, jobs, isOtherMonth, isToday = false) {
  const dayEl = document.createElement('div');
  dayEl.className = 'calendar-day';
  
  if (isOtherMonth) {
    dayEl.classList.add('other-month');
  }
  if (isToday) {
    dayEl.classList.add('today');
  }
  
  // Numero del giorno
  const dayNumber = document.createElement('div');
  dayNumber.className = 'calendar-day-number';
  dayNumber.textContent = day;
  dayEl.appendChild(dayNumber);
  
  // Container per gli eventi
  const eventsContainer = document.createElement('div');
  eventsContainer.className = 'calendar-events';
  
  jobs.forEach(job => {
    const eventEl = document.createElement('div');
    eventEl.className = 'calendar-event';
    eventEl.textContent = job.name;
    eventEl.title = job.name; // Tooltip
    // Click su evento apre modal con dettagli
    eventEl.addEventListener('click', (e) => {
      e.stopPropagation(); // Non propagare al click della cella
      showJobDetailModal(job);
    });
    eventsContainer.appendChild(eventEl);
  });
  
  dayEl.appendChild(eventsContainer);
  
  // Click sulla cella per espandere (solo se ha eventi e non è un altro mese)
  dayEl.addEventListener('click', () => {
    if (!isOtherMonth && jobs.length > 0) {
      expandDay(day, month, year, jobs);
    }
  });
  
  grid.appendChild(dayEl);
}

// Recupera i lavori per il mese specificato
async function fetchJobsForMonth(year, month) {
  try {
    const response = await fetch(`${API_BASE}/jobs/calendar/${year}/${month}`);
    if (!response.ok) {
      console.error('Errore nel caricamento dei lavori:', response.statusText);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Errore nella fetch dei lavori:', error);
    return [];
  }
}

// Naviga al mese precedente
function previousMonth() {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  renderCalendar(currentDate);
}

// Naviga al mese successivo
function nextMonth() {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  renderCalendar(currentDate);
}

// Mostra modal con dettagli del singolo evento
function showJobDetailModal(job) {
  // Crea overlay
  const overlay = document.createElement('div');
  overlay.className = 'expanded-overlay';
  overlay.addEventListener('click', closeJobDetailModal);
  document.body.appendChild(overlay);
  
  // Crea modal
  const modal = document.createElement('div');
  modal.className = 'job-detail-modal';
  modal.id = 'job-detail-modal-calendar';
  
  // Pulsante di chiusura
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-expanded-btn';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', closeJobDetailModal);
  modal.appendChild(closeBtn);
  
  // Titolo
  const title = document.createElement('h2');
  title.textContent = job.name;
  title.style.color = '#00BCD4';
  title.style.marginTop = '0';
  modal.appendChild(title);
  
  // Dettagli
  const detailsDiv = document.createElement('div');
  detailsDiv.style.color = '#f0f0f0';
  detailsDiv.style.fontSize = '0.9rem';
  detailsDiv.style.lineHeight = '1.8';
  
  const startDate = new Date(job.startDate).toLocaleDateString('it-IT');
  const startTime = new Date(job.startDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const endDate = new Date(job.endDate).toLocaleDateString('it-IT');
  const endTime = new Date(job.endDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  
  detailsDiv.innerHTML = `
    <div><strong>📅 Data Inizio:</strong> ${startDate} ${startTime}</div>
    <div><strong>📅 Data Fine:</strong> ${endDate} ${endTime}</div>
    <div><strong>📍 Luogo:</strong> ${job.location}</div>
    ${job.responsibile ? `<div><strong>👤 Responsabile:</strong> ${job.responsibile.name} ${job.responsibile.surname}</div>` : ''}
    ${job.notes ? `<div><strong>📝 Note:</strong> ${job.notes}</div>` : ''}
    <div><strong>🔖 Status:</strong> ${job.status}</div>
  `;
  modal.appendChild(detailsDiv);
  
  document.body.appendChild(modal);
  
  // Chiudi premendo ESC
  document.addEventListener('keydown', handleEscapeKeyForModal);
}

// Chiude il modal del dettaglio evento
function closeJobDetailModal() {
  const overlay = document.querySelector('.expanded-overlay');
  const modal = document.getElementById('job-detail-modal-calendar');
  
  if (overlay) overlay.remove();
  if (modal) modal.remove();
  
  document.removeEventListener('keydown', handleEscapeKeyForModal);
}

// Gestisce il tasto ESC per il modal
function handleEscapeKeyForModal(e) {
  if (e.key === 'Escape') {
    closeJobDetailModal();
  }
}

// Espande una cella per mostrare tutti gli eventi del giorno
function expandDay(day, month, year, jobs) {
  // Crea overlay
  const overlay = document.createElement('div');
  overlay.className = 'expanded-overlay';
  overlay.addEventListener('click', closeExpandedDay);
  document.body.appendChild(overlay);
  
  // Crea cella espansa
  const expandedCell = document.createElement('div');
  expandedCell.className = 'calendar-day expanded';
  
  // Pulsante di chiusura
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-expanded-btn';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', closeExpandedDay);
  expandedCell.appendChild(closeBtn);
  
  // Numero del giorno
  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const dayNumber = document.createElement('div');
  dayNumber.className = 'calendar-day-number';
  dayNumber.textContent = `${day} ${monthNames[month]} ${year}`;
  expandedCell.appendChild(dayNumber);
  
  // Container per gli eventi
  const eventsContainer = document.createElement('div');
  eventsContainer.className = 'calendar-events';
  
  jobs.forEach(job => {
    const eventEl = document.createElement('div');
    eventEl.className = 'calendar-event';
    
    const eventTitle = document.createElement('strong');
    eventTitle.textContent = job.name;
    eventEl.appendChild(eventTitle);
    
    const eventDetails = document.createElement('div');
    eventDetails.style.fontSize = '0.8rem';
    eventDetails.style.color = '#aaa';
    eventDetails.style.marginTop = '0.4rem';
    eventDetails.innerHTML = `
      <div>📅 ${new Date(job.startDate).toLocaleDateString('it-IT')} - ${new Date(job.endDate).toLocaleDateString('it-IT')}</div>
      <div>📍 ${job.location}</div>
      ${job.responsibile ? `<div>👤 ${job.responsibile.name} ${job.responsibile.surname}</div>` : ''}
    `;
    eventEl.appendChild(eventDetails);
    eventsContainer.appendChild(eventEl);
  });
  
  expandedCell.appendChild(eventsContainer);
  document.body.appendChild(expandedCell);
  
  // Chiudi premendo ESC
  document.addEventListener('keydown', handleEscapeKey);
}

// Chiude la cella espansa
function closeExpandedDay() {
  const overlay = document.querySelector('.expanded-overlay');
  const expandedCell = document.querySelector('.calendar-day.expanded');
  
  if (overlay) overlay.remove();
  if (expandedCell) expandedCell.remove();
  
  document.removeEventListener('keydown', handleEscapeKey);
}

// Gestisce il tasto ESC
function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeExpandedDay();
  }
}

// Inizializza quando il DOM è caricato
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalendar);
} else {
  initCalendar();
}
