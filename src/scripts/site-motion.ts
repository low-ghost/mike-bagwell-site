import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { finePointer, prefersReducedMotion } from '../lib/motion-pref';
import { bindScrambleHover } from '../lib/scramble';

gsap.registerPlugin(ScrollTrigger);

let ctx: gsap.Context | null = null;
let masonryLayoutHandler: ((e: Event) => void) | null = null;
let safetyTimer = 0;
let excerptFocusCleanup: (() => void) | null = null;

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

function cardInViewport(card: HTMLElement, vh: number) {
  const r = card.getBoundingClientRect();
  return r.top < vh * 0.98 && r.bottom > 40;
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
      if (cardInViewport(card, vh)) enterPubCard(card);
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
  requestAnimationFrame(revealVisible);
  // Catch cards that were above the fold before IO fired
  window.setTimeout(() => cards.forEach(enterPubCard), 2000);
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
    if (!(target instanceof HTMLElement) || !target.hasAttribute('data-pub-masonry')) return;

    if (!target.dataset.masonryMotion) {
      bindMasonryCards(target);
      return;
    }

    const vh = window.innerHeight;
    target
      .querySelectorAll<HTMLElement>('.pub-card:not(.pub-card--in):not(.pub-card--settled)')
      .forEach((card) => {
        if (cardInViewport(card, vh)) enterPubCard(card);
      });
  };
  document.addEventListener('pub-masonry:layout', masonryLayoutHandler);
}

function revealSection(section: HTMLElement) {
  section.classList.add('is-visible');
  const kids = section.querySelectorAll<HTMLElement>('.book-tile, .stagger-child');
  if (!kids.length) return;

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

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function bindMobileExcerptFocus() {
  excerptFocusCleanup?.();
  excerptFocusCleanup = null;

  const mq = window.matchMedia('(max-width: 767px)');
  if (!mq.matches) return;

  const display = new Map<HTMLElement, number>();
  let cards = Array.from(document.querySelectorAll<HTMLElement>('.pub-card')).filter((c) =>
    c.querySelector('.pub-card__excerpt')
  );
  let raf = 0;
  let running = false;

  const refreshCards = () => {
    cards = Array.from(document.querySelectorAll<HTMLElement>('.pub-card')).filter((c) =>
      c.querySelector('.pub-card__excerpt')
    );
  };

  const clearProgress = (card: HTMLElement) => {
    card.style.removeProperty('--excerpt-progress');
    card.classList.remove('is-excerpt-active');
    display.delete(card);
  };

  const clearAll = () => {
    cards.forEach(clearProgress);
    display.clear();
  };

  const computeTargets = (): Map<HTMLElement, number> => {
    const targets = new Map<HTMLElement, number>();
    if (!mq.matches) return targets;

    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const focusY = vh * 0.42;
    const band = vh * 0.72;
    const focusX = vw * 0.5;

    let best: HTMLElement | null = null;
    let bestDistY = Infinity;
    let bestKey = Infinity;

    for (const card of cards) {
      const media = card.querySelector<HTMLElement>('.pub-card__media') || card;
      const r = media.getBoundingClientRect();
      if (r.bottom < -vh * 0.15 || r.top > vh * 1.15) continue;
      const midY = (r.top + r.bottom) / 2;
      const midX = (r.left + r.right) / 2;
      const distY = Math.abs(midY - focusY);
      const distX = Math.abs(midX - focusX);
      const key = distY * 1000 + distX;
      if (key < bestKey) {
        bestKey = key;
        bestDistY = distY;
        best = card;
      }
    }

    if (best && bestDistY <= band) {
      const linear = 1 - bestDistY / band;
      targets.set(best, smoothstep(linear) ** 2.1);
    }

    return targets;
  };

  const applyProgress = (card: HTMLElement, progress: number) => {
    if (progress < 0.004) {
      clearProgress(card);
      return;
    }
    card.style.setProperty('--excerpt-progress', progress.toFixed(4));
    card.classList.toggle('is-excerpt-active', progress > 0.1);
    display.set(card, progress);
  };

  const tick = () => {
    raf = 0;
    if (!mq.matches) {
      clearAll();
      running = false;
      return;
    }

    const targets = computeTargets();
    const lerp = prefersReducedMotion() ? 1 : 0.032;
    let needsMore = false;
    const seen = new Set<HTMLElement>();

    targets.forEach((tgt, card) => {
      seen.add(card);
      const cur = display.get(card) ?? 0;
      const next = cur + (tgt - cur) * lerp;
      if (Math.abs(tgt - next) > 0.004) needsMore = true;
      applyProgress(card, Math.abs(tgt - next) <= 0.004 ? tgt : next);
    });

    display.forEach((cur, card) => {
      if (seen.has(card)) return;
      const next = cur + (0 - cur) * lerp;
      if (next > 0.004) {
        needsMore = true;
        applyProgress(card, next);
      } else {
        clearProgress(card);
      }
    });

    if (needsMore) {
      raf = requestAnimationFrame(tick);
    } else {
      running = false;
    }
  };

  const kick = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(tick);
  };

  const onMq = () => {
    if (!mq.matches) {
      clearAll();
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else {
      refreshCards();
      kick();
    }
  };

  const onMasonryLayout = () => {
    refreshCards();
    kick();
  };

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick, { passive: true });
  mq.addEventListener('change', onMq);
  document.addEventListener('pub-masonry:layout', onMasonryLayout);
  kick();

  excerptFocusCleanup = () => {
    window.removeEventListener('scroll', kick);
    window.removeEventListener('resize', kick);
    mq.removeEventListener('change', onMq);
    document.removeEventListener('pub-masonry:layout', onMasonryLayout);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    running = false;
    clearAll();
  };
}

