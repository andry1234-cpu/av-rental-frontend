// Elenco festivi italiani fissi
const FESTIVI_FISSI = [
  { mese: 0, giorno: 1, nome: 'Capodanno' },
  { mese: 0, giorno: 6, nome: 'Epifania' },
  { mese: 3, giorno: 25, nome: 'Festa della Liberazione' },
  { mese: 4, giorno: 1, nome: 'Festa del Lavoro' },
  { mese: 5, giorno: 2, nome: 'Festa della Repubblica' },
  { mese: 7, giorno: 15, nome: 'Ferragosto' },
  { mese: 9, giorno: 1, nome: 'Ognissanti' },
  { mese: 11, giorno: 8, nome: 'Immacolata Concezione' },
  { mese: 11, giorno: 25, nome: 'Natale' },
  { mese: 11, giorno: 26, nome: 'Santo Stefano' }
];

// Funzione per calcolare la Pasqua (Algoritmo Computus)
function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month: month - 1, day: day };
}

// Funzione per ottenere i festivi mobili (Pasqua e Lunedì dell'Angelo)
function getFestividMobili(year) {
  const easter = calculateEaster(year);
  return [
    { mese: easter.month, giorno: easter.day, nome: 'Pasqua' },
    { mese: easter.month, giorno: easter.day + 1, nome: 'Lunedì dell\'Angelo' }
  ];
}

// Funzione per controllare se una data è festivo
function isFestivo(date) {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // Controlla festivi fissi
  for (let festivo of FESTIVI_FISSI) {
    if (festivo.mese === month && festivo.giorno === day) {
      return true;
    }
  }
  
  // Controlla festivi mobili
  const mobili = getFestividMobili(year);
  for (let festivo of mobili) {
    if (festivo.mese === month && festivo.giorno === day) {
      return true;
    }
  }
  
  return false;
}

// Funzione per controllare se è domenica
function isDomenica(date) {
  return date.getDay() === 0;
}

// Funzione per aggiornare data e ora
function updateDateTime() {
  const headerEl = document.getElementById('date-time-header');
  if (!headerEl) return;
  
  const now = new Date();
  
  // Formatta ora con secondi
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;
  
  // Formatta data
  const giorni = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const mesi = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
                'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  
  const weekdayRaw = giorni[now.getDay()];
  const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1); // Maiuscola prima lettera
  const day = now.getDate();
  const monthRaw = mesi[now.getMonth()];
  const month = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1); // Maiuscola prima lettera
  const year = now.getFullYear();
  
  const dateStr = `${day} ${month} ${year}`;
  
  // Controlla se è festivo o domenica
  const isFest = isFestivo(now);
  const isDom = isDomenica(now);
  const isFestivoOrDomenica = isFest || isDom;
  
  // Aggiorna HTML in una singola riga
  headerEl.innerHTML = `
    <h2>${dateStr}</h2>
    <div class="time">${timeStr}</div>
    <div class="weekday">${weekday}</div>
  `;
  
  // Applica classe per festivo/domenica
  if (isFestivoOrDomenica) {
    headerEl.classList.add('festivo');
  } else {
    headerEl.classList.remove('festivo');
  }
}

// Inizializza l'aggiornamento quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  updateDateTime();
  setInterval(updateDateTime, 1000);
});
