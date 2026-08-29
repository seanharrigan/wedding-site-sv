const body = document.body;
const header = document.getElementById('site-header');
const menuToggle = document.getElementById('menu-toggle');
const navLinks = [...document.querySelectorAll('.nav-link')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const readStoredValue = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const storeValue = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* Storage can be unavailable in restricted browsing modes. */ }
};
const languageToggle = document.getElementById('language-toggle');
const introLanguageToggle = document.getElementById('intro-language-toggle');
const passwordGate = document.getElementById('password-gate');
const passwordGateForm = document.getElementById('password-gate-form');
const passwordInput = document.getElementById('invitation-password');
const passwordGateStatus = document.getElementById('password-gate-status');
const constructionMessage = document.getElementById('construction-message');
const invitationIntro = document.getElementById('invitation-intro');
const openEnvelope = document.getElementById('open-envelope');
const enterSite = document.getElementById('enter-site');
const introClose = document.getElementById('intro-close');
const invitationReplay = document.getElementById('invitation-replay');
const animationPreviewTrigger = document.getElementById('animation-preview-trigger');
const animationPreview = document.getElementById('animation-preview');
const animationPreviewClose = document.getElementById('animation-preview-close');
const languageGate = document.getElementById('language-gate');
const languageGateOptions = [...document.querySelectorAll('.language-gate-option')];
const envelopeStage = document.querySelector('.envelope-stage');
const suiteComposite = document.querySelector('.suite-composite');
const closedWaxSeal = document.querySelector('.closed-wax-seal');
const suiteCards = [...document.querySelectorAll('.suite-card[href], .suite-hotspot[href]')];
const suiteHoverPieces = [...document.querySelectorAll('.suite-hotspot, .suite-monogram-card')];
const nav = document.getElementById('nav-links');
const mobileCurrent = document.getElementById('mobile-current');
const skipLink = document.querySelector('.skip-link');
const headerToneSections = [...document.querySelectorAll('[data-header-tone]')];
const mainSite = document.getElementById('main');
const guestAccessHash = 'ecaf6dd0ad0c57473723257f3733a39aa525d0e226da7dcdd46c710ccbece8dc';
const adminAccessHash = '25688512fee107987b57aee0feef189470a3ee891ff776588ab62e1ba8d6a5f2';
let headerToneFrame = 0;
let invitationHideTimer = 0;
let invitationFocusTimer = 0;
let invitationReplayTimer = 0;
let invitationOpenTimer = 0;
let invitationCloseTimer = 0;
let animationPreviewHideTimer = 0;
let animationPreviewReturnFocus = null;
const invitationExitDuration = reducedMotion ? 0 : 1320;
const invitationTargetDelay = reducedMotion ? 0 : 1160;

const clearInvitationTimers = () => {
  clearTimeout(invitationHideTimer);
  clearTimeout(invitationFocusTimer);
  clearTimeout(invitationReplayTimer);
  clearTimeout(invitationOpenTimer);
  clearTimeout(invitationCloseTimer);
  invitationHideTimer = 0;
  invitationFocusTimer = 0;
  invitationReplayTimer = 0;
  invitationOpenTimer = 0;
  invitationCloseTimer = 0;
};

const setMenuOpen = (open) => {
  body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  const spanish = document.documentElement.lang === 'es';
  menuToggle.setAttribute('aria-label', open
    ? (spanish ? 'Cerrar menú' : 'Close navigation')
    : (spanish ? 'Abrir menú' : 'Open navigation'));
};

const setAnimationPreviewOpen = (open) => {
  if (!animationPreview) return;
  clearTimeout(animationPreviewHideTimer);
  if (open) {
    animationPreviewReturnFocus = document.activeElement === document.body
      ? animationPreviewTrigger
      : document.activeElement;
    setMenuOpen(false);
    animationPreview.hidden = false;
    body.classList.add('animation-preview-open');
    requestAnimationFrame(() => {
      animationPreview.classList.add('is-visible');
      animationPreviewClose?.focus({ preventScroll: true });
    });
    return;
  }
  animationPreview.classList.remove('is-visible');
  body.classList.remove('animation-preview-open');
  animationPreviewHideTimer = window.setTimeout(() => {
    animationPreview.hidden = true;
    animationPreviewReturnFocus?.focus?.({ preventScroll: true });
    animationPreviewHideTimer = 0;
  }, reducedMotion ? 0 : 260);
};

const syncHeaderTone = () => {
  if (headerToneFrame) return;
  headerToneFrame = requestAnimationFrame(() => {
    headerToneFrame = 0;
    const headerRect = header.getBoundingClientRect();
    const probeY = Math.min(innerHeight - 1, Math.max(0, headerRect.top + (headerRect.height / 2)));
    let current = null;
    let nearestDistance = Infinity;

    headerToneSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= probeY && rect.bottom > probeY) {
        current = section;
        nearestDistance = 0;
        return;
      }
      if (nearestDistance === 0) return;
      const distance = probeY < rect.top ? rect.top - probeY : probeY - rect.bottom;
      if (distance < nearestDistance) {
        current = section;
        nearestDistance = distance;
      }
    });

    if (!current) return;
    const tone = current.dataset.headerTone === 'dark' ? 'dark' : 'light';
    header.dataset.tone = tone;
    header.classList.toggle('header-on-dark', tone === 'dark');
  });
};

const syncNavIndicator = () => {
  const active = nav.querySelector('.nav-link.active');
  if (!active || innerWidth <= 720) return;
  nav.style.setProperty('--nav-indicator-left', `${active.offsetLeft}px`);
  nav.style.setProperty('--nav-indicator-width', `${active.offsetWidth}px`);
};

const syncMobileCurrent = () => {
  const active = nav.querySelector('.nav-link.active');
  if (!active || mobileCurrent.textContent === active.textContent.trim()) return;
  mobileCurrent.classList.add('is-changing');
  setTimeout(() => {
    mobileCurrent.textContent = active.textContent.trim();
    mobileCurrent.classList.remove('is-changing');
  }, reducedMotion ? 0 : 120);
};

const syncNavigation = () => {
  syncMobileCurrent();
  requestAnimationFrame(syncNavIndicator);
};

const placeClosedWaxSeal = () => {
  if (!closedWaxSeal) return;
  const mobile = innerWidth <= 720;
  const naturalWidth = mobile ? 941 : 1672;
  const naturalHeight = mobile ? 1672 : 941;
  const spec = mobile
    ? { cx: 462 / 941, cy: 1102.5 / 1672, width: 336 / 941 }
    : { cx: 822.5 / 1672, cy: 725.5 / 941, width: 309 / 1672 };
  const box = invitationIntro.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const scale = Math.max(box.width / naturalWidth, box.height / naturalHeight);
  const offsetX = (box.width - naturalWidth * scale) / 2;
  const offsetY = mobile ? 0 : (box.height - naturalHeight * scale) / 2;
  closedWaxSeal.style.left = `${(offsetX + spec.cx * naturalWidth * scale).toFixed(1)}px`;
  closedWaxSeal.style.top = `${(offsetY + spec.cy * naturalHeight * scale).toFixed(1)}px`;
  closedWaxSeal.style.width = `${(spec.width * naturalWidth * scale).toFixed(1)}px`;
};

const revealInvitation = ({ replay = false } = {}) => {
  clearInvitationTimers();
  invitationIntro.hidden = false;
  body.classList.add('invitation-active');
  invitationIntro.classList.remove('is-open', 'is-opening', 'is-closing', 'is-returning', 'is-leaving', 'is-preparing', 'is-replaying');
  invitationIntro.setAttribute('aria-hidden', 'false');
  envelopeStage.setAttribute('aria-hidden', 'true');
  requestAnimationFrame(placeClosedWaxSeal);
  const gateOpen = languageGate && !languageGate.classList.contains('is-done');

  if (replay && !reducedMotion) {
    invitationIntro.classList.add('is-preparing');
    void invitationIntro.offsetWidth;
    requestAnimationFrame(() => {
      invitationIntro.classList.remove('is-preparing');
      invitationIntro.classList.add('is-replaying');
    });
    invitationReplayTimer = setTimeout(() => {
      invitationIntro.classList.remove('is-replaying');
      invitationReplayTimer = 0;
    }, 700);
  }

  invitationFocusTimer = setTimeout(() => {
    if (passwordGate && !passwordGate.hidden && passwordGate.classList.contains('is-clearing')) {
      invitationFocusTimer = 0;
      return;
    }
    (gateOpen ? document.querySelector('.language-gate-panel') : openEnvelope)?.focus({ preventScroll: true });
    invitationFocusTimer = 0;
  }, reducedMotion ? 0 : (replay ? 620 : 180));
};

