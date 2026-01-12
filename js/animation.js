// Slide in animation
// Scroll-scrub slide: set data-scroll-slide="x,y" (e.g. "1,0" right, "-1,0" left, "0,1" up, "0,-1" down).
// Adjust baseOffset to change the slide distance; remove data-scroll-slide to disable on an element.
const baseOffset = 60;
const slideEls = document.querySelectorAll('[data-scroll-slide]');

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const update = () => {
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const start = viewportHeight * 0.9;
  const end = viewportHeight * 0.2;

  slideEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const progress = (start - rect.top) / (start - end);
    const clamped = clamp(progress, 0, 1);
    const raw = el.dataset.scrollSlide || '';
    const [xRaw, yRaw] = raw.split(',');
    const xDir = Number(xRaw);
    const yDir = Number(yRaw);
    const safeX = Number.isFinite(xDir) ? xDir : 0;
    const safeY = Number.isFinite(yDir) ? yDir : 0;
    const offset = (1 - clamped) * baseOffset;

    el.style.setProperty('--slide-x', `${offset * safeX}px`);
    el.style.setProperty('--slide-y', `${offset * safeY}px`);
    el.style.setProperty('--slide-opacity', clamped.toFixed(3));
  });
};

let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    update();
    ticking = false;
  });
};

document.addEventListener('DOMContentLoaded', () => {
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
});
