// Configurazione del keep-alive
const PING_INTERVAL = 14 * 60 * 1000; // 14 minuti in millisecondi
const BACKEND_URL = 'https://av-rental-backend.onrender.com/api/equipment';

// Funzione per il ping del server
async function pingServer() {
    try {
        const res = await fetch(BACKEND_URL);
        if (!res.ok) {
            console.warn(`[${new Date().toLocaleTimeString()}] Ping fallito, status: ${res.status}`);
        } else {
            console.log(`[${new Date().toLocaleTimeString()}] Server attivo`);
        }
    } catch (error) {
        console.warn(`[${new Date().toLocaleTimeString()}] Errore ping:`, error.message);
    }
}

// Avvia il ping periodico
let pingInterval = setInterval(pingServer, PING_INTERVAL);

// Ping iniziale
pingServer();

// Gestione visibilità pagina per ottimizzazione
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Quando la pagina non è visibile, ferma il ping
        clearInterval(pingInterval);
        console.log('Ping in pausa - pagina non visibile');
    } else {
        // Quando la pagina torna visibile, riavvia il ping
        pingServer(); // Ping immediato
        pingInterval = setInterval(pingServer, PING_INTERVAL);
        console.log('Ping riattivato - pagina visibile');
    }
});