const enterCelebration = () => {
  if (invitationIntro.hidden || invitationIntro.classList.contains('is-leaving')) return;
  clearInvitationTimers();
  invitationIntro.classList.remove('is-opening', 'is-closing', 'is-returning', 'is-preparing', 'is-replaying');
  invitationIntro.classList.add('is-leaving');
  suiteComposite?.classList.remove('is-glow-active', 'is-action-hovered');
  storeValue('wedding-invitation-seen', 'true');
  invitationHideTimer = setTimeout(() => {
    invitationIntro.hidden = true;
    invitationIntro.classList.remove('is-leaving', 'is-open', 'is-opening', 'is-closing', 'is-returning');
    invitationIntro.setAttribute('aria-hidden', 'true');
    body.classList.remove('invitation-active');
    invitationHideTimer = 0;
  }, invitationExitDuration);
};

const closeInvitation = () => {
  if (invitationIntro.hidden || invitationIntro.classList.contains('is-closing')) return;
  if (!invitationIntro.classList.contains('is-open') && !invitationIntro.classList.contains('is-opening')) return;
  clearInvitationTimers();
  invitationIntro.classList.remove('is-opening', 'is-preparing', 'is-replaying');
  invitationIntro.classList.add('is-closing');
  suiteComposite?.classList.remove('is-glow-active', 'is-action-hovered');
  if (reducedMotion) {
    invitationIntro.classList.remove('is-open');
  } else {
    requestAnimationFrame(() => {
      invitationIntro.classList.remove('is-open');
      requestAnimationFrame(() => invitationIntro.classList.add('is-returning'));
    });
  }
  invitationCloseTimer = setTimeout(() => {
    invitationIntro.classList.remove('is-closing', 'is-returning');
    envelopeStage.setAttribute('aria-hidden', 'true');
    openEnvelope.focus({ preventScroll: true });
    invitationCloseTimer = 0;
  }, reducedMotion ? 0 : 760);
};

const keepWebsiteAtTop = () => scrollTo({ top: 0, left: 0, behavior: 'auto' });

const accessGranted = readStoredValue('wedding-admin-access-v1') === 'true';

if (!accessGranted) {
  languageGate?.classList.add('is-done');
  invitationIntro.hidden = false;
  invitationIntro.inert = true;
  invitationIntro.setAttribute('aria-hidden', 'true');
  header.inert = true;
  mainSite.inert = true;
  body.classList.add('invitation-active', 'password-gate-open');
  requestAnimationFrame(placeClosedWaxSeal);
  setTimeout(() => passwordInput?.focus({ preventScroll: true }), reducedMotion ? 0 : 420);
} else {
  passwordGate.hidden = true;
  passwordGate.classList.add('is-done');
  if (readStoredValue('wedding-invitation-seen') === 'true') {
    languageGate?.classList.add('is-done');
    invitationIntro.hidden = true;
    invitationIntro.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('returning-visitor');
  } else {
    body.classList.add('language-gate-open');
    revealInvitation();
  }
}

openEnvelope.addEventListener('click', () => {
  if (invitationIntro.classList.contains('is-open') || invitationIntro.classList.contains('is-opening')) return;
  keepWebsiteAtTop();
  clearTimeout(invitationFocusTimer);
  clearTimeout(invitationReplayTimer);
  invitationIntro.classList.remove('is-preparing', 'is-replaying');
  invitationIntro.classList.add('is-opening');
  envelopeStage.setAttribute('aria-hidden', 'false');
  if (reducedMotion) {
    invitationIntro.classList.add('is-open');
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => invitationIntro.classList.add('is-open'));
    });
  }
  invitationOpenTimer = setTimeout(() => {
    invitationIntro.classList.remove('is-opening');
    enterSite.focus({ preventScroll: true });
    invitationOpenTimer = 0;
  }, reducedMotion ? 0 : (innerWidth <= 720 ? 1120 : 850));
});
openEnvelope.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  openEnvelope.click();
});
enterSite.addEventListener('click', () => {
  keepWebsiteAtTop();
  enterCelebration();
});
introClose.addEventListener('click', closeInvitation);
suiteCards.forEach((card) => card.addEventListener('click', (event) => {
  event.preventDefault();
  const target = document.querySelector(card.getAttribute('href'));
  enterCelebration();
  setTimeout(() => target?.scrollIntoView({ behavior: 'auto', block: 'start' }), invitationTargetDelay);
}));
suiteHoverPieces.forEach((card) => {
  card.addEventListener('pointerenter', () => suiteComposite?.classList.add('is-action-hovered'));
  card.addEventListener('pointerleave', () => {
    suiteComposite?.classList.remove('is-action-hovered');
  });
});

const attachInvitationGlow = (panel) => {
  let targetX = innerWidth / 2, targetY = innerHeight / 2;
  let glowX = targetX, glowY = targetY, glowFrame = 0;
  const settleGlow = () => {
    glowX += (targetX - glowX) * .14;
    glowY += (targetY - glowY) * .14;
    panel.style.setProperty('--invitation-glow-x', `${glowX.toFixed(1)}px`);
    panel.style.setProperty('--invitation-glow-y', `${glowY.toFixed(1)}px`);
    glowFrame = (Math.abs(targetX - glowX) > .35 || Math.abs(targetY - glowY) > .35)
      ? requestAnimationFrame(settleGlow)
      : 0;
  };
  const trackGlow = (event, snap = false) => {
    const bounds = panel.getBoundingClientRect();
    targetX = event.clientX - bounds.left;
    targetY = event.clientY - bounds.top;
    if (snap) { glowX = targetX; glowY = targetY; }
    if (!glowFrame) glowFrame = requestAnimationFrame(settleGlow);
  };
  panel.addEventListener('pointerenter', (event) => {
    trackGlow(event, true);
    panel.classList.add('is-glow-active');
  });
  panel.addEventListener('pointermove', (event) => trackGlow(event));
  panel.addEventListener('pointerleave', () => {
    panel.classList.remove('is-glow-active', 'is-action-hovered');
  });
};
if (suiteComposite && matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion) {
  attachInvitationGlow(suiteComposite);
}
invitationReplay.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (body.classList.contains('invitation-active')) return;
  setMenuOpen(false);
  revealInvitation({ replay: true });
});
animationPreviewTrigger?.addEventListener('click', () => setAnimationPreviewOpen(true));
animationPreviewClose?.addEventListener('click', () => setAnimationPreviewOpen(false));
animationPreview?.addEventListener('click', (event) => {
  if (event.target === animationPreview) setAnimationPreviewOpen(false);
});

menuToggle.addEventListener('click', () => {
  setMenuOpen(!body.classList.contains('menu-open'));
});

skipLink?.addEventListener('click', () => requestAnimationFrame(() => skipLink.blur()));

document.addEventListener('click', (event) => {
  if (!body.classList.contains('menu-open') || header.contains(event.target)) return;
  setMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && body.classList.contains('animation-preview-open')) {
    setAnimationPreviewOpen(false);
    return;
  }
  if (passwordGate && !passwordGate.hidden && !passwordGate.classList.contains('is-done')) {
    if (event.key === 'Escape') passwordInput?.focus({ preventScroll: true });
    return;
  }
  if (event.key === 'Escape' && languageGate && !languageGate.classList.contains('is-done')) {
    dismissLanguageGate();
    return;
  }
  if (event.key === 'Escape' && body.classList.contains('invitation-active')) {
    if (invitationIntro.classList.contains('is-open') || invitationIntro.classList.contains('is-opening')) {
      closeInvitation();
    } else {
      enterCelebration();
    }
    return;
  }
  if (event.key === 'Escape' && body.classList.contains('menu-open')) {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

navLinks.forEach((link) => link.addEventListener('click', (event) => {
  if (!link.hasAttribute('href')) return;
  event.preventDefault();
  const target = document.querySelector(link.getAttribute('href'));
  setMenuOpen(false);
  if (target) {
    const top = target.getBoundingClientRect().top + scrollY - (innerWidth <= 720 ? 82 : 96);
    scrollTo({ top, behavior: reducedMotion || innerWidth <= 720 ? 'auto' : 'smooth' });
    history.replaceState(null, '', link.getAttribute('href'));
  }
}));

const updateScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  const progress = max > 0 ? (scrollY / max) * 100 : 0;
  document.documentElement.style.setProperty('--scroll-progress', `${progress}%`);
  document.documentElement.style.setProperty('--hero-shift', String(Math.min(scrollY, 800)));
  header.classList.toggle('scrolled', scrollY > 35);
  syncHeaderTone();
};
addEventListener('scroll', updateScroll, { passive: true });
addEventListener('resize', syncHeaderTone, { passive: true });
addEventListener('orientationchange', syncHeaderTone);
addEventListener('pageshow', syncHeaderTone);
window.visualViewport?.addEventListener('resize', syncHeaderTone, { passive: true });
document.fonts?.ready.then(syncHeaderTone);
updateScroll();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12, rootMargin: '0px 0px -5% 0px' });

