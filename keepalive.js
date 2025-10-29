// Namespace per il keep-alive
const KeepAlive = {
    PING_INTERVAL: 14 * 60 * 1000, // 14 minuti in millisecondi
    BACKEND_URL: 'https://av-rental-backend.onrender.com/api/equipment',
    intervalId: null,

    // Funzione per il ping del server
    pingServer: async function() {
        try {
            const res = await fetch(this.BACKEND_URL);
            if (!res.ok) {
                console.warn(`[${new Date().toLocaleTimeString()}] Ping fallito, status: ${res.status}`);
            } else {
                console.log(`[${new Date().toLocaleTimeString()}] Server attivo`);
            }
        } catch (error) {
            console.warn(`[${new Date().toLocaleTimeString()}] Errore ping:`, error.message);
        }
    },

    // Avvia il ping periodico
    start: function() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.intervalId = setInterval(() => this.pingServer(), this.PING_INTERVAL);
        this.pingServer(); // Ping immediato all'avvio
    }
};

// Avvia il keep-alive
KeepAlive.start();

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