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
const languageGate = document.getElementById('language-gate');
const languageGateOptions = [...document.querySelectorAll('.language-gate-option')];
const catrinaPassage = document.getElementById('catrina-passage');
const envelopeStage = document.querySelector('.envelope-stage');
const suiteComposite = document.querySelector('.suite-composite');
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
let catrinaPassageTimer = 0;
let catrinaPassageHideTimer = 0;
const invitationExitDuration = reducedMotion ? 0 : 680;
const invitationCloseDuration = reducedMotion ? 0 : 620;

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

const clearCatrinaPassageTimers = () => {
  clearTimeout(catrinaPassageTimer);
  clearTimeout(catrinaPassageHideTimer);
  catrinaPassageTimer = 0;
  catrinaPassageHideTimer = 0;
};

const playPasswordCatrinaPassage = (onComplete) => {
  if (!catrinaPassage || reducedMotion) {
    onComplete?.();
    return;
  }

  const passageDuration = 2600;
  clearCatrinaPassageTimers();
  catrinaPassage.classList.add('is-password-handoff');
  catrinaPassage.hidden = false;
  requestAnimationFrame(() => catrinaPassage.classList.add('is-visible'));

  catrinaPassageTimer = window.setTimeout(() => {
    catrinaPassage.classList.remove('is-visible');
    catrinaPassageHideTimer = window.setTimeout(() => {
      catrinaPassage.hidden = true;
      catrinaPassage.classList.remove('is-password-handoff');
      catrinaPassageHideTimer = 0;
      onComplete?.();
    }, 650);
    catrinaPassageTimer = 0;
  }, passageDuration);
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

const revealInvitation = ({ replay = false } = {}) => {
  clearInvitationTimers();
  invitationIntro.hidden = false;
  body.classList.add('invitation-active');
  invitationIntro.classList.remove('is-open', 'is-opening', 'is-closing', 'is-leaving', 'is-preparing', 'is-replaying');
  invitationIntro.setAttribute('aria-hidden', 'false');
  envelopeStage.setAttribute('aria-hidden', 'true');
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
  invitationIntro.classList.remove('is-opening', 'is-closing', 'is-preparing', 'is-replaying');
  invitationIntro.classList.add('is-leaving');
  suiteComposite?.classList.remove('is-glow-active', 'is-action-hovered');
  storeValue('wedding-invitation-seen', 'true');
  invitationHideTimer = setTimeout(() => {
    invitationIntro.hidden = true;
    invitationIntro.classList.remove('is-leaving', 'is-open', 'is-opening', 'is-closing');
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
  if (reducedMotion) invitationIntro.classList.remove('is-open');
  else requestAnimationFrame(() => invitationIntro.classList.remove('is-open'));
  invitationCloseTimer = setTimeout(() => {
    invitationIntro.classList.remove('is-closing');
    envelopeStage.setAttribute('aria-hidden', 'true');
    openEnvelope.focus({ preventScroll: true });
    invitationCloseTimer = 0;
  }, invitationCloseDuration);
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
  if (invitationIntro.classList.contains('is-open') || invitationIntro.classList.contains('is-opening') || invitationIntro.classList.contains('is-closing') || invitationIntro.classList.contains('is-leaving')) return;
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
  }, reducedMotion ? 0 : (innerWidth <= 720 ? 760 : 680));
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
enterSite.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  enterSite.click();
});
introClose.addEventListener('click', closeInvitation);
invitationReplay.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (body.classList.contains('invitation-active')) return;
  setMenuOpen(false);
  keepWebsiteAtTop();
  revealInvitation({ replay: true });
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
  navStory: ['Our story', 'Nuestra historia'], navSchedule: ['Schedule', 'Programa'], navTravel: ['Travel', 'Viaje'], navWelcome: ['Welcome', 'Bienvenidos'], navDate: ['The date', 'La fecha'], navDetails: ['Details', 'Detalles'], navCity: ['Explore', 'Explorar'], navCheckIn: ['Check-In', 'Registro'], navAnimations: ['Animations', 'Animaciones'],
  openInvitationAria: ["Open Sean and Valeria's wedding invitation", 'Abrir la invitación de boda de Sean y Valeria'], invitationSuiteAria: ['Wedding invitation suite', 'Conjunto de invitación de boda'], backToTopAria: ['Sean and Valeria, back to top', 'Sean y Valeria, volver al inicio'], primaryNavigationAria: ['Primary navigation', 'Navegación principal'], neighbourhoodGalleryAria: ['Recommended Mexico City neighbourhoods', 'Colonias recomendadas de la Ciudad de México'], heroAria: ['Sean and Valeria by the coast', 'Sean y Valeria junto a la costa'], heroSealAlt: ['Sean and Valeria monogram wax seal', 'Sello de cera con el monograma de Sean y Valeria'], detailsPairAria: ['Venue and dress code details', 'Detalles del lugar y código de vestimenta'], fallPaletteAria: ['Suggested fall colour palette', 'Paleta de colores de otoño sugerida'], weatherAria: ['November weather in Tepoztlán', 'Clima de noviembre en Tepoztlán'], celebrationTimelineAria: ['Wedding day celebration timeline', 'Horario de la celebración de la boda'], weekItineraryAria: ['Suggested week itinerary', 'Itinerario sugerido para la semana'], neighbourhoodsAria: ['Recommended neighbourhoods', 'Colonias recomendadas'], specialAria: ['Special request and gifts', 'Petición especial y regalos'], closingAria: ['Thank you', 'Gracias'], romaPhotoAlt: ['A leafy street with historic architecture in Mexico City', 'Una calle arbolada con arquitectura histórica en la Ciudad de México'], condesaPhotoAlt: ['Art Deco homes and trees in Condesa, Mexico City', 'Casas art déco y árboles en Condesa, Ciudad de México'], reformaPhotoAlt: ['Paseo de la Reforma in Mexico City at golden hour', 'Paseo de la Reforma en la Ciudad de México al atardecer'], centroPhotoAlt: ['Historic arcades in Centro Histórico, Mexico City', 'Arcadas históricas en el Centro Histórico de la Ciudad de México'], bellasPhotoAlt: ['Palacio de Bellas Artes in Mexico City at golden hour', 'Palacio de Bellas Artes en la Ciudad de México durante la hora dorada'], conventPhotoAlt: ['A lush rooftop restaurant in Tepoztlán', 'Un frondoso restaurante en una azotea de Tepoztlán'], ridgePhotoAlt: ['Tepozteco mountain framed by flowers and Tepoztlán streets', 'La montaña del Tepozteco enmarcada por flores y calles de Tepoztlán'], accommodationPhotoAlt: ['Tall cacti and gardens at Hotel Piedra Viva with Tepoztlán mountains', 'Cactus altos y jardines en Hotel Piedra Viva con las montañas de Tepoztlán'], closingPhotoAlt: ['Sean kissing Valeria at sunset by the ocean', 'Sean besando a Valeria al atardecer junto al mar'], footerLogoAlt: ['Sean and Valeria monogram', 'Monograma de Sean y Valeria'],
  galleryAria: ['Gallery from Mexico City and Tepoztlán', 'Galería de la Ciudad de México y Tepoztlán'], galleryKicker: ['A little glimpse', 'Un pequeño vistazo'], galleryTitle: ['<span>Scenes from</span> <em>México.</em>', '<span>Escenas de</span> <em>México.</em>'], galleryCopy: ['A few corners of Mexico City and Tepoztlán to look forward to along the way.', 'Algunos rincones de la Ciudad de México y Tepoztlán para esperar con ilusión durante el viaje.'], galleryCeremonialAlt: ['Ceremonial dress in Tepoztlán', 'Vestimenta ceremonial en Tepoztlán'], galleryChurchAlt: ['A church street in Tepoztlán', 'Una calle junto a una iglesia en Tepoztlán'], galleryOfrendaAlt: ['A Día de Muertos altar in Mexico City', 'Una ofrenda de Día de Muertos en la Ciudad de México'], galleryReformaAlt: ['Ángel de la Independencia at dusk', 'El Ángel de la Independencia al atardecer'], galleryLaneAlt: ['A quiet lane in Tepoztlán', 'Una calle tranquila en Tepoztlán'], galleryStreetAlt: ['A historic Tepoztlán street', 'Una calle histórica de Tepoztlán'],
  introKicker: ['The Wedding Of', 'La boda de'], openEnvelope: ['Click to open', 'Haz clic para abrir'], openInvitation: ['Tap anywhere to open', 'Toca para abrir'], closeInvitation: ['Return to the closed invitation', 'Volver a la invitación cerrada'], inviteEyebrow: ['With joy', 'Con alegría'], inviteFamily: ['Together with their families', 'Con sus familias'], inviteCopy: ['request the pleasure of your company as they celebrate their marriage.', 'tienen el gusto de invitarlos a celebrar su matrimonio.'], inviteVenue: ['Hotel Piedra Viva<br>Tepoztlán, Morelos · México', 'Hotel Piedra Viva<br>Tepoztlán, Morelos · México'], enterSite: ['Tap anywhere to enter <span aria-hidden="true">→</span>', 'Toca para entrar <span aria-hidden="true">→</span>'], invitationEnter: ['Enter our celebration', 'Entrar a nuestra celebración'], invitationCheckIn: ['Please check in', 'Confirma tu asistencia'], checkInInvitationAction: ['Please check in on the wedding website', 'Confirma tu asistencia en el sitio de la boda'], enterInvitation: ['Enter the wedding website', 'Entrar al sitio de la boda'], viewGallery: ['See our gallery', 'Ver nuestra galería'], viewGalleryAction: ['View gallery and enter the wedding website', 'Ver la galería y entrar al sitio de la boda'], viewInvitation: ['Invitation', 'Invitación'], skipToContent: ['Skip to content', 'Ir al contenido'], partyPlaceholder: ['Names of everyone in your party', 'Nombres de todos los asistentes'],
  heroEyebrow: ['The wedding of', 'La boda de'],
  heroQuote: ['Among mountains, flowers and light,<br>we celebrate our love.', 'Entre montañas, flores y luz,<br>celebramos nuestro amor.'],
  confirmAttendance: ['Confirm attendance', 'Confirmar asistencia'], seeDay: ['See the day', 'Ver el programa'],
  arrivalTitle: ['Guest arrival', 'Llegada de invitados'], arrivalDesc: ['Welcome drinks and a little time to settle into the gardens.', 'Bebidas de bienvenida y un rato para disfrutar los jardines.'],
  ceremonyTitle: ['Ceremony', 'Ceremonia'], ceremonyDesc: ['Join us outdoors as we exchange vows beneath the mountains.', 'Acompáñennos al aire libre para intercambiar nuestros votos frente a las montañas.'],
  cocktailTitle: ['Cocktail Hour', 'Hora del cóctel'], cocktailDesc: ['Cocktails and music in the courtyard.', 'Cócteles y música en el patio.'],
  receptionTitle: ['Reception', 'Recepción'], receptionDesc: ['Find your table and raise a glass as the evening begins.', 'Busquen su mesa y brinden con nosotros para comenzar la noche.'],
  dinnerTitle: ['Dinner', 'Cena'], dinnerDesc: ['A candlelit meal inspired by the flavours of Mexico.', 'Una cena a la luz de las velas inspirada en los sabores de México.'],
  partyTitle: ['Party', 'Fiesta'], partyDesc: ['Meet us on the dance floor and stay as long as you can.', 'Nos vemos en la pista de baile. Quédense todo lo que puedan.'],
  antojitosTitle: ['Antojitos Mexicanos', 'Antojitos mexicanos'], antojitosDesc: ['A late-night Mexican snack before one last dance.', 'Antojitos de madrugada antes del último baile.'],
  eventConcludesTitle: ['Event concludes', 'Fin del evento'], finDesc: ['Carriages, hugs and a very happy goodnight.', 'Abrazos y buenas noches.'],
  travelWeddingDay: ['Wedding day', 'Día de la boda'],
  travelWeddingDayCopy: ['Our ceremony will begin at 2:45 PM at La Cascada. Please arrive at 2:00 PM. After we say “I do,” we’ll gather for cocktail hour before moving inside for dinner, speeches, and dancing the night away.', 'La ceremonia comienza a las 2:45 PM en La Cascada. Les pedimos llegar a las 2:00 PM. Después del “sí, acepto” nos reuniremos para la hora del cóctel. Luego pasaremos a la cena, los discursos y el baile.'],
  travelAccommodation: ['Accommodation', 'Estancia'],
  travelAccommodationCopy: ['Hotel Piedra Viva is a 1.5-hour drive from Mexico City. We recommend staying at the hotel; rooms are limited, so close family will be given priority.', 'Hotel Piedra Viva está a una hora y media de la Ciudad de México. Recomendamos hospedarse ahí. Hay pocas habitaciones, así que daremos prioridad a la familia cercana.'],
  travelAccommodationMore: ['$2,250 MXN per night for two (about $180 CAD); a 3rd or 4th guest in a double suite is $850 MXN each. Tepoztlán also has lovely boutique hotels nearby.', '$2,250 MXN por noche para dos personas. La tercera o cuarta persona en una suite doble paga $850 MXN. También hay buenos hoteles boutique cerca.'],
  travelAccommodationAvailability: ['Hotel Piedra Viva is now fully booked, and we are unable to offer any additional rooms. Thank you for understanding.', 'Hotel Piedra Viva ya está lleno y ya no podemos ofrecer más habitaciones. Gracias por su comprensión.'],
  travelTransport: ['Transport', 'Transporte'],
  travelTransportAirport: ['<strong>Arrival at Benito Juárez Airport (MEX)</strong><br>About 25–45 minutes to downtown Mexico City, depending on traffic.', '<strong>Llegada al Aeropuerto Internacional Benito Juárez (MEX)</strong><br>Está a unos 25–45 minutos del centro de la Ciudad de México, según el tráfico.'],
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
  romaLabel: ['Roma Norte', 'Roma Norte'], romaCaption: ['Leafy streets, galleries and cafés', 'Calles arboladas, galerías y cafés'], condesaLabel: ['Condesa', 'Condesa'], reformaLabel: ['Reforma', 'Reforma'], centroLabel: ['Centro Histórico', 'Centro Histórico'], diaMuertosLabel: ['Día de Muertos', 'Día de Muertos'], diaMuertosCaption: ['Marigolds, memory and Mexico City', 'Cempasúchil, memoria y Ciudad de México'], diaMuertosPhotoAlt: ['Día de Muertos altar in Mexico City with marigolds and the Mexican flag', 'Altar de Día de Muertos en la Ciudad de México con cempasúchil y la bandera mexicana'], bellasLabel: ['Bellas Artes', 'Bellas Artes'], bellasCaption: ['Architecture, murals and golden light', 'Arquitectura, murales y luz dorada'],
  conventLabel: ['Rooftop Restaurants', 'Restaurantes en Azoteas'], conventCaption: ['Stone courtyards and centuries of history', 'Patios de piedra y siglos de historia'], ridgeLabel: ['Tepozteco', 'Tepozteco'], ridgeCaption: ['Dramatic mountains above the town', 'Montañas imponentes sobre el pueblo'],
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
  faqContactDetails: ['Email <a href="mailto:valeriaandseanharrigan@gmail.com">valeriaandseanharrigan@gmail.com</a><br>Valeria: <a href="tel:+16044406820">604-440-6820</a> · Sean: <a href="tel:+16043077361">604-307-7361</a>', 'Correo <a href="mailto:valeriaandseanharrigan@gmail.com">valeriaandseanharrigan@gmail.com</a><br>Valeria: <a href="tel:+16044406820">604-440-6820</a> · Sean: <a href="tel:+16043077361">604-307-7361</a>'],
  welcomeTitle: ['Welcome', 'Bienvenidos'],
  saveEyebrow: ['Our wedding day', 'El día de nuestra boda'], saveWord: ['Save', 'Reserva'], theWord: ['The', 'La'], dateWord: ['Date', 'Fecha'], saveDate: ['Tuesday, November 3, 2026', 'Martes, 3 de noviembre de 2026'], saveDateCopy: ['Our ceremony begins at 2:45 PM at La Cascada. Please arrive at 2:00 PM. After we say “I do,” we’ll gather for cocktail hour before moving inside for dinner, speeches, and dancing the night away.', 'La ceremonia comienza a las 2:45 PM en La Cascada. Les pedimos llegar a las 2:00 PM. Después del “sí, acepto” nos reuniremos para la hora del cóctel. Luego pasaremos a la cena, los discursos y el baile.'],
  detailsKicker: ['The gathering', 'El encuentro'], detailsTitle: ['<em>The</em> <span>Details</span>', '<em>Los</em> <span>Detalles</span>'], venueTitle: ['Venue', 'Lugar'], openMap: ['Open map', 'Abrir mapa'], dressTitle: ['Dress code', 'Código de vestimenta'], formalAttire: ['Formal attire', 'Vestimenta formal'], programEyebrow: ['The order of the day', 'El orden del día'], celebrationTitle: ['<em>The</em> <span>Celebration</span>', '<em>La</em> <span>Celebración</span>'],
  travelKicker: ['The journey', 'El viaje'], travelTitle: ['Travel', 'Viaje'], browseHotels: ['Browse hotels', 'Ver hoteles'],
  travelSubline: ['For those travelling from afar', 'Para quienes viajan desde lejos'], chapterSchedule: ['Schedule', 'Itinerario'], monthOct: ['Oct', 'Oct'], monthNov: ['Nov', 'Nov'],
  hoodRoma: ['Leafy streets, cafés and galleries. Central, lively, and a little noisy on weekends.', 'Calles arboladas, cafés y galerías. Céntrica, animada y algo ruidosa los fines de semana.'], hoodCondesa: ['Art-deco blocks, two parks, and excellent restaurants. Calm and walkable.', 'Edificios art déco, dos parques y excelentes restaurantes. Tranquila y fácil de recorrer a pie.'], hoodReforma: ['Polished avenues and large hotels. Modern, corporate, and farther from Centro Histórico.', 'Avenidas elegantes y hoteles grandes. Moderna, corporativa y más lejos del Centro Histórico.'], hoodCentro: ['The Zócalo, Bellas Artes, and museums are right outside. Historic and full of character.', 'El Zócalo, Bellas Artes y los museos están a un paso. Histórico y lleno de carácter.'],
  cityArriving: ['Arriving', 'Llegada'], cityStayTitle: ['Where to stay', 'Dónde hospedarse'], tepoztlanKicker: ['Things to do in', 'Qué hacer en'], weatherTitle: ['Tepoztlán in November', 'Tepoztlán en noviembre'], weatherDays: ['Day', 'Día'], weatherNights: ['Night', 'Noche'],
  cityEyebrow: ['Explore Mexico with us', 'Explora México con nosotros'], cityTitle: ['Things to do<br>in the <em>City</em>.', 'Qué hacer<br>en la <em>Ciudad</em>.'],
  specialSharedTitle: ['<span>Special</span> <em>Request</em>', '<span>Petición</span> <em>Especial</em>'], specialTitle: ['For those who remain in spirit.', 'Para quienes siguen con nosotros en espíritu.'], giftsTitle: ['Your presence is our gift.', 'Su presencia es nuestro mejor regalo.'],
  weekTitle: ['A week<br>in <em>México</em>.', 'Una semana<br>en <em>México</em>.'], weekBrief: ['Arrive early, stay a little longer, and make the celebration part of a beautiful week away.', 'Lleguen antes, quédense unos días y disfruten una semana completa en México.'],
  weekArrival: ['Arrive in Mexico City', 'Llegada a la Ciudad de México'], weekArrivalCopy: ['Land in the capital, settle in and begin your Mexico City adventure.', 'Lleguen, instálense y empiecen a recorrer la ciudad.'], weekMuertos: ['Día de Muertos parade', 'Desfile de Día de Muertos'], weekMuertosCopy: ['Experience the city in its most luminous season—marigolds, music and remembrance.', 'Disfruten la ciudad entre cempasúchil, música y recuerdos.'], weekTravel: ['Travel to Tepoztlán', 'Viaje a Tepoztlán'], weekTravelCopy: ['Head south into the mountains; the journey from Mexico City is roughly ninety minutes.', 'El viaje desde la Ciudad de México dura aproximadamente noventa minutos.'], weekWedding: ['Wedding day', 'Día de la boda'], weekWeddingCopy: ['Gather with us at Hotel Piedra Viva for an afternoon and evening under the Tepozteco.', 'Pasen la tarde y la noche con nosotros en Hotel Piedra Viva, al pie del Tepozteco.'], weekPool: ['Pool day or hike', 'Día de alberca o caminata'], weekPoolCopy: ['Keep the day unhurried—cool off by the pool or take in the panoramic mountain trail.', 'Tómense el día con calma: alberca o caminata por la montaña.'], weekReturn: ['Return to Mexico City', 'Regreso a la Ciudad de México'], weekReturnCopy: ['Travel back to the city with a little time left for one last coffee or market visit.', 'Regresen a la ciudad con tiempo para un último café o una visita al mercado.'],
  countdownTitle: ['<em>The</em> <span>Countdown</span>', '<em>La</em> <span>cuenta regresiva</span>'],
  checkInKicker: ['Your journey', 'Su viaje'], checkInTitle: ['<span>Check</span>-<em>In</em>', '<span>Registro</span>'], checkInIntro: ['Share your travel dates and accommodation details so we know when and where to expect you.', 'Compartan sus fechas y datos de hospedaje para saber cuándo y dónde esperarlos.'], partyLabel: ['Who is coming?', '¿Quiénes vienen?'], arrivalDateLabel: ['Arrival date', 'Fecha de llegada'], departureDateLabel: ['Departure date', 'Fecha de salida'], mexicoCityAccommodationLabel: ['Mexico City neighbourhood', 'Colonia en Ciudad de México'], chooseNeighbourhood: ['Choose a neighbourhood', 'Elige una colonia'], otherOption: ['Other', 'Otro'], otherNeighbourhoodLabel: ['Other neighbourhood', 'Otra colonia'], otherNeighbourhoodPlaceholder: ['Enter neighbourhood', 'Escribe la colonia'], tepoztlanCheckInLabel: ['Tepoztlán check-in', 'Entrada en Tepoztlán'], tepoztlanCheckOutLabel: ['Tepoztlán check-out', 'Salida de Tepoztlán'], tepoztlanLocationLabel: ['Tepoztlán accommodation', 'Hospedaje en Tepoztlán'], chooseTepoztlanLocation: ['Choose accommodation', 'Elige el hospedaje'], otherTepoztlanLabel: ['Other accommodation', 'Otro hospedaje'], otherTepoztlanPlaceholder: ['Enter hotel or accommodation', 'Escribe el hotel o alojamiento'], checkInSubmit: ['Submit Check-In <span aria-hidden="true">→</span>', 'Enviar registro <span aria-hidden="true">→</span>'], checkInThanksKicker: ['Gracias', 'Gracias'], checkInThanksTitle: ['Thank you.', 'Gracias.'], checkInThanksCopy: ['This helps us make everyone’s arrival feel easy and well looked after.', 'Esto nos ayuda a que la llegada de todos sea más fácil y cuidada.'], checkInThanksEmail: ['Your check-in<br>has been received.', 'Hemos recibido<br>tu registro.'], animationLabKicker: ['Temporary study', 'Estudio temporal'], animationLabTitle: ['<span>Invitation</span> <em>animations.</em>', '<span>Animaciones de</span> <em>invitación.</em>'], animationLabCopy: ['Choose a transition below. Each preview begins with the closed envelope, then moves to the open invitation.', 'Elige una transición. Cada vista comienza con el sobre cerrado y termina con la invitación abierta.'], animationLabReplay: ['Tap to replay', 'Toca para repetir'], closingTitle: ['We cannot wait<br>to celebrate together.', 'Ya queremos<br>celebrar juntos.']
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
  document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
    const pair = uiTranslations[element.dataset.i18nAlt];
    if (pair) element.alt = pair[language === 'es' ? 1 : 0];
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
  document.dispatchEvent(new CustomEvent('wedding:languagechange', { detail: language }));
};