document.querySelectorAll('.reveal, .stagger').forEach((element) => revealObserver.observe(element));
if (reducedMotion) document.querySelectorAll('.reveal, .stagger').forEach((element) => element.classList.add('visible'));

document.querySelectorAll('.accordion').forEach((accordion) => {
  accordion.querySelectorAll('.accordion-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const willOpen = !item.classList.contains('open');
      accordion.querySelectorAll('.accordion-item.open').forEach((openItem) => {
        openItem.classList.remove('open');
        openItem.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
});

// Desktop travel panels follow the pointer; touch and keyboard users retain
// the explicit button interaction above.
const travelHoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
document.querySelectorAll('.travel-section .practical.accordion, .faq .accordion').forEach((accordion) => {
  const closeItem = (item) => {
    item.classList.remove('open');
    item.querySelector('.accordion-trigger')?.setAttribute('aria-expanded', 'false');
  };
  const openItem = (item) => {
    accordion.querySelectorAll('.accordion-item.open').forEach((openSibling) => {
      if (openSibling !== item) closeItem(openSibling);
    });
    item.classList.add('open');
    item.querySelector('.accordion-trigger')?.setAttribute('aria-expanded', 'true');
  };

  // Track the item under the pointer and close on a short grace period, so the
  // overlapping expand/collapse panels can't ping-pong the open state.
  let hovered = null;
  let closeTimer = 0;

  accordion.addEventListener('pointerover', (event) => {
    if (!travelHoverQuery.matches) return;
    const item = event.target.closest('.accordion-item');
    if (!item || !accordion.contains(item)) return;
    hovered = item;
    clearTimeout(closeTimer);
    if (!item.classList.contains('open')) openItem(item);
  });

  accordion.addEventListener('pointerout', (event) => {
    if (!travelHoverQuery.matches) return;
    const item = event.target.closest('.accordion-item');
    if (!item || !accordion.contains(item) || item.contains(event.relatedTarget)) return;
    if (hovered === item) hovered = null;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (hovered !== item && item.classList.contains('open')) closeItem(item);
    }, 180);
  });
});

document.querySelectorAll('.schedule').forEach((schedule) => {
  schedule.querySelectorAll('.schedule-card').forEach((card) => {
    card.addEventListener('click', () => {
      const willOpen = !card.classList.contains('active');
      schedule.querySelectorAll('.schedule-card.active').forEach((openCard) => {
        openCard.classList.remove('active');
        openCard.setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        card.classList.add('active');
        card.setAttribute('aria-expanded', 'true');
      }
    });
  });
});

document.querySelectorAll('.timeline').forEach((timeline) => {
  timeline.querySelectorAll('.timeline-row').forEach((row) => {
    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'button');
    row.setAttribute('aria-expanded', 'false');
    const toggle = () => {
      const willOpen = !row.classList.contains('active');
      timeline.querySelectorAll('.timeline-row.active').forEach((openRow) => {
        openRow.classList.remove('active');
        openRow.setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        row.classList.add('active');
        row.setAttribute('aria-expanded', 'true');
      }
    };
    row.addEventListener('click', toggle);
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  });
});

const uiTranslations = {
  navStory: ['Our story', 'Nuestra historia'], navSchedule: ['Schedule', 'Programa'], navTravel: ['Travel', 'Viaje'], navWelcome: ['Welcome', 'Bienvenida'], navDate: ['The date', 'La fecha'], navDetails: ['Details', 'Detalles'], navCity: ['Explore', 'Explorar'], navCheckIn: ['Check-In', 'Registro'], navAnimation: ['Animation', 'Animación'], animationPreviewTitle: ['Animation', 'Animación'], animationPreviewClose: ['Close animation preview', 'Cerrar vista previa de animación'],
  introKicker: ['The Wedding Of', 'La boda de'], openEnvelope: ['Click to open', 'Haz clic para abrir'], openInvitation: ['Open invitation', 'Abrir invitación'], closeInvitation: ['Return to the closed invitation', 'Volver a la invitación cerrada'], inviteEyebrow: ['With joy', 'Con alegría'], inviteFamily: ['Together with their families', 'Con sus familias'], inviteCopy: ['request the pleasure of your company as they celebrate their marriage.', 'tienen el gusto de invitarlos a celebrar su matrimonio.'], inviteVenue: ['Hotel Piedra Viva<br>Tepoztlán, Morelos · México', 'Hotel Piedra Viva<br>Tepoztlán, Morelos · México'], enterSite: ['Enter our celebration <span aria-hidden="true">→</span>', 'Entrar al sitio <span aria-hidden="true">→</span>'], invitationEnter: ['Enter our celebration', 'Entrar a nuestra celebración'], invitationCheckIn: ['Please check in', 'Confirma tu asistencia'], checkInInvitationAction: ['Please check in on the wedding website', 'Confirma tu asistencia en el sitio de la boda'], enterInvitation: ['Enter the wedding website', 'Entrar al sitio de la boda'], viewGallery: ['See our gallery', 'Ver nuestra galería'], viewGalleryAction: ['View gallery and enter the wedding website', 'Ver la galería y entrar al sitio de la boda'], viewInvitation: ['Invitation', 'Invitación'], skipToContent: ['Skip to content', 'Ir al contenido'], partyPlaceholder: ['Names of everyone in your party', 'Nombres de todos los asistentes'],
  heroEyebrow: ['The wedding of', 'La boda de'],
  heroQuote: ['Among mountains, flowers and light,<br>we celebrate our love.', 'Entre montañas, flores y luz,<br>celebramos nuestro amor.'],
  confirmAttendance: ['Confirm attendance', 'Confirmar asistencia'], seeDay: ['See the day', 'Ver el programa'],
  arrivalTitle: ['Guest arrival', 'Llegada de invitados'], arrivalDesc: ['Welcome drinks and a little time to settle into the gardens.', 'Bebidas de bienvenida y un rato para disfrutar los jardines.'],
  ceremonyTitle: ['Ceremony', 'Ceremonia'], ceremonyDesc: ['Join us outdoors as we exchange vows beneath the mountains.', 'Acompáñennos al aire libre para intercambiar nuestros votos frente a las montañas.'],
  cocktailTitle: ['Cocktail Hour', 'Hora del cóctel'], cocktailDesc: ['Cocktails and music in the courtyard.', 'Cócteles y música en el patio.'],
  receptionTitle: ['Reception', 'Recepción'], receptionDesc: ['Find your table and raise a glass as the evening begins.', 'Busquen su mesa y brinden con nosotros para comenzar la noche.'],
  dinnerTitle: ['Dinner', 'Cena'], dinnerDesc: ['A candlelit meal inspired by the flavours of Mexico.', 'Una cena a la luz de las velas inspirada en los sabores de México.'],
  partyTitle: ['Party', 'Fiesta'], partyDesc: ['Meet us on the dance floor and stay as long as you can.', 'Nos vemos en la pista de baile. Quédense todo lo que puedan.'],
  antojitosDesc: ['A late-night Mexican snack before one last dance.', 'Antojitos de madrugada antes del último baile.'],
  finDesc: ['Carriages, hugs and a very happy goodnight.', 'Abrazos y buenas noches.'],
  travelWeddingDay: ['Wedding day', 'Día de la boda'],
  travelWeddingDayCopy: ['Our ceremony will begin at 2:45 PM at La Cascada. Please arrive at 2:00 PM. After we say “I do,” we’ll gather for cocktail hour before moving inside for dinner, speeches, and dancing the night away.', 'La ceremonia comienza a las 2:45 PM en La Cascada. Les pedimos llegar a las 2:00 PM. Después del “sí, acepto” nos reuniremos para la hora del cóctel. Luego pasaremos a la cena, los discursos y el baile.'],
  travelAccommodation: ['Accommodation', 'Estancia'],
  travelAccommodationCopy: ['Hotel Piedra Viva is a 1.5-hour drive from Mexico City. We recommend staying at the hotel; rooms are limited, so close family will be given priority.', 'Hotel Piedra Viva está a una hora y media de la Ciudad de México. Recomendamos hospedarse ahí. Hay pocas habitaciones, así que daremos prioridad a la familia cercana.'],
  travelAccommodationMore: ['$2,250 MXN per night for two (about $180 CAD); a 3rd or 4th guest in a double suite is $850 MXN each. Tepoztlán also has lovely boutique hotels nearby.', '$2,250 MXN por noche para dos personas. La tercera o cuarta persona en una suite doble paga $850 MXN. También hay buenos hoteles boutique cerca.'],
  travelTransport: ['Transport', 'Transporte'],
  travelTransportAirport: ['<strong>Airport</strong><br>Benito Juárez International (MEX).', '<strong>Aeropuerto</strong><br>Aeropuerto Internacional Benito Juárez (MEX).'],
  travelTransportCity: ['<strong>Mexico City to Tepoztlán</strong><br>About 1.5 hours by private transfer, taxi, rideshare or rental car.', '<strong>CDMX a Tepoztlán</strong><br>Aproximadamente una hora y media en traslado privado, taxi, Uber o auto rentado.'],
  travelTransportLocal: ['<strong>Tepoztlán to venue</strong><br>The town and nearby hotels are close by; taxis and rideshares are the easiest way over.', '<strong>Tepoztlán al hotel</strong><br>El centro y los hoteles cercanos quedan a poca distancia. Lo más fácil es tomar un taxi o Uber.'],
  travelTransportParking: ['<strong>Parking</strong><br>Complimentary at Hotel Piedra Viva.', '<strong>Estacionamiento</strong><br>Gratuito en Hotel Piedra Viva.'],
  travelWeather: ['Weather', 'Clima'],
  travelWeatherCopy: ['Dry and comfortable, with warm afternoons and cool evenings. Bring a light layer for after sunset.', 'Días cálidos, noches frescas y poca lluvia. Traigan algo ligero para abrigarse después del atardecer.'],
  cityTab: ['Mexico City', 'Ciudad de México'], tepoztlanTab: ['Tepoztlán', 'Tepoztlán'],
  cityIntro: ['We’ve chosen our wedding dates to fall just after Día de los Muertos (November 1st), one of Mexico’s most meaningful and beautiful celebrations. If you are able, we would love for you to celebrate this day with us in Mexico City.', 'Elegimos una fecha justo después del Día de Muertos, el 1 de noviembre, una de las celebraciones más importantes de México. Si pueden llegar antes, nos encantaría compartir esos días con ustedes en la Ciudad de México.'],
  cityStay: ["For accommodation, we recommend staying in Roma Norte, Condesa, Reforma, or Centro Histórico, all well-located and easy to explore. Don't hesitate to contact us for more tips.", 'Recomendamos hospedarse en Roma Norte, Condesa, Reforma o Centro Histórico. Son zonas bien ubicadas y fáciles de recorrer. Escríbannos si quieren más recomendaciones.'],
  cityMap: ['See on map <span aria-hidden="true">↗</span>', 'Ver en el mapa <span aria-hidden="true">↗</span>'],
  tepoztlanTitle: ['Things to do<br>in <em>Tepoztlán</em>.', 'Qué hacer<br>en <em>Tepoztlán</em>.'],
  tepoztlanIntro: ['Tepoztlán was an important part of Valeria’s childhood—a place where she hiked with her dad and spent time with her family. Wander through the plaza or hike El Tepozteco to experience it for yourself.', 'Tepoztlán fue una parte importante de la infancia de Valeria: aquí caminaba por el cerro con su papá y pasaba tiempo con su familia. Recorran la plaza o suban al Tepozteco para conocerlo.'],
  tepoztlanStay: ['Spend some time wandering through the market, stop by the Ex-Convento de la Natividad, or hike up El Tepozteco if you’re feeling adventurous. There are also lots of great little cafés and places to eat along the way.', 'Dense una vuelta por el mercado, visiten el Ex Convento de la Natividad o suban al Tepozteco si tienen ganas de caminar. También hay muchos cafés y buenos lugares para comer.'],
  tepoztlanMapNote: ['Use the map to begin exploring the town and the places surrounding our venue.', 'Usen el mapa para explorar el pueblo y los lugares cercanos al hotel.'],
  tepoztlanMap: ['See on map <span aria-hidden="true">↗</span>', 'Ver en el mapa <span aria-hidden="true">↗</span>'],
  romaLabel: ['Roma Norte', 'Roma Norte'], romaCaption: ['Leafy streets, galleries and cafés', 'Calles arboladas, galerías y cafés'], bellasLabel: ['Bellas Artes', 'Bellas Artes'], bellasCaption: ['Architecture, murals and golden light', 'Arquitectura, murales y luz dorada'],
  conventLabel: ['The Ex-Convent', 'El Ex Convento'], conventCaption: ['Stone courtyards and centuries of history', 'Patios de piedra y siglos de historia'], ridgeLabel: ['The Tepozteco', 'El Tepozteco'], ridgeCaption: ['Dramatic mountains above the town', 'Montañas imponentes sobre el pueblo'],
  ofrendaCopy: ['We kindly invite you to bring a small framed photo of a loved one who is no longer with us. In keeping with tradition, we will be preparing an <em>ofrenda</em> to honour and remember those who remain in our hearts.', 'Los invitamos a traer una foto pequeña y enmarcada de un ser querido que ya no esté con nosotros. Prepararemos una <em>ofrenda</em> para recordarlos y tenerlos presentes.'],
  giftSummary: ['Celebrating with you is more than enough.', 'Celebrar con ustedes es más que suficiente.'],
  giftDetails: ['Gift details', 'Detalles del regalo'],
  giftCopy: ['If you would still like to give something, you are welcome to contribute toward our future. Canadian guests may send an e-transfer to valeriaandseanharrigan@gmail.com. Electronic transfers are preferred to cash, but please know there is absolutely no expectation.', 'Si aun así desean hacernos un regalo, pueden hacer una aportación para nuestro futuro. Para los invitados en México, compartiremos los datos de transferencia más cerca de la fecha. Preferimos transferencias en lugar de efectivo, pero no hay ninguna expectativa.'],
  alcoholQuestion: ['Can I bring my own alcohol?', '¿Puedo traer mi propio alcohol?'],
  alcoholAnswer: ['No need! We’ll have an open bar throughout the celebration. Please note that the hotel does not allow outside alcohol. Just bring your best energy and get ready to celebrate!', 'No hace falta. Habrá barra libre durante toda la celebración y el hotel no permite ingresar bebidas. Solo vengan con ganas de celebrar.'],
  welcomeCopy: ['We are delighted to welcome you <br>to our wedding website. Here, you will <br>find all the essential details for our special day.', 'Nos da mucho gusto recibirlos <br>en nuestra página. Aquí encontrarán <br>todo lo necesario para nuestro gran día.'],
  cityMapNote: ['Please click on the map below to explore some of our favourite places in the City.', 'Usen el mapa para conocer algunos de nuestros lugares favoritos en la ciudad.'],
  dressCopy: ['Formal attire encouraged, fall colours welcomed. Feel free to wear whatever makes you feel comfortable.', 'Sugerimos vestimenta formal y colores de otoño. Lo más importante es que se sientan cómodos.'],
  faqGuestAnswer: ['Please refer to the names listed on your invitation. Reach out to Sean or Valeria if anything is unclear.', 'Revisen los nombres indicados en su invitación. Si tienen alguna duda, escríbannos.'],
  faqChildrenAnswer: ['Please follow the names on your invitation, or contact us directly with any questions.', 'La invitación indica quiénes están incluidos. Si tienen alguna duda, escríbannos.'],
  faqArrivalAnswer: ['We recommend arriving in Mexico City by October 31 and travelling to Tepoztlán on November 2. Guest arrival at the venue begins at 2:00 PM on November 3.', 'Recomendamos llegar a la Ciudad de México a más tardar el 31 de octubre y viajar a Tepoztlán el 2 de noviembre. El 3 de noviembre los esperamos en el hotel a partir de las 2:00 PM.'],
  faqIndoorsAnswer: ['The ceremony begins outdoors. Dinner and dancing follow inside; bring a light layer for the cool evening.', 'La ceremonia será al aire libre. La cena y el baile serán adentro. Traigan algo ligero para abrigarse por la noche.'],
  faqLocalTransportAnswer: ['Taxis and rideshare services are the simplest options between local accommodation and Hotel Piedra Viva. Complimentary parking is available at the venue.', 'Lo más fácil para moverse entre los hoteles y Piedra Viva es tomar un taxi o Uber. El hotel cuenta con estacionamiento gratuito.'],
  faqKicker: ['Good to know', 'Información útil'], faqTitle: ['Frequently asked<br><em>Questions</em>.', 'Preguntas<br><em>Frecuentes</em>.'], faqGuestQuestion: ['Can I bring a guest?', '¿Puedo llevar acompañante?'], faqChildrenQuestion: ['Are children invited?', '¿Están invitados los niños?'], faqArrivalQuestion: ['When should I arrive?', '¿Cuándo debo llegar?'], faqIndoorsQuestion: ['Is the celebration indoors or outdoors?', '¿La celebración es interior o exterior?'], faqLocalTransportQuestion: ['How should I get around Tepoztlán?', '¿Cómo debo moverme en Tepoztlán?'], faqContactQuestion: ['Who can I contact?', '¿A quién puedo contactar?'],
  welcomeTitle: ['Welcome', 'Bienvenidos'],
  saveEyebrow: ['Our wedding day', 'El día de nuestra boda'], saveWord: ['Save', 'Reserva'], theWord: ['The', 'La'], dateWord: ['Date', 'Fecha'], saveDate: ['Tuesday, November 3, 2026', 'Martes, 3 de noviembre de 2026'], saveDateCopy: ['Our ceremony begins at 2:45 PM at La Cascada. Please arrive at 2:00 PM. After we say “I do,” we’ll gather for cocktail hour before moving inside for dinner, speeches, and dancing the night away.', 'La ceremonia comienza a las 2:45 PM en La Cascada. Les pedimos llegar a las 2:00 PM. Después del “sí, acepto” nos reuniremos para la hora del cóctel. Luego pasaremos a la cena, los discursos y el baile.'],
  detailsKicker: ['The gathering', 'El encuentro'], detailsTitle: ['Wedding details', 'Detalles de la boda'], venueTitle: ['Venue', 'Lugar'], openMap: ['Open map', 'Abrir mapa'], dressTitle: ['Dress code', 'Código de vestimenta'], formalAttire: ['Formal attire', 'Vestimenta formal'], programEyebrow: ['The order of the day', 'El orden del día'], celebrationTitle: ['Celebration', 'Celebración'],
  travelKicker: ['The journey', 'El viaje'], travelTitle: ['Travel', 'Viaje'], browseHotels: ['Browse hotels', 'Ver hoteles'],
  travelSubline: ['For those travelling from afar', 'Para quienes viajan desde lejos'], chapterSchedule: ['Schedule', 'Itinerario'], monthOct: ['Oct', 'Oct'], monthNov: ['Nov', 'Nov'],
  hoodRoma: ['Leafy streets, cafés and galleries. Lively and central; a little noisy on weekends.', 'Calles arboladas, cafés y galerías. Animada y céntrica; algo ruidosa los fines de semana.'], hoodCondesa: ['Art-deco blocks around two parks, great restaurants. Calmer evenings, slightly further from the centre.', 'Edificios art déco alrededor de dos parques y muy buenos restaurantes. Noches más tranquilas, un poco más lejos del centro.'], hoodReforma: ['Modern, polished and lined with large hotels. More corporate in feel and farther from Centro Histórico.', 'Moderna, elegante y con hoteles grandes. Tiene un ambiente más corporativo y queda más lejos del Centro Histórico.'], hoodCentro: ['The Zócalo, Bellas Artes and major museums are on your doorstep. Historic, atmospheric and home to many older hotels; scenes from 007: Spectre were filmed here.', 'El Zócalo, Bellas Artes y los principales museos quedan a un paso. Es histórico, lleno de ambiente y tiene muchos hoteles antiguos; aquí se filmaron escenas de 007: Spectre.'],
  cityArriving: ['Arriving', 'Llegada'], cityStayTitle: ['Where to stay', 'Dónde hospedarse'], tepoztlanKicker: ['Things to do in', 'Qué hacer en'], weatherDays: ['Day', 'Día'], weatherNights: ['Night', 'Noche'],
  cityEyebrow: ['Explore Mexico with us', 'Explora México con nosotros'], cityTitle: ['Things to do<br>in the <em>City</em>.', 'Qué hacer<br>en la <em>Ciudad</em>.'],
  specialSharedTitle: ['<span>Special</span> <em>Request</em>', '<span>Petición</span> <em>Especial</em>'], specialTitle: ['For those who remain in spirit.', 'Para quienes siguen con nosotros en espíritu.'], giftsTitle: ['Your presence is our gift.', 'Su presencia es nuestro mejor regalo.'],
  weekTitle: ['A week<br>in <em>México</em>.', 'Una semana<br>en <em>México</em>.'], weekBrief: ['Arrive early, stay a little longer, and make the celebration part of a beautiful week away.', 'Lleguen antes, quédense unos días y disfruten una semana completa en México.'],
  weekArrival: ['Arrive in Mexico City', 'Llegada a la Ciudad de México'], weekArrivalCopy: ['Land in the capital, settle in and begin your Mexico City adventure.', 'Lleguen, instálense y empiecen a recorrer la ciudad.'], weekMuertos: ['Día de Muertos parade', 'Desfile de Día de Muertos'], weekMuertosCopy: ['Experience the city in its most luminous season—marigolds, music and remembrance.', 'Disfruten la ciudad entre cempasúchil, música y recuerdos.'], weekTravel: ['Travel to Tepoztlán', 'Viaje a Tepoztlán'], weekTravelCopy: ['Head south into the mountains; the journey from Mexico City is roughly ninety minutes.', 'El viaje desde la Ciudad de México dura aproximadamente noventa minutos.'], weekWedding: ['Wedding day', 'Día de la boda'], weekWeddingCopy: ['Gather with us at Hotel Piedra Viva for an afternoon and evening under the Tepozteco.', 'Pasen la tarde y la noche con nosotros en Hotel Piedra Viva, al pie del Tepozteco.'], weekPool: ['Pool day or hike', 'Día de alberca o caminata'], weekPoolCopy: ['Keep the day unhurried—cool off by the pool or take in the panoramic mountain trail.', 'Tómense el día con calma: alberca o caminata por la montaña.'], weekReturn: ['Return to Mexico City', 'Regreso a la Ciudad de México'], weekReturnCopy: ['Travel back to the city with a little time left for one last coffee or market visit.', 'Regresen a la ciudad con tiempo para un último café o una visita al mercado.'],
  countdownTitle: ['<em>The</em> <span>Countdown</span>', '<em>La</em> <span>cuenta regresiva</span>'],
  checkInKicker: ['Your journey', 'Su viaje'], checkInTitle: ['<span>Check</span>-<em>In</em>', '<span>Registro</span>'], checkInIntro: ['Share your travel dates and accommodation details so we know when and where to expect you.', 'Compartan sus fechas y datos de hospedaje para saber cuándo y dónde esperarlos.'], partyLabel: ['Who is coming?', '¿Quiénes vienen?'], arrivalDateLabel: ['Arrival date', 'Fecha de llegada'], departureDateLabel: ['Departure date', 'Fecha de salida'], mexicoCityAccommodationLabel: ['Mexico City neighbourhood', 'Colonia en Ciudad de México'], chooseNeighbourhood: ['Choose a neighbourhood', 'Elige una colonia'], otherOption: ['Other', 'Otro'], otherNeighbourhoodLabel: ['Other neighbourhood', 'Otra colonia'], otherNeighbourhoodPlaceholder: ['Enter neighbourhood', 'Escribe la colonia'], tepoztlanCheckInLabel: ['Tepoztlán check-in', 'Entrada en Tepoztlán'], tepoztlanCheckOutLabel: ['Tepoztlán check-out', 'Salida de Tepoztlán'], tepoztlanLocationLabel: ['Tepoztlán accommodation', 'Hospedaje en Tepoztlán'], chooseTepoztlanLocation: ['Choose accommodation', 'Elige el hospedaje'], otherTepoztlanLabel: ['Other accommodation', 'Otro hospedaje'], otherTepoztlanPlaceholder: ['Enter hotel or accommodation', 'Escribe el hotel o alojamiento'], checkInSubmit: ['Prepare Check-In email <span aria-hidden="true">→</span>', 'Preparar correo de confirmación <span aria-hidden="true">→</span>'], checkInThanksKicker: ['Gracias', 'Gracias'], checkInThanksTitle: ['Thank you.', 'Gracias.'], checkInThanksCopy: ['This helps us make everyone’s arrival feel easy and well looked after.', 'Esto nos ayuda a que la llegada de todos sea más fácil y cuidada.'], checkInThanksEmail: ['Your Check-In email is ready to send.', 'Tu correo de registro está listo para enviar.'], closingTitle: ['We cannot wait<br>to celebrate together.', 'Ya queremos<br>celebrar juntos.']
};

const phraseTranslations = new Map(Object.entries({
  'Welcome':'Bienvenidos','Hand in hand, a new chapter.':'De la mano, un nuevo capítulo.',
  'It is our delight to welcome you to our wedding celebration. We cannot wait to gather with the people we love most in the mountains of Tepoztlán.':'Nos da mucho gusto darles la bienvenida a nuestra boda. Ya queremos reunirnos con las personas que más queremos en Tepoztlán.',
  'Please join us before God on Tuesday, November 3, 2026, at Hotel Piedra Viva.':'Acompáñennos el martes 3 de noviembre de 2026 en Hotel Piedra Viva.',
  'Discover Tepoztlán':'Descubrir Tepoztlán','Tuesday · November 3':'Martes · 3 de noviembre','The celebration':'La celebración',
  'A mountain town of stone, colour and history—held beneath the dramatic Tepozteco ridge and filled with markets, gardens and centuries-old architecture.':'Tepoztlán es un pueblo de montaña lleno de color, mercados, jardines y edificios antiguos.',
  'The town':'El pueblo','The mountains':'Las montañas','Earth & flowers':'Tierra y flores','Our palette':'Nuestra paleta',
  'Getting there & staying.':'Cómo llegar y dónde hospedarse.','Venue':'Lugar','Getting there':'Cómo llegar','Where to stay':'Dónde hospedarse','Local transport':'Transporte local','November weather':'Clima en noviembre','Browse hotels':'Ver hoteles','Open map':'Abrir mapa',
  'For those travelling afar':'Para quienes viajan desde lejos','A week in Mexico.':'Una semana en México.','View our city map':'Ver nuestro mapa','Arrive in Mexico City':'Llegada a Ciudad de México','Día de Muertos parade':'Desfile de Día de Muertos','Travel to Tepoztlán':'Viaje a Tepoztlán','Wedding day':'Día de la boda','Pool day or hike Tepozteco':'Día de alberca o caminata al Tepozteco','Return to Mexico City':'Regreso a Ciudad de México',
  'What to wear':'Código de vestimenta','Formal attire, fall colours.':'Vestimenta formal, colores de otoño.','Formal attire is encouraged and warm autumn tones are welcomed. Above all, wear whatever makes you feel comfortable and beautiful.':'Sugerimos vestimenta formal y tonos cálidos de otoño. Lo más importante es que se sientan cómodos.','Sun-washed colour':'Colores cálidos','Terracotta & ivory':'Terracota y marfil','Candlelit gold':'Dorado a la luz de las velas','Olive & cream':'Olivo y crema',
  'A special request':'Una petición especial','For those who remain in spirit.':'Para quienes siguen con nosotros en espíritu.','Gifts':'Regalos','Your presence is our gift.':'Su presencia es nuestro mejor regalo.','Contact us':'Escríbannos',
  'Good to know':'Información útil','Frequently asked questions.':'Preguntas frecuentes.','Can I bring a guest?':'¿Puedo llevar un acompañante?','Are children invited?':'¿Están invitados los niños?','When should I arrive?':'¿Cuándo debo llegar?','Is the celebration indoors or outdoors?':'¿La celebración es interior o exterior?','Will transportation be provided?':'¿Habrá transporte?','Who can I contact?':'¿A quién puedo contactar?',
  'Gracias':'Gracias','We cannot wait to celebrate together.':'Ya queremos celebrar juntos.','Until we say I do':'Falta poco','Days':'Días','Hours':'Horas','Minutes':'Minutos','Seconds':'Segundos'
}));

const normalizeText = (value) => value.replace(/\s+/g, ' ').trim();
const translatedElements = [...document.querySelectorAll('p,h2,h3,a,label,figcaption,span,strong')]
  .map((element) => ({ element, key: normalizeText(element.textContent), english: element.innerHTML }))
  .filter((item) => phraseTranslations.has(item.key));

const storedLanguage = readStoredValue('wedding-language');
const browserLocale = `${navigator.language || ''} ${Intl.DateTimeFormat().resolvedOptions().timeZone || ''}`;
let currentLanguage = storedLanguage === 'es' || storedLanguage === 'en'
  ? storedLanguage
  : (/\bes(?:-|\b)|Mexico/i.test(browserLocale) ? 'es' : 'en');
const renderLanguage = (language) => {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const pair = uiTranslations[element.dataset.i18n];
    if (pair) element.innerHTML = pair[language === 'es' ? 1 : 0];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const pair = uiTranslations[element.dataset.i18nPlaceholder];
    if (pair) element.placeholder = pair[language === 'es' ? 1 : 0];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
    const pair = uiTranslations[element.dataset.i18nAria];
    if (pair) element.setAttribute('aria-label', pair[language === 'es' ? 1 : 0]);
  });
  translatedElements.forEach(({ element, key, english }) => {
    element.innerHTML = language === 'es' ? phraseTranslations.get(key) : english;
  });
  languageToggle.querySelector('.language-current').textContent = language.toUpperCase();
  languageToggle.querySelector('.language-next').textContent = language === 'en' ? 'ES' : 'EN';
  languageToggle.setAttribute('aria-label', language === 'en' ? 'Cambiar a español' : 'Switch to English');
  introLanguageToggle.querySelector('.language-current').textContent = language.toUpperCase();
  introLanguageToggle.querySelector('.language-next').textContent = language === 'en' ? 'ES' : 'EN';
  introLanguageToggle.setAttribute('aria-label', language === 'en' ? 'Choose language / Elegir idioma' : 'Elegir idioma / Choose language');
  menuToggle.setAttribute('aria-label', language === 'es' ? 'Abrir menú' : 'Open navigation');
  storeValue('wedding-language', language);
  syncNavigation();
  requestAnimationFrame(() => { if (typeof placeSuiteHotspots === 'function') placeSuiteHotspots(); });
  document.dispatchEvent(new CustomEvent('wedding:languagechange', { detail: language }));
};

