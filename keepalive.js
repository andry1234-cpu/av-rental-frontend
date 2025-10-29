// Configurazione keep-alive
var PING_INTERVAL = 14 * 60 * 1000;
var BACKEND_URL = 'https://av-rental-backend.onrender.com/api/equipment';
var keepAliveInterval = null;

async function pingServer() {
  try {
    var res = await fetch(BACKEND_URL);
    if (!res.ok) {
      console.warn('Ping fallito, status: ' + res.status);
    } else {
      console.log('Server attivo: ' + new Date().toLocaleTimeString());
    }
  } catch (error) {
    console.warn('Errore ping:', error.message);
  }
}

function startKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  keepAliveInterval = setInterval(pingServer, PING_INTERVAL);
  pingServer();
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

startKeepAlive();

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    console.log('Pagina nascosta, sospendo ping');
    stopKeepAlive();
  } else {
    console.log('Pagina visibile, riprendopping');
    startKeepAlive();
  }
});