// The header's EN/ES and the envelope's discreet control both open the frosted language gate.
const openLanguageGate = () => {
  if (!languageGate || languageGate.classList.contains('is-clearing') || invitationIntro.classList.contains('is-leaving')) return;
  setMenuOpen(false);
  languageGate.classList.remove('is-clearing');
  languageGate.classList.remove('is-done');
  languageGate.classList.add('is-optional');
  body.classList.add('language-gate-open');
  setTimeout(() => document.querySelector('.language-gate-panel')?.focus({ preventScroll: true }), reducedMotion ? 0 : 350);
};
const dismissLanguageGate = () => {
  if (!languageGate || languageGate.classList.contains('is-done') || languageGate.classList.contains('is-clearing')) return;
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

// Track every section currently inside the observation band, so a fast scroll
// that makes one section leave and the next enter in the same batch still
// resolves to the section that is actually there.
const navBand = new Map();
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) navBand.set(entry.target, entry.intersectionRatio);
    else navBand.delete(entry.target);
  });
  const visible = [...navBand.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!visible) return;
  const key = visible[0].dataset.nav;
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

const CHECK_IN_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwOKUc9ZyyRARm1uR0ygJbFOi-iTm494QsTusGA4fBS-XJTCDylcbBunY7O-9L5T4db/exec';