// The header's EN/ES and the envelope's discreet control both open the frosted language gate.
const openLanguageGate = () => {
  if (!languageGate) return;
  setMenuOpen(false);
  languageGate.classList.remove('is-clearing');
  languageGate.classList.remove('is-done');
  languageGate.classList.add('is-optional');
  body.classList.add('language-gate-open');
  setTimeout(() => document.querySelector('.language-gate-panel')?.focus({ preventScroll: true }), reducedMotion ? 0 : 350);
};
const dismissLanguageGate = () => {
  if (!languageGate || languageGate.classList.contains('is-done')) return;
  if (!languageGate.classList.contains('is-optional')) return;
  languageGate.classList.add('is-done');
  languageGate.classList.remove('is-optional', 'is-lens-active');
  body.classList.remove('language-gate-open');
};
languageToggle.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  openLanguageGate();
});
introLanguageToggle.addEventListener('click', openLanguageGate);
languageGate?.addEventListener('click', (event) => {
  if (event.target.closest('.language-gate-option')) return;
  dismissLanguageGate();
});
renderLanguage(currentLanguage);

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const key = visible.target.dataset.nav;
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${key}`));
  syncNavigation();
}, { rootMargin: '-25% 0px -55% 0px', threshold: [0, .2, .5] });

document.querySelectorAll('[data-nav]').forEach((section) => sectionObserver.observe(section));
addEventListener('resize', () => {
  syncNavigation();
  syncHeaderTone();
});
syncNavigation();
syncHeaderTone();

const checkInForm = document.getElementById('check-in-form');
const checkInFormContent = checkInForm?.querySelector('.check-in-form-content');
const checkInThanks = document.getElementById('check-in-thanks');
const setupConditionalAccommodation = (selectId, fieldId, inputId) => {
  const select = document.getElementById(selectId);
  const field = document.getElementById(fieldId);
  const input = document.getElementById(inputId);
  if (!select || !field || !input) return;

  const sync = () => {
    const isOther = select.value === 'Other';
    field.hidden = !isOther;
    input.disabled = !isOther;
    input.required = isOther;
    select.setAttribute('aria-expanded', String(isOther));
    if (!isOther) input.value = '';
    if (isOther) requestAnimationFrame(() => input.focus({ preventScroll: true }));
  };

  select.addEventListener('change', sync);
  sync();
};

setupConditionalAccommodation('mexico-city-neighbourhood', 'mexico-city-neighbourhood-other-field', 'mexico-city-neighbourhood-other');
setupConditionalAccommodation('tepoztlan-location', 'tepoztlan-location-other-field', 'tepoztlan-location-other');

// Desktop browsers do not expose the native date popover for visual styling,
// so the form uses a small paper-toned calendar there and keeps the familiar
// native date control on phones.
const desktopDateMedia = matchMedia('(min-width: 721px)');
const datePickerInstances = [];
let openDatePicker = null;
const parseCalendarDate = (isoDate) => {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};
const calendarIso = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0')
].join('-');
const closeDatePicker = (instance) => {
  if (!instance) return;
  instance.panel.hidden = true;
  instance.input.setAttribute('aria-expanded', 'false');
  instance.trigger.setAttribute('aria-expanded', 'false');
  if (openDatePicker === instance) openDatePicker = null;
};
const renderDatePicker = (instance) => {
  const { input, panel, title, days, previous, next, minDate, maxDate } = instance;
  const language = currentLanguage === 'es' ? 'es-MX' : 'en-CA';
  const year = instance.visibleMonth.getFullYear();
  const month = instance.visibleMonth.getMonth();
  const selected = parseCalendarDate(input.value);
  const monthNumber = (date) => date.getFullYear() * 12 + date.getMonth();

  title.textContent = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(instance.visibleMonth);
  previous.disabled = monthNumber(instance.visibleMonth) <= monthNumber(minDate);
  next.disabled = monthNumber(instance.visibleMonth) >= monthNumber(maxDate);
  days.replaceChildren();

  const weekdayLabels = currentLanguage === 'es'
    ? ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  weekdayLabels.forEach((label) => {
    const weekday = document.createElement('span');
    weekday.className = 'date-picker-weekday';
    weekday.textContent = label;
    days.append(weekday);
  });

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let cell = 0; cell < 42; cell += 1) {
    const dayNumber = cell - firstWeekday + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      const blank = document.createElement('span');
      blank.className = 'date-picker-blank';
      days.append(blank);
      continue;
    }

    const date = new Date(year, month, dayNumber, 12);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'date-picker-day';
    button.textContent = String(dayNumber);
    button.disabled = date < minDate || date > maxDate;
    button.setAttribute('aria-label', new Intl.DateTimeFormat(language, { dateStyle: 'long' }).format(date));
    if (selected && calendarIso(selected) === calendarIso(date)) {
      button.classList.add('is-selected');
      button.setAttribute('aria-current', 'date');
    }
    button.addEventListener('click', () => {
      input.value = calendarIso(date);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      closeDatePicker(instance);
      input.focus({ preventScroll: true });
    });
    days.append(button);
  }
};
const openDesktopDatePicker = (instance) => {
  if (!desktopDateMedia.matches) return;
  if (openDatePicker && openDatePicker !== instance) closeDatePicker(openDatePicker);
  const selected = parseCalendarDate(instance.input.value);
  instance.visibleMonth = selected
    ? new Date(selected.getFullYear(), selected.getMonth(), 1, 12)
    : new Date(instance.minDate.getFullYear(), instance.minDate.getMonth(), 1, 12);
  renderDatePicker(instance);
  instance.panel.hidden = false;
  instance.input.setAttribute('aria-expanded', 'true');
  instance.trigger.setAttribute('aria-expanded', 'true');
  openDatePicker = instance;
};

document.querySelectorAll('.check-in-card input[type="date"]').forEach((input) => {
  const field = input.closest('.field');
  const shell = document.createElement('div');
  const trigger = document.createElement('button');
  const panel = document.createElement('div');
  const header = document.createElement('div');
  const previous = document.createElement('button');
  const title = document.createElement('strong');
  const next = document.createElement('button');
  const days = document.createElement('div');
  const minDate = parseCalendarDate(input.min);
  const maxDate = parseCalendarDate(input.max);

  shell.className = 'date-input-shell';
  trigger.type = 'button';
  trigger.className = 'date-picker-trigger';
  trigger.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12.5" rx="2"></rect><path d="M6.5 2.8v3.4M13.5 2.8v3.4M3 8h14"></path></svg>';
  trigger.setAttribute('aria-label', currentLanguage === 'es' ? 'Elegir fecha' : 'Choose date');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  panel.className = 'date-picker-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', currentLanguage === 'es' ? 'Elegir fecha' : 'Choose date');
  panel.hidden = true;
  header.className = 'date-picker-header';
  previous.type = 'button';
  previous.className = 'date-picker-nav';
  previous.innerHTML = '<span aria-hidden="true">←</span>';
  previous.setAttribute('aria-label', currentLanguage === 'es' ? 'Mes anterior' : 'Previous month');
  next.type = 'button';
  next.className = 'date-picker-nav';
  next.innerHTML = '<span aria-hidden="true">→</span>';
  next.setAttribute('aria-label', currentLanguage === 'es' ? 'Mes siguiente' : 'Next month');
  days.className = 'date-picker-days';
  header.append(previous, title, next);
  panel.append(header, days);
  input.parentNode.insertBefore(shell, input);
  shell.append(input, trigger, panel);
  field.classList.add('date-field');
  if (input.id === 'departure-date' || input.id === 'tepoztlan-check-out') field.classList.add('date-field--align-right');

  const instance = { input, trigger, panel, title, days, previous, next, minDate, maxDate, visibleMonth: minDate };
  datePickerInstances.push(instance);
  trigger.addEventListener('click', () => panel.hidden ? openDesktopDatePicker(instance) : closeDatePicker(instance));
  input.addEventListener('click', () => openDesktopDatePicker(instance));
  previous.addEventListener('click', () => {
    instance.visibleMonth = new Date(instance.visibleMonth.getFullYear(), instance.visibleMonth.getMonth() - 1, 1, 12);
    renderDatePicker(instance);
  });
  next.addEventListener('click', () => {
    instance.visibleMonth = new Date(instance.visibleMonth.getFullYear(), instance.visibleMonth.getMonth() + 1, 1, 12);
    renderDatePicker(instance);
  });
});

const syncDatePickerMode = () => {
  datePickerInstances.forEach((instance) => {
    closeDatePicker(instance);
    instance.input.type = desktopDateMedia.matches ? 'text' : 'date';
    instance.input.readOnly = desktopDateMedia.matches;
    instance.input.setAttribute('aria-haspopup', desktopDateMedia.matches ? 'dialog' : 'false');
    instance.trigger.hidden = !desktopDateMedia.matches;
  });
};
desktopDateMedia.addEventListener('change', syncDatePickerMode);
syncDatePickerMode();
document.addEventListener('pointerdown', (event) => {
  if (openDatePicker && !event.target.closest('.date-field')) closeDatePicker(openDatePicker);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && openDatePicker) closeDatePicker(openDatePicker);
});
document.addEventListener('wedding:languagechange', () => {
  datePickerInstances.forEach((instance) => {
    const spanish = currentLanguage === 'es';
    instance.trigger.setAttribute('aria-label', spanish ? 'Elegir fecha' : 'Choose date');
    instance.panel.setAttribute('aria-label', spanish ? 'Elegir fecha' : 'Choose date');
    instance.previous.setAttribute('aria-label', spanish ? 'Mes anterior' : 'Previous month');
    instance.next.setAttribute('aria-label', spanish ? 'Mes siguiente' : 'Next month');
    if (!instance.panel.hidden) renderDatePicker(instance);
  });
});

checkInForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const party = data.get('party');
  const arrival = data.get('arrival');
  const departure = data.get('departure');
  const mexicoCityNeighbourhoodChoice = data.get('mexicoCityNeighbourhood');
  const mexicoCityNeighbourhood = mexicoCityNeighbourhoodChoice === 'Other'
    ? data.get('mexicoCityNeighbourhoodOther')
    : mexicoCityNeighbourhoodChoice;
  const tepoztlanCheckIn = data.get('tepoztlanCheckIn');
  const tepoztlanCheckOut = data.get('tepoztlanCheckOut');
  const tepoztlanLocationChoice = data.get('tepoztlanLocation');
  const tepoztlanLocation = tepoztlanLocationChoice === 'Other'
    ? data.get('tepoztlanLocationOther')
    : tepoztlanLocationChoice;
  const spanish = currentLanguage === 'es';
  const subject = encodeURIComponent(spanish ? `Confirmación de boda — ${party}` : `Wedding Check-In — ${party}`);
  const message = encodeURIComponent(spanish
    ? `Asistentes: ${party}\nLlegada: ${arrival}\nSalida: ${departure}\nHospedaje en Ciudad de México — colonia: ${mexicoCityNeighbourhood}\nEntrada en Tepoztlán: ${tepoztlanCheckIn}\nSalida de Tepoztlán: ${tepoztlanCheckOut}\nHospedaje en Tepoztlán: ${tepoztlanLocation}`
    : `Who is coming: ${party}\nArrival date: ${arrival}\nDeparture date: ${departure}\nMexico City neighbourhood: ${mexicoCityNeighbourhood}\nTepoztlán check-in: ${tepoztlanCheckIn}\nTepoztlán check-out: ${tepoztlanCheckOut}\nTepoztlán location: ${tepoztlanLocation}`);
  const mailtoUrl = `mailto:valeriaandseanharrigan@gmail.com?subject=${subject}&body=${message}`;
  const formStatus = document.getElementById('form-status');
  if (formStatus) formStatus.textContent = '';
  checkInForm.classList.add('is-confirmed');
  if (checkInFormContent) checkInFormContent.hidden = true;
  if (checkInThanks) {
    checkInThanks.hidden = false;
    requestAnimationFrame(() => {
      checkInThanks.classList.add('is-visible');
      checkInThanks.querySelector('h3')?.focus({ preventScroll: true });
    });
  }
  window.setTimeout(() => {
    window.location.href = mailtoUrl;
  }, reducedMotion ? 0 : 1250);
});

// Frosted panels clear a soft lens wherever the pointer rests (desktop only).
const attachLens = (lensPanel) => {
  let targetX = 0, targetY = 0, lensX = 0, lensY = 0, lensFrame = 0;
  const settle = () => {
    lensX += (targetX - lensX) * (reducedMotion ? 1 : .1);
    lensY += (targetY - lensY) * (reducedMotion ? 1 : .1);
    lensPanel.style.setProperty('--lens-x', `${lensX.toFixed(1)}px`);
    lensPanel.style.setProperty('--lens-y', `${lensY.toFixed(1)}px`);
    lensFrame = (Math.abs(targetX - lensX) > .4 || Math.abs(targetY - lensY) > .4) ? requestAnimationFrame(settle) : 0;
  };
  const track = (event, snap) => {
    const rect = lensPanel.getBoundingClientRect();
    targetX = event.clientX - rect.left;
    targetY = event.clientY - rect.top;
    if (snap) { lensX = targetX; lensY = targetY; }
    if (!lensFrame) lensFrame = requestAnimationFrame(settle);
  };
  lensPanel.addEventListener('pointerenter', (event) => track(event, true));
  lensPanel.addEventListener('pointermove', (event) => track(event, false));
  lensPanel.addEventListener('pointerdown', (event) => {
    track(event, true);
    lensPanel.classList.add('is-lens-active');
  });
  const releaseLens = () => lensPanel.classList.remove('is-lens-active');
  lensPanel.addEventListener('pointerup', releaseLens);
  lensPanel.addEventListener('pointercancel', releaseLens);
};
if (languageGate) attachLens(languageGate);
if (passwordGate) attachLens(passwordGate);
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.special-inner').forEach(attachLens);
}

// Language gate: pick a language before the invitation opens.
languageGateOptions.forEach((option) => option.addEventListener('click', () => {
  currentLanguage = option.dataset.language === 'es' ? 'es' : 'en';
  renderLanguage(currentLanguage);
  // The frost clears outward from the chosen option, then the gate steps aside.
  const gateRect = languageGate.getBoundingClientRect();
  const optionRect = option.getBoundingClientRect();
  languageGate.style.setProperty('--lens-x', `${(optionRect.left + optionRect.width / 2 - gateRect.left).toFixed(1)}px`);
  languageGate.style.setProperty('--lens-y', `${(optionRect.top + optionRect.height / 2 - gateRect.top).toFixed(1)}px`);
  languageGate.classList.add('is-clearing');
  setTimeout(() => {
    languageGate.classList.add('is-done');
    languageGate.classList.remove('is-optional', 'is-lens-active');
    body.classList.remove('language-gate-open');
    if (body.classList.contains('invitation-active')) openEnvelope.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 1550);
}));

const hashAccessAttempt = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

passwordGateForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (passwordGate.classList.contains('is-clearing')) return;
  const submitButton = passwordGateForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  passwordGate.classList.remove('is-error');
  passwordGateStatus.textContent = '';

  let attemptHash = '';
  try {
    attemptHash = await hashAccessAttempt(passwordInput.value);
  } catch {
    passwordGateStatus.textContent = 'Unable to check the password. Please refresh and try again.';
  }

  const isGuest = attemptHash === guestAccessHash;
  const isAdmin = attemptHash === adminAccessHash;

  if (!isGuest && !isAdmin) {
    passwordGate.classList.add('is-error');
    passwordGateStatus.textContent ||= 'That password does not match. Please try again. / La contraseña no coincide.';
    passwordInput.select();
    submitButton.disabled = false;
    setTimeout(() => passwordGate.classList.remove('is-error'), reducedMotion ? 0 : 520);
    return;
  }

  if (isGuest) {
    passwordInput.blur();
    passwordGateStatus.textContent = '';
    passwordGate.classList.add('is-construction');
    passwordGate.setAttribute('aria-label', 'Website under construction');
    passwordGateForm.setAttribute('aria-hidden', 'true');
    constructionMessage?.setAttribute('aria-hidden', 'false');
    submitButton.disabled = false;
    return;
  }

  storeValue('wedding-admin-access-v1', 'true');
  passwordGate.classList.add('is-clearing');
  document.documentElement.classList.add('access-transitioning');
  passwordInput.blur();

  setTimeout(() => {
    languageGate.classList.remove('is-done', 'is-clearing', 'is-optional');
    languageGate.classList.add('is-arriving');
    body.classList.add('language-gate-open');
    invitationIntro.inert = false;
    header.inert = false;
    mainSite.inert = false;
    revealInvitation();
  }, reducedMotion ? 0 : 360);

  setTimeout(() => {
    passwordGate.classList.add('is-done');
    passwordGate.hidden = true;
    body.classList.remove('password-gate-open');
    document.documentElement.classList.remove('access-required', 'access-transitioning');
    document.documentElement.classList.add('access-granted');
    languageGate.classList.remove('is-arriving');
    document.querySelector('.language-gate-panel')?.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 1180);
});

// Invitation suite hotspots are authored in artwork coordinates and mapped
// through the image's object-fit: cover transform, so they track the cards.
const suiteHotspotStage = document.querySelector('.suite-composite');
const placeSuiteHotspots = () => {
  if (!suiteHotspotStage) return;
  const mobile = innerWidth <= 720;
  const img = suiteHotspotStage.querySelector(`.suite-art--${currentLanguage === 'es' ? 'es' : 'en'} img`);
  const naturalWidth = img?.naturalWidth || (mobile ? 795 : 1920);
  const naturalHeight = img?.naturalHeight || (mobile ? 1414 : 1080);
  const box = suiteHotspotStage.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const scale = Math.max(box.width / naturalWidth, box.height / naturalHeight);
  // Honour the image's object-position (the artwork is bottom-anchored).
  const position = (img ? getComputedStyle(img).objectPosition : '50% 50%').split(' ');
  const anchor = (value, extent) => (value.endsWith('%') ? parseFloat(value) / 100 * extent : parseFloat(value) || 0);
  const slackX = box.width - naturalWidth * scale;
  const slackY = box.height - naturalHeight * scale;
  const offsetX = position[0].endsWith('%') ? slackX * parseFloat(position[0]) / 100 : anchor(position[0], slackX);
  const offsetY = (position[1] || '50%').endsWith('%') ? slackY * parseFloat(position[1] || '50%') / 100 : anchor(position[1], slackY);
  suiteHotspotStage.querySelectorAll('.suite-hotspot, .suite-monogram-card').forEach((spot) => {
    const spec = (mobile ? spot.dataset.mobile : spot.dataset.desktop) || spot.dataset.desktop;
    if (!spec) return;
    const [cx, cy, w, h, rotate] = spec.split(',').map(Number);
    const width = w * naturalWidth * scale;
    const height = h * naturalHeight * scale;
    spot.style.setProperty('left', `${(offsetX + cx * naturalWidth * scale - width / 2).toFixed(1)}px`, 'important');
    spot.style.setProperty('top', `${(offsetY + cy * naturalHeight * scale - height / 2).toFixed(1)}px`, 'important');
    spot.style.setProperty('right', 'auto', 'important');
    spot.style.setProperty('width', `${width.toFixed(1)}px`, 'important');
    spot.style.setProperty('height', `${height.toFixed(1)}px`, 'important');
    spot.style.setProperty('--spot-rotate', `${rotate || 0}deg`);
    spot.style.setProperty('--spot-counter-rotate', `${-(rotate || 0)}deg`);
  });
};
if (suiteHotspotStage) {
  placeSuiteHotspots();
  addEventListener('resize', placeSuiteHotspots, { passive: true });
  suiteHotspotStage.querySelectorAll('img').forEach((img) => img.addEventListener('load', placeSuiteHotspots));
  openEnvelope.addEventListener('click', () => requestAnimationFrame(placeSuiteHotspots));
}
placeClosedWaxSeal();
addEventListener('resize', placeClosedWaxSeal, { passive: true });
addEventListener('orientationchange', placeClosedWaxSeal);

const wedding = new Date('2026-11-03T14:00:00-06:00').getTime();
const countdownValues = {
  days: document.getElementById('days'), hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'), seconds: document.getElementById('seconds')
};

const updateCountdown = () => {
  const remaining = Math.max(0, wedding - Date.now());
  const values = {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining % 86400000) / 3600000),
    minutes: Math.floor((remaining % 3600000) / 60000),
    seconds: Math.floor((remaining % 60000) / 1000)
  };
  const formatted = {
    days: String(values.days), hours: String(values.hours).padStart(2, '0'),
    minutes: String(values.minutes).padStart(2, '0'), seconds: String(values.seconds).padStart(2, '0')
  };
  Object.entries(formatted).forEach(([key, value]) => {
    const element = countdownValues[key];
    if (element.textContent === value) return;
    element.textContent = value;
    element.classList.remove('tick');
    void element.offsetWidth;
    element.classList.add('tick');
  });
};

updateCountdown();
setInterval(updateCountdown, 1000);
