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
const invitationIntro = document.getElementById('invitation-intro');
const openEnvelope = document.getElementById('open-envelope');
const enterSite = document.getElementById('enter-site');
const introClose = document.getElementById('intro-close');
const invitationReplay = document.getElementById('invitation-replay');
const languageGate = document.getElementById('language-gate');
const languageGateOptions = [...document.querySelectorAll('.language-gate-option')];
const envelopeStage = document.querySelector('.envelope-stage');
const suiteComposite = document.querySelector('.suite-composite');
const suiteCards = [...document.querySelectorAll('.suite-card[href], .suite-hotspot[href]')];
const nav = document.getElementById('nav-links');
const mobileCurrent = document.getElementById('mobile-current');
const skipLink = document.querySelector('.skip-link');
const headerToneSections = [...document.querySelectorAll('[data-header-tone]')];
let headerToneFrame = 0;
let invitationHideTimer = 0;
let invitationFocusTimer = 0;
let invitationReplayTimer = 0;
let invitationOpenTimer = 0;

const clearInvitationTimers = () => {
  clearTimeout(invitationHideTimer);
  clearTimeout(invitationFocusTimer);
  clearTimeout(invitationReplayTimer);
  clearTimeout(invitationOpenTimer);
  invitationHideTimer = 0;
  invitationFocusTimer = 0;
  invitationReplayTimer = 0;
  invitationOpenTimer = 0;
};

const setMenuOpen = (open) => {
  body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  const spanish = document.documentElement.lang === 'es';
  menuToggle.setAttribute('aria-label', open
    ? (spanish ? 'Cerrar menú' : 'Close navigation')
    : (spanish ? 'Abrir menú' : 'Open navigation'));
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
  invitationIntro.classList.remove('is-open', 'is-opening', 'is-leaving', 'is-preparing', 'is-replaying');
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
    (gateOpen ? document.querySelector('.language-gate-panel') : openEnvelope)?.focus({ preventScroll: true });
    invitationFocusTimer = 0;
  }, reducedMotion ? 0 : (replay ? 620 : 180));
};

const enterCelebration = () => {
  if (invitationIntro.hidden || invitationIntro.classList.contains('is-leaving')) return;
  clearInvitationTimers();
  invitationIntro.classList.remove('is-opening', 'is-preparing', 'is-replaying');
  invitationIntro.classList.add('is-leaving');
  storeValue('wedding-invitation-seen', 'true');
  invitationHideTimer = setTimeout(() => {
    invitationIntro.hidden = true;
    invitationIntro.classList.remove('is-leaving', 'is-open', 'is-opening');
    invitationIntro.setAttribute('aria-hidden', 'true');
    body.classList.remove('invitation-active');
    invitationHideTimer = 0;
  }, reducedMotion ? 0 : 520);
};

if (readStoredValue('wedding-invitation-seen') === 'true') {
  languageGate?.classList.add('is-done');
  invitationIntro.hidden = true;
  invitationIntro.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('returning-visitor');
} else {
  body.classList.add('language-gate-open');
  revealInvitation();
}

