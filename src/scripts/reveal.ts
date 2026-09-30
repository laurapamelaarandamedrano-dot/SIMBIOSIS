function setup(): void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elements = document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)');

  if (prefersReducedMotion || elements.length === 0) {
    elements.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    elements.forEach((el, index) => {
      el.style.setProperty('--stagger-index', String(index % 6));
      observer.observe(el);
    });
  }

  const tiltCards = document.querySelectorAll<HTMLElement>('.tilt');

  if (!prefersReducedMotion && matchMedia('(hover: hover)').matches) {
    tiltCards.forEach((card) => {
      const strength = 8;

      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `rotateX(${(-y * strength).toFixed(2)}deg) rotateY(${(x * strength).toFixed(2)}deg) translateY(-4px)`;
      });

      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }
}

document.addEventListener('astro:page-load', setup);

export {};
