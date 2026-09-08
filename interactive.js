(() => {
  'use strict';
  const tour = document.querySelector('.tour');
  const slides = [...document.querySelectorAll('.tour-slide')];
  const chapters = [...document.querySelectorAll('.chapter-links a')];
  const supportsInert = slides.every(slide => 'inert' in slide);
  const pinQuery = matchMedia('(min-width: 901px) and (min-height: 701px) and (prefers-reduced-motion: no-preference)');
  let frame = 0;
  let pinned = false;
  let current = -1;
  function range() { return Math.max(1, tour.offsetHeight - tour.querySelector('.tour-stage').offsetHeight); }
  function top() { return tour.getBoundingClientRect().top + scrollY - document.querySelector('header').offsetHeight; }
  function easedProgress(raw) {
    const steps = slides.length - 1;
    if (steps < 1) return 0;
    const position = raw * steps;
    const chapter = Math.floor(position);
    // Reserve the first and last quarter of each interval for reading.
    // Smoothstep eases the movement between them in either scroll direction.
    const t = Math.max(0, Math.min(1, (position - chapter - 0.25) / 0.5));
    return (chapter + t * t * (3 - 2 * t)) / steps;
  }
  function update() {
    frame = 0;
    if (!pinned) return;
    const raw = Math.max(0, Math.min(1, (scrollY - top()) / range()));
    const progress = easedProgress(raw);
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
    tour.style.setProperty('--tour-travel', `${-100 * (slides.length - 1)}%`);
    tour.style.setProperty('--tour-height', `${100 + 160 * (slides.length - 1)}vh`);
    document.documentElement.style.setProperty('--header-height', `${document.querySelector('header').offsetHeight}px`);
    // Keep all content in document flow if large text cannot fit the stage,
    // or the browser cannot remove offscreen panels from keyboard navigation.
    pinned = pinQuery.matches && supportsInert;
    tour.classList.toggle('is-pinned', pinned);
    if (pinned) {
      const available = tour.querySelector('.tour-window').clientHeight;
      if (slides.some(slide => slide.querySelector('.tour-copy').scrollHeight + 40 > available)) {
        pinned = false;
        tour.classList.remove('is-pinned');
      }
    }
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
  window.addEventListener('resize',configure,{passive:true});
  document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', () => {link.closest('details').open = false;});
  });
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
