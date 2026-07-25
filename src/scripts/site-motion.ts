import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SCRAMBLE =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789·/';

let ctx: gsap.Context | null = null;
let masonryLayoutHandler: ((e: Event) => void) | null = null;
let safetyTimer = 0;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function finePointer(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** Always leave type readable — never rely on CSS opacity:0 for kinetic. */
function revealKinetic(root?: ParentNode) {
  const scope = root || document;
  scope.querySelectorAll<HTMLElement>('.kinetic__inner').forEach((el) => {
    gsap.set(el, { clearProps: 'transform,opacity,filter' });
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.filter = 'none';
  });
}

function showAllContent() {
  document.documentElement.classList.remove('motion-pending');
  document.documentElement.classList.remove('motion-ready');
  revealKinetic();
  document.querySelectorAll('.reveal').forEach((el) => {
    el.classList.add('is-visible');
  });
  document.querySelectorAll<HTMLElement>('.pub-card').forEach((card) => {
    settlePubCard(card);
    gsap.set(card, { clearProps: 'transform,opacity,filter' });
  });
}

function animateKineticBlock(root: HTMLElement, immediate: boolean) {
  const inners = root.querySelectorAll<HTMLElement>('.kinetic__inner');
  if (!inners.length) return;

  const isHero = root.classList.contains('kinetic--hero');

  const from = {
    yPercent: isHero ? 110 : 90,
    opacity: 0,
    rotateX: isHero ? -48 : -22,
    filter: isHero ? 'blur(6px)' : 'blur(3px)',
    transformOrigin: '50% 100%',
  };

  const to = {
    yPercent: 0,
    opacity: 1,
    rotateX: 0,
    filter: 'blur(0px)',
    duration: isHero ? 0.95 : 0.65,
    ease: 'power3.out',
    stagger: {
      each: isHero ? 0.034 : 0.026,
      from: 'start' as const,
    },
    onComplete: () => revealKinetic(root),
  };

  if (immediate) {
    gsap.fromTo(inners, from, to);
    return;
  }

  // immediateRender: false keeps text visible until the trigger fires
  gsap.fromTo(inners, from, {
    ...to,
    immediateRender: false,
    scrollTrigger: {
      trigger: root,
      start: 'top 90%',
      once: true,
    },
  });
}

function bindScramble(root: HTMLElement) {
  if (!finePointer() || root.dataset.scrambleBound === '1') return;
  root.dataset.scrambleBound = '1';

  const targets = root.querySelectorAll<HTMLElement>('.kinetic__inner[data-text]');
  targets.forEach((el) => {
    const original = el.dataset.text || el.textContent || '';
    let frame = 0;
    let raf = 0;

    const run = () => {
      frame++;
      const progress = Math.min(1, frame / 14);
      el.textContent = original
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i / original.length < progress) return original[i];
          return SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
        })
        .join('');
      if (progress < 1) raf = requestAnimationFrame(run);
      else el.textContent = original;
    };

    el.addEventListener('mouseenter', () => {
      cancelAnimationFrame(raf);
      frame = 0;
      raf = requestAnimationFrame(run);
    });
  });
}

function settlePubCard(card: HTMLElement) {
  card.classList.add('pub-card--in', 'pub-card--settled');
  card.style.opacity = '1';
  card.style.transform = 'none';
  card.style.filter = 'none';
}

function enterPubCard(card: HTMLElement) {
  if (card.classList.contains('pub-card--in') || card.classList.contains('pub-card--settled')) {
    return;
  }
  card.classList.add('pub-card--in');

  const done = () => {
    settlePubCard(card);
    card.removeEventListener('animationend', onEnd);
  };
  const onEnd = (e: AnimationEvent) => {
    if (e.target !== card) return;
    if (e.animationName && e.animationName !== 'pub-masonry-enter') return;
    done();
  };
  card.addEventListener('animationend', onEnd);
  window.setTimeout(done, 1100);
}