openEnvelope.addEventListener('click', () => {
  if (invitationIntro.classList.contains('is-open') || invitationIntro.classList.contains('is-opening')) return;
  clearTimeout(invitationFocusTimer);
  clearTimeout(invitationReplayTimer);
  invitationIntro.classList.remove('is-preparing', 'is-replaying');
  invitationIntro.classList.add('is-opening');
  envelopeStage.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => invitationIntro.classList.add('is-open'));
  invitationOpenTimer = setTimeout(() => {
    invitationIntro.classList.remove('is-opening');
    enterSite.focus({ preventScroll: true });
    invitationOpenTimer = 0;
  }, reducedMotion ? 0 : 850);
});
openEnvelope.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  openEnvelope.click();
});
enterSite.addEventListener('click', enterCelebration);
introClose.addEventListener('click', enterCelebration);
suiteCards.forEach((card) => card.addEventListener('click', (event) => {
  event.preventDefault();
  const target = document.querySelector(card.getAttribute('href'));
  enterCelebration();
  setTimeout(() => target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }), reducedMotion ? 0 : 650);
}));
suiteCards.forEach((card) => {
  card.addEventListener('pointerenter', () => suiteComposite?.classList.add('is-action-hovered'));
  card.addEventListener('pointermove', (event) => {
    if (reducedMotion || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    card.style.setProperty('--spot-x', `${event.offsetX}px`);
    card.style.setProperty('--spot-y', `${event.offsetY}px`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.removeProperty('--spot-x');
    card.style.removeProperty('--spot-y');
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

menuToggle.addEventListener('click', () => {
  setMenuOpen(!body.classList.contains('menu-open'));
});

skipLink?.addEventListener('click', () => requestAnimationFrame(() => skipLink.blur()));

document.addEventListener('click', (event) => {
  if (!body.classList.contains('menu-open') || header.contains(event.target)) return;
  setMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && languageGate && !languageGate.classList.contains('is-done')) {
    dismissLanguageGate();
    return;
  }
  if (event.key === 'Escape' && body.classList.contains('invitation-active')) {
    enterCelebration();
    return;
  }
  if (event.key === 'Escape' && body.classList.contains('menu-open')) {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

navLinks.forEach((link) => link.addEventListener('click', (event) => {
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
  navStory: ['Our story', 'Nuestra historia'], navSchedule: ['Schedule', 'Programa'], navTravel: ['Travel', 'Viaje'], navWelcome: ['Welcome', 'Bienvenida'], navDate: ['The date', 'La fecha'], navDetails: ['Details', 'Detalles'], navCity: ['Explore', 'Explorar'], navCheckIn: ['Check-In', 'Registro'],
  introKicker: ['The Wedding Of', 'La boda de'], openEnvelope: ['Click to open', 'Haz clic para abrir'], openInvitation: ['Open invitation', 'Abrir invitación'], closeInvitation: ['Close invitation', 'Cerrar invitación'], inviteEyebrow: ['With joy', 'Con alegría'], inviteFamily: ['Together with their families', 'Con sus familias'], inviteCopy: ['request the pleasure of your company as they celebrate their marriage.', 'tienen el gusto de invitarlos a celebrar su matrimonio.'], inviteVenue: ['Hotel Piedra Viva<br>Tepoztlán, Morelos · México', 'Hotel Piedra Viva<br>Tepoztlán, Morelos · México'], enterSite: ['Enter our celebration <span aria-hidden="true">→</span>', 'Entrar al sitio <span aria-hidden="true">→</span>'], invitationEnter: ['Review', 'Revisar'], enterInvitation: ['Enter the wedding website', 'Entrar al sitio de la boda'], viewGallery: ['See Gallery', 'Ver galería'], viewGalleryAction: ['View gallery and enter the wedding website', 'Ver la galería y entrar al sitio de la boda'], viewInvitation: ['Invitation', 'Invitación'], skipToContent: ['Skip to content', 'Ir al contenido'], partyPlaceholder: ['Names of everyone in your party', 'Nombres de todos los asistentes'],
  heroEyebrow: ['The wedding of', 'La boda de'],
  heroQuote: ['Among mountains, flowers and light,<br>we celebrate our love.', 'Entre montañas, flores y luz,<br>celebramos nuestro amor.'],
  confirmAttendance: ['Confirm attendance', 'Confirmar asistencia'], seeDay: ['See the day', 'Ver el programa'],
  arrivalTitle: ['Guest arrival', 'Llegada de invitados'], arrivalDesc: ['Welcome drinks and a little time to settle into the gardens.', 'Bebidas de bienvenida y un rato para disfrutar los jardines.'],
  ceremonyTitle: ['Ceremony', 'Ceremonia'], ceremonyDesc: ['Join us outdoors as we exchange vows beneath the mountains.', 'Acompáñennos al aire libre para intercambiar nuestros votos frente a las montañas.'],
  cocktailTitle: ['Cocktail hour', 'Hora del cóctel'], cocktailDesc: ['Cocktails, music and small bites in the courtyard.', 'Cócteles, música y bocadillos en el patio.'],
  receptionTitle: ['Reception', 'Recepción'], receptionDesc: ['Find your table and raise a glass as the evening begins.', 'Busquen su mesa y brinden con nosotros para comenzar la noche.'],
  dinnerTitle: ['Dinner', 'Cena'], dinnerDesc: ['A candlelit meal inspired by the flavours of Mexico.', 'Una cena a la luz de las velas inspirada en los sabores de México.'],
  partyTitle: ['Party', 'Fiesta'], partyDesc: ['Meet us on the dance floor and stay as long as you can.', 'Nos vemos en la pista de baile. Quédense todo lo que puedan.'],
  antojitosDesc: ['A late-night Mexican snack before one last dance.', 'Antojitos de madrugada antes del último baile.'],
  finDesc: ['Carriages, hugs and a very happy goodnight.', 'Abrazos y buenas noches.'],
  travelWeddingDay: ['Wedding day', 'Día de la boda'],
  travelWeddingDayCopy: ['Our ceremony will begin at 2:45 PM at La Cascada. Please arrive at 2:00 PM. After we say “I do,” we’ll celebrate with drinks and canapés at cocktail hour before moving inside for dinner, speeches, and dancing the night away.', 'La ceremonia comienza a las 2:45 PM en La Cascada. Les pedimos llegar a las 2:00 PM. Después del “sí, acepto” habrá cócteles y canapés. Luego pasaremos a la cena, los discursos y el baile.'],
  travelAccommodation: ['Accommodation', 'Estancia'],
  travelAccommodationCopy: ['Hotel Piedra Viva is a 1.5-hour drive from Mexico City. We recommend staying at the hotel; rooms are limited, so close family will be given priority.', 'Hotel Piedra Viva está a una hora y media de la Ciudad de México. Recomendamos hospedarse ahí. Hay pocas habitaciones, así que daremos prioridad a la familia cercana.'],
  travelAccommodationMore: ['$2,250 MXN per night for two (about $180 CAD); a 3rd or 4th guest in a double suite is $850 MXN each. Tepoztlán also has lovely boutique hotels nearby.', '$2,250 MXN por noche para dos personas. La tercera o cuarta persona en una suite doble paga $850 MXN. También hay buenos hoteles boutique cerca.'],
  travelTransport: ['Transport', 'Transporte'],
  travelTransportAirport: ['<strong>Airport</strong><br>Benito Juárez International (MEX). Roma, Condesa and Reforma are about 30–45 minutes away by taxi or Uber; allow longer at rush hour.', '<strong>Aeropuerto</strong><br>Aeropuerto Internacional Benito Juárez (MEX). Roma, Condesa y Reforma quedan a unos 30–45 minutos en taxi o Uber. En hora pico puede tomar más.'],
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
  tepoztlanIntro: ['Tepoztlán is a colourful mountain town with a relaxed pace, beautiful old buildings and plenty to explore.', 'Tepoztlán es un pueblo de montaña tranquilo, colorido y con mucho por conocer.'],
  tepoztlanStay: ['Spend some time wandering through the market, stop by the Ex-Convento de la Natividad, or hike up El Tepozteco if you’re feeling adventurous. There are also lots of great little cafés and places to eat along the way.', 'Dense una vuelta por el mercado, visiten el Ex Convento de la Natividad o suban al Tepozteco si tienen ganas de caminar. También hay muchos cafés y buenos lugares para comer.'],
  tepoztlanMapNote: ['Use the map to begin exploring the town and the places surrounding our venue.', 'Usen el mapa para explorar el pueblo y los lugares cercanos al hotel.'],
  tepoztlanMap: ['See on map <span aria-hidden="true">↗</span>', 'Ver en el mapa <span aria-hidden="true">↗</span>'],
  romaLabel: ['Roma Norte', 'Roma Norte'], romaCaption: ['Leafy streets, galleries and cafés', 'Calles arboladas, galerías y cafés'], bellasLabel: ['Bellas Artes', 'Bellas Artes'], bellasCaption: ['Architecture, murals and golden light', 'Arquitectura, murales y luz dorada'],
  conventLabel: ['The Ex-Convent', 'El Ex Convento'], conventCaption: ['Stone courtyards and centuries of history', 'Patios de piedra y siglos de historia'], ridgeLabel: ['The Tepozteco', 'El Tepozteco'], ridgeCaption: ['Dramatic mountains above the town', 'Montañas imponentes sobre el pueblo'],
  ofrendaCopy: ['We kindly invite you to bring a small framed photo of a loved one who is no longer with us. In keeping with tradition, we will be preparing an <em>ofrenda</em> to honour and remember those who remain in our hearts.', 'Los invitamos a traer una foto pequeña y enmarcada de un ser querido que ya no esté con nosotros. Prepararemos una <em>ofrenda</em> para recordarlos y tenerlos presentes.'],
  giftSummary: ['Your presence is the greatest gift we could receive.', 'Su presencia es el mejor regalo para nosotros.'],
  giftDetails: ['Gift details', 'Detalles del regalo'],
  giftCopy: ['If you would like to give something, a contribution toward our future would be deeply appreciated. Canadian guests may send an e-transfer to valeriaandseanharrigan@gmail.com. We kindly ask for electronic transfers only, rather than cash. Thank you.', 'Si desean hacernos un regalo, agradeceríamos mucho una aportación para nuestro futuro. Para los invitados en México, compartiremos los datos de transferencia más cerca de la fecha. Les pedimos no traer efectivo. Gracias.'],
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
  faqKicker: ['Good to know', 'Información útil'], faqTitle: ['Frequently asked<br><em>questions</em>.', 'Preguntas<br><em>frecuentes</em>.'], faqGuestQuestion: ['Can I bring a guest?', '¿Puedo llevar acompañante?'], faqChildrenQuestion: ['Are children invited?', '¿Están invitados los niños?'], faqArrivalQuestion: ['When should I arrive?', '¿Cuándo debo llegar?'], faqIndoorsQuestion: ['Is the celebration indoors or outdoors?', '¿La celebración es interior o exterior?'], faqLocalTransportQuestion: ['How should I get around Tepoztlán?', '¿Cómo debo moverme en Tepoztlán?'], faqContactQuestion: ['Who can I contact?', '¿A quién puedo contactar?'],
  welcomeTitle: ['Welcome', 'Bienvenidos'],
  saveEyebrow: ['Our wedding day', 'El día de nuestra boda'], saveWord: ['Save', 'Reserva'], theWord: ['the', 'la'], dateWord: ['Date', 'Fecha'], saveDate: ['Tuesday, November 3, 2026', 'Martes, 3 de noviembre de 2026'], saveDateCopy: ['Our ceremony begins at 2:45 PM at La Cascada. Please arrive at 2:00 PM. After we say “I do,” we’ll celebrate with drinks and canapés at cocktail hour before moving inside for dinner, speeches, and dancing the night away.', 'La ceremonia comienza a las 2:45 PM en La Cascada. Les pedimos llegar a las 2:00 PM. Después del “sí, acepto” habrá cócteles y canapés. Luego pasaremos a la cena, los discursos y el baile.'],
  detailsKicker: ['The gathering', 'El encuentro'], detailsTitle: ['Wedding details', 'Detalles de la boda'], venueTitle: ['Venue', 'Lugar'], openMap: ['Open map', 'Abrir mapa'], dressTitle: ['Dress code', 'Código de vestimenta'], formalAttire: ['Formal attire', 'Vestimenta formal'], programEyebrow: ['The order of the day', 'El orden del día'], celebrationTitle: ['Celebration', 'Celebración'],
  travelKicker: ['The journey', 'El viaje'], travelTitle: ['Travel', 'Viaje'], browseHotels: ['Browse hotels', 'Ver hoteles'],
  travelSubline: ['For those travelling from afar', 'Para quienes viajan desde lejos'], chapterSchedule: ['Schedule', 'Itinerario'], monthOct: ['Oct', 'Oct'], monthNov: ['Nov', 'Nov'],
  hoodRoma: ['Leafy streets, cafés and galleries. Lively and central; a little noisy on weekends.', 'Calles arboladas, cafés y galerías. Animada y céntrica; algo ruidosa los fines de semana.'], hoodCondesa: ['Art-deco blocks around two parks, great restaurants. Calmer evenings, slightly further from the centre.', 'Edificios art déco alrededor de dos parques y muy buenos restaurantes. Noches más tranquilas, un poco más lejos del centro.'], hoodReforma: ['Grand avenue by Chapultepec park with the big hotels. Polished and easy, but more corporate after dark.', 'Gran avenida junto a Chapultepec con los hoteles grandes. Cómoda y elegante, aunque más corporativa de noche.'], hoodCentro: ['The Zócalo, Bellas Artes and the museums on your doorstep. Atmospheric by day; quieter and older hotels at night.', 'El Zócalo, Bellas Artes y los museos a un paso. Con mucho ambiente de día; de noche es más tranquilo y los hoteles son más antiguos.'],
  cityArriving: ['Arriving', 'Llegada'], cityStayTitle: ['Where to stay', 'Dónde hospedarse'], tepoztlanKicker: ['Things to do in', 'Qué hacer en'], weatherDays: ['Days', 'Días'], weatherNights: ['Nights', 'Noches'],
  cityEyebrow: ['Explore Mexico with us', 'Explora México con nosotros'], cityTitle: ['Things to do<br>in the <em>City</em>.', 'Qué hacer<br>en la <em>Ciudad</em>.'],
  specialEyebrow: ['A special request', 'Una petición especial'], specialTitle: ['<span>For those who<br>remain in</span> <em>Spirit</em>.', '<span>Para quienes siguen<br>con nosotros en</span> <em>espíritu</em>.'], giftsEyebrow: ['Gifts', 'Regalos'], giftsTitle: ['<span>Your presence<br>is our</span> <em>gift</em>.', '<span>Su presencia<br>es nuestro mejor</span> <em>regalo</em>.'],
  weekTitle: ['A week<br>in <em>México</em>.', 'Una semana<br>en <em>México</em>.'], weekBrief: ['Arrive early, stay a little longer, and make the celebration part of a beautiful week away.', 'Lleguen antes, quédense unos días y disfruten una semana completa en México.'],
  weekArrival: ['Arrive in Mexico City', 'Llegada a la Ciudad de México'], weekArrivalCopy: ['Land in the capital, settle in and begin your Mexico City adventure.', 'Lleguen, instálense y empiecen a recorrer la ciudad.'], weekMuertos: ['Día de Muertos parade', 'Desfile de Día de Muertos'], weekMuertosCopy: ['Experience the city in its most luminous season—marigolds, music and remembrance.', 'Disfruten la ciudad entre cempasúchil, música y recuerdos.'], weekTravel: ['Travel to Tepoztlán', 'Viaje a Tepoztlán'], weekTravelCopy: ['Head south into the mountains; the journey from Mexico City is roughly ninety minutes.', 'El viaje desde la Ciudad de México dura aproximadamente noventa minutos.'], weekWedding: ['Wedding day', 'Día de la boda'], weekWeddingCopy: ['Gather with us at Hotel Piedra Viva for an afternoon and evening under the Tepozteco.', 'Pasen la tarde y la noche con nosotros en Hotel Piedra Viva, al pie del Tepozteco.'], weekPool: ['Pool day or hike', 'Día de alberca o caminata'], weekPoolCopy: ['Keep the day unhurried—cool off by the pool or take in the panoramic mountain trail.', 'Tómense el día con calma: alberca o caminata por la montaña.'], weekReturn: ['Return to Mexico City', 'Regreso a la Ciudad de México'], weekReturnCopy: ['Travel back to the city with a little time left for one last coffee or market visit.', 'Regresen a la ciudad con tiempo para un último café o una visita al mercado.'],
  countdownTitle: ['<em>The</em> <span>Countdown</span>', '<em>La</em> <span>cuenta regresiva</span>'],
  checkInKicker: ['Your journey', 'Su viaje'], checkInTitle: ['<span>Check</span>-<em>In</em>', '<span>Registro</span>'], checkInIntro: ['Share your travel dates and menu preferences so we can prepare a thoughtful welcome for everyone joining us in Tepoztlán.', 'Compartan sus fechas de viaje y preferencias de menú para ayudarnos a preparar todo.'], partyLabel: ['Who is coming?', '¿Quiénes vienen?'], phoneLabel: ['Phone number', 'Teléfono'], arrivalDateLabel: ['Arrival date', 'Fecha de llegada'], departureDateLabel: ['Departure date', 'Fecha de salida'], starterLegend: ['Starters', 'Entradas'], starterNote: ['Final dishes will be confirmed closer to the date.', 'Confirmaremos los platillos más cerca de la fecha.'], beetSalad: ['Beet salad', 'Ensalada de betabel'], pumpkinSoup: ['Roasted pumpkin soup', 'Crema de calabaza rostizada'], vegetarianOption: ['Vegetarian', 'Vegetariano'], mainLegend: ['Main course', 'Plato fuerte'], salmonOption: ['Salmon', 'Salmón'], steakOption: ['Steak', 'Filete'], dietaryLabel: ['Allergies or dietary notes', 'Alergias o restricciones alimentarias'], checkInSubmit: ['Prepare Check-In email <span aria-hidden="true">→</span>', 'Preparar correo de confirmación <span aria-hidden="true">→</span>'], closingTitle: ['We cannot wait<br>to celebrate together.', 'Ya queremos<br>celebrar juntos.']
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
};

// The header's EN/ES and the envelope's discreet control both open the frosted language gate.
const openLanguageGate = () => {
  if (!languageGate) return;
  setMenuOpen(false);
  languageGate.classList.remove('is-clearing');
  languageGate.classList.remove('is-done');
  body.classList.add('language-gate-open');
  setTimeout(() => document.querySelector('.language-gate-panel')?.focus({ preventScroll: true }), reducedMotion ? 0 : 350);
};
const dismissLanguageGate = () => {
  if (!languageGate || languageGate.classList.contains('is-done')) return;
  languageGate.classList.add('is-done');
  body.classList.remove('language-gate-open');
};
languageToggle.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  openLanguageGate();
});
introLanguageToggle.addEventListener('click', openLanguageGate);
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
checkInForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const party = data.get('party');
  const email = data.get('email');
  const phone = data.get('phone');
  const arrival = data.get('arrival');
  const departure = data.get('departure');
  const starter = data.get('starter');
  const main = data.get('main');
  const spanish = currentLanguage === 'es';
  const notes = data.get('notes') || (spanish ? 'Ninguna' : 'None');
  const subject = encodeURIComponent(spanish ? `Confirmación de boda — ${party}` : `Wedding Check-In — ${party}`);
  const message = encodeURIComponent(spanish
    ? `Asistentes: ${party}\nCorreo: ${email}\nTeléfono: ${phone || 'No indicado'}\nLlegada: ${arrival}\nSalida: ${departure}\nEntrada: ${starter}\nPlato fuerte: ${main}\nAlergias o restricciones: ${notes}`
    : `Who is coming: ${party}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nArrival: ${arrival}\nDeparture: ${departure}\nStarter: ${starter}\nMain course: ${main}\nAllergy or dietary notes: ${notes}`);
  document.getElementById('form-status').textContent = currentLanguage === 'es'
    ? 'Gracias. Se abrirá su correo con la confirmación preparada.'
    : 'Thank you — your email app is opening with your Check-In prepared.';
  window.location.href = `mailto:valeriaandseanharrigan@gmail.com?subject=${subject}&body=${message}`;
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
    body.classList.remove('language-gate-open');
    if (body.classList.contains('invitation-active')) openEnvelope.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 1550);
}));

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
  suiteHotspotStage.querySelectorAll('.suite-hotspot').forEach((spot) => {
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
