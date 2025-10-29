// Imposta il link di navigazione attivo in base alla pagina corrente
function setupNavigation() {
  var navLinks = document.querySelectorAll('.nav-link');
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  navLinks.forEach(function(link) {
    link.classList.remove('active');
    var href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// Esegui al caricamento della pagina
document.addEventListener('DOMContentLoaded', setupNavigation);