const checkInForm = document.getElementById('check-in-form');
const checkInFormContent = checkInForm?.querySelector('.check-in-form-content');
const checkInThanks = document.getElementById('check-in-thanks');
const checkInPassage = document.getElementById('check-in-passage');
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

// Native option sheets cannot take on the site's paper-and-ink treatment. Keep
// the real selects for validation and submission, then expose an accessible
// in-page list that matches the calendar popover on every screen size.
const paperSelectControls = [];
const setupPaperSelect = (select) => {
  if (!select || select.dataset.paperSelectReady === 'true') return;
  const field = select.closest('.field');
  if (!field) return;

  const fieldLabel = field.querySelector(`label[for="${select.id}"]`);
  const control = document.createElement('div');
  const trigger = document.createElement('button');
  const menu = document.createElement('div');
  const menuId = `${select.id}-menu`;

  select.dataset.paperSelectReady = 'true';
  select.classList.add('native-select-proxy');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  control.className = 'paper-select-control';
  trigger.type = 'button';
  trigger.className = 'paper-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', menuId);
  if (fieldLabel) {
    const labelId = `${select.id}-label`;
    fieldLabel.id = labelId;
    trigger.setAttribute('aria-labelledby', labelId);
    fieldLabel.addEventListener('click', (event) => {
      event.preventDefault();
      trigger.focus({ preventScroll: true });
      trigger.click();
    });
  }
  menu.className = 'paper-select-menu';
  menu.id = menuId;
  menu.hidden = true;
  menu.setAttribute('role', 'listbox');

  const close = ({ focus = false } = {}) => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    control.classList.remove('is-open');
    if (focus) trigger.focus({ preventScroll: true });
  };
  const open = () => {
    paperSelectControls.forEach((instance) => {
      if (instance.control !== control) instance.close();
    });
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    control.classList.add('is-open');
    const selected = menu.querySelector('[aria-selected="true"]:not(:disabled)') || menu.querySelector('button:not(:disabled)');
    selected?.focus({ preventScroll: true });
  };
  const selectValue = (value) => {
    select.value = value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    close({ focus: true });
  };
  const render = () => {
    const selectedOption = select.options[select.selectedIndex];
    trigger.replaceChildren();
    const label = document.createElement('span');
    label.className = 'paper-select-value';
    label.textContent = selectedOption?.textContent.trim() || '';
    const arrow = document.createElement('span');
    arrow.className = 'paper-select-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↓';
    trigger.append(label, arrow);
    trigger.classList.toggle('is-placeholder', !select.value);
    menu.replaceChildren();
    [...select.options].forEach((option) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'paper-select-option';
      item.dataset.value = option.value;
      item.disabled = option.disabled;
      item.textContent = option.textContent.trim();
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(option.value === select.value));
      item.addEventListener('click', () => {
        if (!option.disabled) selectValue(option.value);
      });
      menu.append(item);
    });
  };

  select.insertAdjacentElement('afterend', control);
  control.append(trigger, menu);
  render();
  select.addEventListener('change', render);
  trigger.addEventListener('click', () => menu.hidden ? open() : close());
  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      open();
    }
  });
  menu.addEventListener('keydown', (event) => {
    const options = [...menu.querySelectorAll('button:not(:disabled)')];
    const index = options.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      close({ focus: true });
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      options[(index + direction + options.length) % options.length]?.focus({ preventScroll: true });
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (!control.contains(event.target)) close();
  });
  document.addEventListener('wedding:languagechange', render);
  paperSelectControls.push({ control, close });
};

