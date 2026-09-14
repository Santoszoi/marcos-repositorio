(() => {
  const PHONE = '5561996253510';
  const DEFAULT_MESSAGE = 'Olá, vim pelo site da Marcos Solutions e gostaria de conversar sobre uma solução para minha empresa.';

  document.querySelectorAll('[data-wa]').forEach((link) => {
    const service = link.dataset.wa;
    const message = service && service !== 'geral'
      ? `Olá, vim pelo site da Marcos Solutions e gostaria de conversar sobre ${service} na minha empresa.`
      : DEFAULT_MESSAGE;
    link.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });

  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.nav-links');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    }));
  }
})();
