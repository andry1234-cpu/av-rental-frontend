// Configurazione keep-alive
const PING_INTERVAL = 14 * 60 * 1000; // 14 minuti in millisecondi
const BACKEND_URL = 'https://av-rental-backend.onrender.com/api/equipment';
let keepAliveInterval = null;

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

// Funzione per avviare il keep-alive
function startKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }
    keepAliveInterval = setInterval(pingServer, PING_INTERVAL);
    pingServer(); // Ping immediato all'avvio
}

// Funzione per fermare il keep-alive
function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
}

// Avvia il keep-alive all'inizializzazione
startKeepAlive();

// Gestione visibilità pagina
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Pagina nascosta, sospendo il ping');
        stopKeepAlive();
    } else {
        console.log('Pagina visibile, riprendo il ping');
        startKeepAlive();
    }
});
        clearInterval(pingInterval);
        console.log('Ping in pausa - pagina non visibile');
    } else {
        // Quando la pagina torna visibile, riavvia il ping
        pingServer(); // Ping immediato
        pingInterval = setInterval(pingServer, PING_INTERVAL);
        console.log('Ping riattivato - pagina visibile');
    }
});