document.querySelectorAll('.check-in-card select').forEach(setupPaperSelect);

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
const checkInDateInputs = [...document.querySelectorAll('.check-in-card input[type="date"]')];
const laterIsoDate = (...dates) => dates.filter(Boolean).reduce((latest, date) => date > latest ? date : latest, '');
const dayAfterIso = (isoDate) => {
  const date = parseCalendarDate(isoDate);
  if (!date) return '';
  date.setDate(date.getDate() + 1);
  return calendarIso(date);
};
const todayIso = () => calendarIso(new Date());

checkInDateInputs.forEach((input) => {
  input.dataset.scheduleMin = input.min;
  input.dataset.scheduleMax = input.max;
  input.min = laterIsoDate(input.dataset.scheduleMin, todayIso());
});
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

checkInDateInputs.forEach((input) => {
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

const syncCheckInDateBounds = () => {
  const updateBounds = (inputId, afterDate = '') => {
    const input = document.getElementById(inputId);
    if (!input) return;

    const minimum = laterIsoDate(input.dataset.scheduleMin, todayIso(), afterDate);
    input.min = minimum;
    input.max = input.dataset.scheduleMax;
    if (input.value && (input.value < minimum || input.value > input.max)) input.value = '';

    const instance = datePickerInstances.find((item) => item.input === input);
    if (!instance) return;
    instance.minDate = parseCalendarDate(minimum);
    instance.maxDate = parseCalendarDate(input.max);
    if (instance.visibleMonth < new Date(instance.minDate.getFullYear(), instance.minDate.getMonth(), 1, 12)) {
      instance.visibleMonth = new Date(instance.minDate.getFullYear(), instance.minDate.getMonth(), 1, 12);
    }
    if (!instance.panel.hidden) renderDatePicker(instance);
  };

  const arrival = document.getElementById('arrival-date')?.value || '';
  const tepoztlanCheckIn = document.getElementById('tepoztlan-check-in')?.value || '';
  updateBounds('arrival-date');
  updateBounds('departure-date', dayAfterIso(arrival));
  updateBounds('tepoztlan-check-in');
  updateBounds('tepoztlan-check-out', dayAfterIso(tepoztlanCheckIn));
};

syncCheckInDateBounds();
document.getElementById('arrival-date')?.addEventListener('change', syncCheckInDateBounds);
document.getElementById('tepoztlan-check-in')?.addEventListener('change', syncCheckInDateBounds);

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

const showCheckInConfirmation = () => {
  if (!checkInForm) return;
  if (checkInForm.classList.contains('is-confirming') || checkInForm.classList.contains('is-confirmed')) return;
  const checkInTransitionDuration = reducedMotion ? 0 : 3400;
  const checkInRevealDelay = reducedMotion ? 0 : 90;
  const formStatus = document.getElementById('form-status');
  if (formStatus) formStatus.textContent = '';
  const formHeight = Math.ceil(checkInForm.getBoundingClientRect().height);
  if (formHeight) checkInForm.style.setProperty('--check-in-confirmed-height', `${formHeight}px`);
  checkInForm.classList.add('is-confirming');
  checkInForm.querySelector('button[type="submit"]')?.setAttribute('disabled', '');
  if (checkInPassage) {
    checkInPassage.hidden = false;
    checkInPassage.classList.remove('is-arrived');
    void checkInPassage.offsetWidth;
    requestAnimationFrame(() => checkInPassage.classList.add('is-walking'));
  }

  window.setTimeout(() => {
    checkInForm.classList.add('is-confirmed');
    if (checkInFormContent) checkInFormContent.hidden = true;
    if (checkInThanks) {
      checkInThanks.hidden = false;
      requestAnimationFrame(() => checkInThanks.classList.add('is-visible'));
    }
  }, checkInRevealDelay);

  window.setTimeout(() => {
    checkInForm.classList.remove('is-confirming');
    if (checkInPassage) {
      checkInPassage.classList.remove('is-walking');
      checkInPassage.classList.add('is-arrived');
    }
  }, checkInTransitionDuration);
};

const sendCheckInSubmission = (form) => {
  const formData = new FormData(form);
  const payload = new URLSearchParams();

  formData.forEach((value, key) => {
    if (typeof value === 'string') payload.append(key, value);
  });
  payload.set('language', currentLanguage === 'es' ? 'Spanish' : 'English');

  // Apps Script accepts a simple form POST. `no-cors` keeps this static site
  // compatible with Google's cross-origin web-app endpoint.
  return fetch(CHECK_IN_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: payload.toString(),
    keepalive: true
  });
};

const submitCheckIn = (event) => {
  event.preventDefault();
  if (!checkInForm || checkInForm.classList.contains('is-confirming') || checkInForm.classList.contains('is-confirmed')) return;

  // Keep the immediate, crafted confirmation transition. A blank practice
  // submission remains visual-only; real entries are delivered in the background.
  const party = new FormData(checkInForm).get('party');
  if (typeof party === 'string' && party.trim()) {
    void sendCheckInSubmission(checkInForm).catch(() => {
      console.warn('The check-in could not be delivered.');
    });
  }

  showCheckInConfirmation();
};

checkInForm?.addEventListener('submit', submitCheckIn);

// Some mobile browsers do not promote a light touch on the styled submit button
// to the form submit event. Handle that path explicitly while preserving keyboard submit.
checkInForm?.querySelector('button[type="submit"]')?.addEventListener('click', (event) => {
  if (checkInForm?.classList.contains('is-confirming') || checkInForm?.classList.contains('is-confirmed')) return;
  submitCheckIn(event);
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
  if (languageGate.classList.contains('is-clearing') || languageGate.classList.contains('is-done')) return;
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
    if (body.classList.contains('invitation-active')) {
      openEnvelope.focus({ preventScroll: true });
    }
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
  languageGate.classList.add('is-password-pending');
  document.documentElement.classList.add('access-transitioning');
  passwordInput.blur();

  playPasswordCatrinaPassage(() => {
    passwordGate.classList.add('is-done');
    passwordGate.hidden = true;
    body.classList.remove('password-gate-open');
    document.documentElement.classList.remove('access-required', 'access-transitioning');
    document.documentElement.classList.add('access-granted');
    languageGate.classList.remove('is-done', 'is-clearing', 'is-optional', 'is-password-pending');
    languageGate.classList.add('is-arriving');
    body.classList.add('language-gate-open');
    invitationIntro.inert = false;
    header.inert = false;
    mainSite.inert = false;
    revealInvitation();
    requestAnimationFrame(() => {
      document.querySelector('.language-gate-panel')?.focus({ preventScroll: true });
      window.setTimeout(() => languageGate.classList.remove('is-arriving'), reducedMotion ? 0 : 950);
    });
  });
});

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

// Temporary transition studies for the invitation artwork. The live invitation
// state machine above is intentionally not involved in these previews.
const animationLab = document.querySelector('[data-animation-lab]');
if (animationLab) {
  const animationStage = animationLab.querySelector('[data-animation-lab-stage]');
  const animationLabel = document.querySelector('[data-animation-lab-label]');
  const animationChoices = [...document.querySelectorAll('[data-animation-lab-choice]')];
  const animationPrevious = animationLab.querySelector('[data-animation-lab-prev]');
  const animationNext = animationLab.querySelector('[data-animation-lab-next]');
  const animationStudies = [
    { style: 'dissolve', label: ['Soft dissolve', 'Disolución suave'] },
    { style: 'lift', label: ['Paper lift', 'Elevación de papel'] },
    { style: 'glide', label: ['Gentle glide', 'Deslizamiento suave'] },
    { style: 'focus', label: ['Focus reveal', 'Enfoque gradual'] },
    { style: 'fold', label: ['Quiet fold', 'Pliegue sutil'] },
    { style: 'rise', label: ['Rising card', 'Tarjeta ascendente'] },
    { style: 'wash', label: ['Warm wash', 'Velo cálido'] },
    { style: 'turn', label: ['Soft turn', 'Giro suave'] },
    { style: 'diagonal', label: ['Diagonal reveal', 'Apertura diagonal'] },
    { style: 'swell', label: ['Slow swell', 'Expansión lenta'] }
  ];
  let selectedAnimation = 0;

  const animationText = (english, spanish) => currentLanguage === 'es' ? spanish : english;
  const refreshAnimationLabLanguage = () => {
    const study = animationStudies[selectedAnimation];
    if (animationLabel) animationLabel.textContent = `${String(selectedAnimation + 1).padStart(2, '0')} · ${study.label[currentLanguage === 'es' ? 1 : 0]}`;
    animationStage?.setAttribute('aria-label', animationText('Replay the selected invitation animation', 'Repetir la animación de invitación seleccionada'));
    animationPrevious?.setAttribute('aria-label', animationText('Previous animation', 'Animación anterior'));
    animationNext?.setAttribute('aria-label', animationText('Next animation', 'Siguiente animación'));
    animationChoices.forEach((choice, index) => {
      const label = animationStudies[index].label[currentLanguage === 'es' ? 1 : 0];
      choice.setAttribute('aria-label', `${animationText('Animation', 'Animación')} ${index + 1}: ${label}`);
    });
  };

  const setAnimationStudy = (nextIndex, { play = true } = {}) => {
    selectedAnimation = (nextIndex + animationStudies.length) % animationStudies.length;
    animationStage.dataset.animationStyle = animationStudies[selectedAnimation].style;
    animationChoices.forEach((choice, index) => choice.setAttribute('aria-pressed', String(index === selectedAnimation)));
    refreshAnimationLabLanguage();
    if (!play || !animationStage) return;
    animationStage.classList.remove('is-playing');
    void animationStage.offsetWidth;
    animationStage.classList.add('is-playing');
  };

  animationPrevious?.addEventListener('click', () => setAnimationStudy(selectedAnimation - 1));
  animationNext?.addEventListener('click', () => setAnimationStudy(selectedAnimation + 1));
  animationChoices.forEach((choice, index) => choice.addEventListener('click', () => setAnimationStudy(index)));
  animationStage?.addEventListener('click', () => setAnimationStudy(selectedAnimation));
  animationStage?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setAnimationStudy(selectedAnimation);
  });
  document.addEventListener('wedding:languagechange', refreshAnimationLabLanguage);
  setAnimationStudy(0, { play: false });
}
