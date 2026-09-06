(() => {
  'use strict';
  const tour = document.querySelector('.tour');
  const slides = [...document.querySelectorAll('.tour-slide')];
  const chapters = [...document.querySelectorAll('.chapter-links a')];
  const pinQuery = matchMedia('(min-width: 901px) and (min-height: 701px) and (prefers-reduced-motion: no-preference)');
  let frame = 0;
  let pinned = false;
  let current = -1;
  function range() { return Math.max(1, tour.offsetHeight - tour.querySelector('.tour-stage').offsetHeight); }
  function top() { return tour.getBoundingClientRect().top + scrollY - document.querySelector('header').offsetHeight; }
  function update() {
    frame = 0;
    if (!pinned) return;
    const progress = Math.max(0, Math.min(1, (scrollY - top()) / range()));
    tour.style.setProperty('--progress', progress.toFixed(5));
    const index = Math.round(progress * (slides.length - 1));
    if (index !== current) {
      current = index;
      chapters.forEach((a,i) => i === index ? a.setAttribute('aria-current','step') : a.removeAttribute('aria-current'));
      slides.forEach((slide,i) => {slide.inert = i !== index;});
    }
  }
  function queue() { if (!frame) frame = requestAnimationFrame(update); }
  function configure() {
    pinned = pinQuery.matches;
    tour.classList.toggle('is-pinned', pinned);
    current = -1;
    slides.forEach(slide => {slide.inert = false;});
    if (!pinned) {tour.style.removeProperty('--progress');chapters.forEach(a => a.removeAttribute('aria-current'));}
    queue();
  }
  function goToSlide(index) {
    if (!pinned) return;
    // Chapter controls jump to an exact readable panel. Scrolling remains native.
    window.scrollTo({top:top() + range() * index / (slides.length - 1),behavior:'instant'});
    update();
  }
  document.querySelectorAll('a[href^="#tour-"]').forEach(a => {
    a.addEventListener('click', event => {
      const index = slides.findIndex(s => '#' + s.id === a.getAttribute('href'));
      if (index < 0 || !pinned) return;
      event.preventDefault();
      goToSlide(index);
      // Keep focus outside a panel that is becoming inert.
      chapters[index].focus({preventScroll:true});
      history.replaceState(null, '', '#' + slides[index].id);
    });
  });
  window.addEventListener('scroll',queue,{passive:true});
  window.addEventListener('resize',queue,{passive:true});
  pinQuery.addEventListener('change',configure);
  configure();
  function restoreHash() {
    const index = slides.findIndex(s => '#' + s.id === location.hash);
    if (index >= 0) goToSlide(index);
  }
  window.addEventListener('load',restoreHash);
  window.addEventListener('hashchange',restoreHash);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
    }),{threshold:.15});
    document.querySelectorAll('.migration-step,.feature').forEach(el => {el.classList.add('reveal-ready');observer.observe(el);});
  }
})();