function bindMasonryCards(container: HTMLElement) {
  if (container.dataset.masonryMotion === '1') return;
  container.dataset.masonryMotion = '1';

  const cards = Array.from(container.querySelectorAll<HTMLElement>('.pub-card'));
  if (!cards.length) return;

  const revealVisible = () => {
    const vh = window.innerHeight;
    cards.forEach((card) => {
      if (card.classList.contains('pub-card--in')) return;
      const r = card.getBoundingClientRect();
      if (r.top < vh * 0.98 && r.bottom > 40) enterPubCard(card);
    });
  };

  if (typeof IntersectionObserver === 'undefined') {
    cards.forEach(enterPubCard);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        enterPubCard(entry.target as HTMLElement);
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '12% 0px 12% 0px', threshold: 0.01 }
  );

  cards.forEach((card) => io.observe(card));

  revealVisible();
  requestAnimationFrame(() => {
    revealVisible();
    requestAnimationFrame(revealVisible);
  });

  window.setTimeout(() => cards.forEach(enterPubCard), 2500);
}

function watchMasonry() {
  document.querySelectorAll<HTMLElement>('[data-pub-masonry]').forEach((el) => {
    if (el.classList.contains('pub-masonry--ready')) {
      bindMasonryCards(el);
    }
  });

  if (masonryLayoutHandler) {
    document.removeEventListener('pub-masonry:layout', masonryLayoutHandler);
  }

  masonryLayoutHandler = (e: Event) => {
    const target = e.target;
    if (target instanceof HTMLElement && target.hasAttribute('data-pub-masonry')) {
      if (!target.dataset.masonryMotion) bindMasonryCards(target);
      else {
        // Relayout can move cards into view — reveal any still waiting
        const vh = window.innerHeight;
        target.querySelectorAll<HTMLElement>('.pub-card:not(.pub-card--in):not(.pub-card--settled)').forEach((card) => {
          const r = card.getBoundingClientRect();
          if (r.top < vh * 0.98 && r.bottom > 40) enterPubCard(card);
        });
      }
    }
  };
  document.addEventListener('pub-masonry:layout', masonryLayoutHandler);
}

function revealSection(section: HTMLElement) {
  section.classList.add('is-visible');
  const kids = section.querySelectorAll<HTMLElement>('.book-tile, .stagger-child');
  if (kids.length) {
    gsap.fromTo(
      kids,
      { y: 28, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.65,
        stagger: 0.05,
        ease: 'power3.out',
        overwrite: 'auto',
      }
    );
  }
}

export function teardownSiteMotion() {
  if (safetyTimer) {
    window.clearTimeout(safetyTimer);
    safetyTimer = 0;
  }
  ctx?.revert();
  ctx = null;
  ScrollTrigger.getAll().forEach((t) => t.kill());
  if (masonryLayoutHandler) {
    document.removeEventListener('pub-masonry:layout', masonryLayoutHandler);
    masonryLayoutHandler = null;
  }
  document.querySelectorAll<HTMLElement>('[data-pub-masonry]').forEach((el) => {
    delete el.dataset.masonryMotion;
  });
  document.querySelectorAll('.cursor-glow').forEach((el) => el.remove());
}

/**
 * Full-page-load motion only. This site is Astro `output: 'static'` —
 * no ClientRouter / view transitions. Each navigation is a fresh document.
 */
