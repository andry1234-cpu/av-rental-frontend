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
    eventEl.addEventListener('click', () => showJobDetail(job));
    eventsContainer.appendChild(eventEl);
  });
  
  dayEl.appendChild(eventsContainer);
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
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
}

// Naviga al mese successivo
function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
}

// Mostra i dettagli del lavoro
function showJobDetail(job) {
  console.log('Job selezionato:', job);
  alert(`${job.name}\n${new Date(job.startDate).toLocaleDateString('it-IT')} - ${new Date(job.endDate).toLocaleDateString('it-IT')}\nLuogo: ${job.location}`);
  // TODO: Implementare modal con dettagli completi
}

// Inizializza quando il DOM è caricato
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalendar);
} else {
  initCalendar();
}