export function teardownSiteMotion() {
  if (safetyTimer) {
    window.clearTimeout(safetyTimer);
    safetyTimer = 0;
  }
  excerptFocusCleanup?.();
  excerptFocusCleanup = null;
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
}

export function initSiteMotion() {
  teardownSiteMotion();

  if (prefersReducedMotion()) {
    showAllContent();
    bindMobileExcerptFocus();
    return;
  }

  ctx = gsap.context(() => {
    document.querySelectorAll<HTMLElement>('[data-kinetic]').forEach((el) => {
      const when = el.dataset.kineticWhen || 'scroll';
      animateKineticBlock(el, when === 'load');
      if (el.dataset.scramble === 'true') {
        el.querySelectorAll<HTMLElement>('.kinetic__inner[data-text]').forEach((inner) => {
          bindScrambleHover(inner);
        });
      }
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
        const media = card.querySelector<HTMLElement>('.pub-card__media') || card;
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
      const tween = gsap.to(track, {
        x: -distance,
        duration: Math.max(28, distance / 40),
        ease: 'none',
        repeat: -1,
      });

      const root = track.closest('.journal-marquee') as HTMLElement | null;
      if (!root) return;

      const pause = () => tween.pause();
      const play = () => tween.play();
      root.addEventListener('mouseenter', pause);
      root.addEventListener('mouseleave', play);
      root.addEventListener('focusin', pause);
      root.addEventListener('focusout', (e) => {
        const next = (e as FocusEvent).relatedTarget;
        if (!(next instanceof Node) || !root.contains(next)) play();
      });
    });

    watchMasonry();
  });

  document.documentElement.classList.add('motion-ready');
  ScrollTrigger.refresh();

  safetyTimer = window.setTimeout(() => {
    revealKinetic();
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      el.classList.add('is-visible');
    });
    document.querySelectorAll<HTMLElement>('.pub-card:not(.pub-card--settled)').forEach((el) => {
      settlePubCard(el);
    });
  }, 2000);

  bindMobileExcerptFocus();
}