export function initSiteMotion() {
  teardownSiteMotion();
  document.documentElement.classList.remove('motion-pending');

  if (prefersReducedMotion()) {
    showAllContent();
    return;
  }

  try {
    ctx = gsap.context(() => {
      document.querySelectorAll<HTMLElement>('[data-kinetic]').forEach((el) => {
        const when = el.dataset.kineticWhen || 'scroll';
        animateKineticBlock(el, when === 'load');
        if (el.dataset.scramble === 'true') bindScramble(el);
      });

      document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)').forEach((section) => {
        const top = section.getBoundingClientRect().top;
        if (top < window.innerHeight * 0.92) {
          revealSection(section);
          return;
        }
        ScrollTrigger.create({
          trigger: section,
          start: 'top 90%',
          once: true,
          onEnter: () => revealSection(section),
        });
      });

      document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        const speed = Number(el.dataset.parallax || 0.18);
        gsap.fromTo(
          el,
          { y: -48 * speed },
          {
            y: 96 * speed,
            ease: 'none',
            scrollTrigger: {
              trigger: el.closest('section') || el.parentElement || el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      });

      const atmosphere = document.querySelector<HTMLElement>('.site-atmosphere');
      if (atmosphere) {
        gsap.to(atmosphere, {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
        });
      }

      if (finePointer()) {
        document.querySelectorAll<HTMLElement>('.book-tile').forEach((tile) => {
          const cover = tile.querySelector<HTMLElement>('.book-tile__cover');
          if (!cover) return;

          const rotX = gsap.quickTo(cover, 'rotateX', {
            duration: 0.45,
            ease: 'power3.out',
          });
          const rotY = gsap.quickTo(cover, 'rotateY', {
            duration: 0.45,
            ease: 'power3.out',
          });
          const lift = gsap.quickTo(cover, 'y', { duration: 0.45, ease: 'power3.out' });
          const skew = gsap.quickTo(tile, 'rotate', { duration: 0.5, ease: 'power3.out' });

          gsap.set(cover, { transformPerspective: 700, transformOrigin: '50% 50%' });

          tile.addEventListener('pointermove', (e) => {
            const rect = tile.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            rotY(px * 18);
            rotX(-py * 12);
            lift(-14);
            skew(px * -6 - 1.5);
          });

          tile.addEventListener('pointerleave', () => {
            rotX(0);
            rotY(0);
            lift(0);
            skew(0);
          });
        });

        document.querySelectorAll<HTMLElement>('.pub-card').forEach((card) => {
          // Tilt the media shell — never the card root (avoids fighting entrance opacity/transform)
          const media =
            card.querySelector<HTMLElement>('.pub-card__media') || card;
          const rx = gsap.quickTo(media, 'rotateX', { duration: 0.4, ease: 'power3.out' });
          const ry = gsap.quickTo(media, 'rotateY', { duration: 0.4, ease: 'power3.out' });
          gsap.set(media, { transformPerspective: 900, transformStyle: 'preserve-3d' });

          card.addEventListener('pointermove', (e) => {
            if (!card.classList.contains('pub-card--in')) return;
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            ry(px * 8);
            rx(-py * 6);
          });
          card.addEventListener('pointerleave', () => {
            rx(0);
            ry(0);
          });
        });
      }

      document.querySelectorAll<HTMLElement>('[data-kinetic-bio]').forEach((prose) => {
        prose.querySelectorAll('p').forEach((p) => {
          gsap.fromTo(
            p,
            { y: 16, opacity: 0.35 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power2.out',
              immediateRender: false,
              scrollTrigger: {
                trigger: p,
                start: 'top 92%',
                once: true,
              },
            }
          );
        });
      });

      document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((track) => {
        const distance = track.scrollWidth / 2;
        gsap.to(track, {
          x: -distance,
          duration: Math.max(28, distance / 40),
          ease: 'none',
          repeat: -1,
        });
      });

      watchMasonry();
    });

    // Hide pending scroll-reveals only after triggers exist
    document.documentElement.classList.add('motion-ready');
    ScrollTrigger.refresh();

    // Fail-safe: never leave a blank static page if a trigger/race stalls
    safetyTimer = window.setTimeout(() => {
      revealKinetic();
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
        el.classList.add('is-visible');
      });
      document.querySelectorAll<HTMLElement>('.pub-card:not(.pub-card--settled)').forEach((el) => {
        settlePubCard(el);
      });
    }, 2000);
  } catch {
    showAllContent();
  }
}
