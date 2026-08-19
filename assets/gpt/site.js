const body = document.body;
const header = document.getElementById('site-header');
const menuToggle = document.getElementById('menu-toggle');
const navLinks = [...document.querySelectorAll('.nav-link')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const languageToggle = document.getElementById('language-toggle');
const invitationIntro = document.getElementById('invitation-intro');
const openEnvelope = document.getElementById('open-envelope');
const enterSite = document.getElementById('enter-site');
const introClose = document.getElementById('intro-close');
const invitationReplay = document.getElementById('invitation-replay');

const revealInvitation = (directlyOpen = false) => {
  invitationIntro.hidden = false;
  body.classList.add('invitation-active');
  invitationIntro.classList.toggle('is-open', directlyOpen);
  invitationIntro.setAttribute('aria-hidden', 'false');
  if (directlyOpen) setTimeout(() => enterSite.focus(), reducedMotion ? 0 : 480);
  else setTimeout(() => openEnvelope.focus(), reducedMotion ? 0 : 80);
};

const enterCelebration = () => {
  invitationIntro.classList.add('is-leaving');
  body.classList.remove('invitation-active');
  localStorage.setItem('wedding-invitation-seen', 'true');
  setTimeout(() => {
    invitationIntro.hidden = true;
    invitationIntro.classList.remove('is-leaving', 'is-open');
    invitationIntro.setAttribute('aria-hidden', 'true');
  }, reducedMotion ? 0 : 640);
};

if (localStorage.getItem('wedding-invitation-seen') === 'true') {
  invitationIntro.hidden = true;
  invitationIntro.setAttribute('aria-hidden', 'true');
} else {
  revealInvitation();
}

openEnvelope.addEventListener('click', () => {
  invitationIntro.classList.add('is-open');
  setTimeout(() => enterSite.focus(), reducedMotion ? 0 : 560);
});
enterSite.addEventListener('click', enterCelebration);
introClose.addEventListener('click', enterCelebration);
invitationReplay.addEventListener('click', () => revealInvitation(true));

menuToggle.addEventListener('click', () => {
  const open = body.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});

document.addEventListener('click', (event) => {
  if (!body.classList.contains('menu-open') || header.contains(event.target)) return;
  body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && body.classList.contains('invitation-active')) {
    enterCelebration();
    return;
  }
  if (event.key === 'Escape' && body.classList.contains('menu-open')) {
    body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.focus();
  }
});

navLinks.forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  const target = document.querySelector(link.getAttribute('href'));
  body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
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
};
addEventListener('scroll', updateScroll, { passive: true });
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

document.querySelectorAll('.schedule-card').forEach((card) => {
  card.addEventListener('click', () => card.blur());
});

const uiTranslations = {
  navStory: ['Our story', 'Nuestra historia'], navSchedule: ['Schedule', 'Programa'], navTravel: ['Travel', 'Viaje'],
  introKicker: ['The wedding of', 'La boda de'], openEnvelope: ['Open your invitation', 'Abrir la invitación'], inviteEyebrow: ['You are invited', 'Están cordialmente invitados'], inviteFamily: ['Together with their families', 'Junto con sus familias'], inviteCopy: ['request the honour of your presence at the celebration of their marriage.', 'solicitan el honor de su presencia para celebrar su matrimonio.'], inviteVenue: ['Hotel Piedra Viva<br>Tepoztlán, Morelos · México', 'Hotel Piedra Viva<br>Tepoztlán, Morelos · México'], enterSite: ['Enter our celebration <span aria-hidden="true">→</span>', 'Entrar a la celebración <span aria-hidden="true">→</span>'], viewInvitation: ['Invitation', 'Invitación'],
  heroEyebrow: ['The wedding of', 'La boda de'],
  heroQuote: ['Among mountains, flowers and light,<br>we celebrate our love.', 'Entre montañas, flores y luz,<br>celebramos nuestro amor.'],
  confirmAttendance: ['Confirm attendance', 'Confirmar asistencia'], seeDay: ['See the day', 'Ver el programa'],
  arrivalTitle: ['Guest arrival', 'Llegada de invitados'], arrivalDesc: ['Welcome drinks and a little time to settle into the gardens.', 'Bebidas de bienvenida y tiempo para disfrutar de los jardines.'],
  ceremonyTitle: ['Ceremony', 'Ceremonia'], ceremonyDesc: ['Join us outdoors as we exchange vows beneath the mountains.', 'Acompáñenos al aire libre mientras intercambiamos votos entre las montañas.'],
  cocktailTitle: ['Cocktail hour', 'Hora del cóctel'], cocktailDesc: ['Cocktails, music and small bites in the courtyard.', 'Cócteles, música y bocadillos en el patio.'],
  receptionTitle: ['Reception', 'Recepción'], receptionDesc: ['Find your table and raise a glass as the evening begins.', 'Encuentra tu mesa y brinda con nosotros al comenzar la noche.'],
  dinnerTitle: ['Dinner', 'Cena'], dinnerDesc: ['A candlelit meal inspired by the flavours of Mexico.', 'Una cena a la luz de las velas inspirada en los sabores de México.'],
  partyTitle: ['Party', 'Fiesta'], partyDesc: ['Meet us on the dance floor and stay as long as you can.', 'Nos vemos en la pista de baile; quédate todo lo que puedas.'],
  antojitosDesc: ['A late-night Mexican snack before one last dance.', 'Antojitos mexicanos de medianoche antes del último baile.'],
  finDesc: ['Carriages, hugs and a very happy goodnight.', 'Despedidas, abrazos y muy buenas noches.']
};

const phraseTranslations = new Map(Object.entries({
  'Welcome':'Bienvenidos','Hand in hand, a new chapter.':'De la mano, un nuevo capítulo.',
  'It is our delight to welcome you to our wedding celebration. We cannot wait to gather with the people we love most in the mountains of Tepoztlán.':'Nos llena de alegría darles la bienvenida a nuestra boda. No podemos esperar para reunirnos con quienes más amamos entre las montañas de Tepoztlán.',
  'Please join us before God on Tuesday, November 3, 2026, at Hotel Piedra Viva.':'Acompáñennos ante Dios el martes 3 de noviembre de 2026 en Hotel Piedra Viva.',
  'Discover Tepoztlán':'Descubrir Tepoztlán','Tuesday · November 3':'Martes · 3 de noviembre','The celebration':'La celebración',
  'A mountain town of stone, colour and history—held beneath the dramatic Tepozteco ridge and filled with markets, gardens and centuries-old architecture.':'Un pueblo de piedra, color e historia, protegido por la sierra del Tepozteco y lleno de mercados, jardines y arquitectura centenaria.',
  'The town':'El pueblo','The mountains':'Las montañas','Earth & flowers':'Tierra y flores','Our palette':'Nuestra paleta',
  'Plan your stay':'Planea tu estancia','Getting there & staying.':'Cómo llegar y dónde hospedarse.','Venue':'Lugar','Getting there':'Cómo llegar','Where to stay':'Dónde hospedarse','Local transport':'Transporte local','November weather':'Clima en noviembre','Browse hotels':'Ver hoteles','Open map':'Abrir mapa',
  'For those travelling afar':'Para quienes viajan desde lejos','A week in Mexico.':'Una semana en México.','View our city map':'Ver nuestro mapa','Arrive in Mexico City':'Llegada a Ciudad de México','Día de Muertos parade':'Desfile de Día de Muertos','Travel to Tepoztlán':'Viaje a Tepoztlán','Wedding day':'Día de la boda','Pool day or hike Tepozteco':'Día de alberca o caminata al Tepozteco','Return to Mexico City':'Regreso a Ciudad de México',
  'What to wear':'Código de vestimenta','Formal attire, fall colours.':'Vestimenta formal, colores otoñales.','Formal attire is encouraged and warm autumn tones are welcomed. Above all, wear whatever makes you feel comfortable and beautiful.':'Sugerimos vestimenta formal y tonos cálidos de otoño. Sobre todo, usa algo que te haga sentir cómodo y hermoso.','Sun-washed colour':'Color bajo el sol','Terracotta & ivory':'Terracota y marfil','Candlelit gold':'Dorado a la luz de las velas','Olive & cream':'Olivo y crema',
  'A special request':'Una petición especial','For those who remain in spirit.':'Para quienes permanecen en espíritu.','Gifts':'Regalos','Your presence is our gift.':'Su presencia es nuestro regalo.','Contact us':'Contáctanos',
  'Good to know':'Información útil','Frequently asked questions.':'Preguntas frecuentes.','Can I bring a guest?':'¿Puedo llevar un acompañante?','Are children invited?':'¿Están invitados los niños?','When should I arrive?':'¿Cuándo debo llegar?','Is the celebration indoors or outdoors?':'¿La celebración es interior o exterior?','Will transportation be provided?':'¿Habrá transporte?','Who can I contact?':'¿A quién puedo contactar?',
  'Please reply by March 30, 2026':'Favor de responder antes del 30 de marzo de 2026','Nos vemos en Tepoztlán.':'Nos vemos en Tepoztlán.','One response per person, please. Un formulario por persona.':'Una respuesta por persona, por favor.','Your name · Tu nombre':'Tu nombre · Your name','Will you attend? · ¿Asistirás?':'¿Asistirás? · Will you attend?','Meal, allergy or note · Comida, alergia o nota':'Comida, alergia o nota · Meal, allergy or note','Prepare RSVP email →':'Preparar correo RSVP →',
  'Gracias':'Gracias','We cannot wait to celebrate together.':'No podemos esperar para celebrar juntos.','Until we say I do':'Hasta el gran día','The countdown':'La cuenta regresiva','Days':'Días','Hours':'Horas','Minutes':'Minutos','Seconds':'Segundos'
}));

const normalizeText = (value) => value.replace(/\s+/g, ' ').trim();
const translatedElements = [...document.querySelectorAll('p,h2,h3,a,label,figcaption,span,strong')]
  .map((element) => ({ element, key: normalizeText(element.textContent), english: element.innerHTML }))
  .filter((item) => phraseTranslations.has(item.key));

let currentLanguage = localStorage.getItem('wedding-language') === 'es' ? 'es' : 'en';
const renderLanguage = (language) => {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const pair = uiTranslations[element.dataset.i18n];
    if (pair) element.innerHTML = pair[language === 'es' ? 1 : 0];
  });
  translatedElements.forEach(({ element, key, english }) => {
    element.innerHTML = language === 'es' ? phraseTranslations.get(key) : english;
  });
  languageToggle.querySelector('.language-current').textContent = language.toUpperCase();
  languageToggle.querySelector('.language-next').textContent = language === 'en' ? 'ES' : 'EN';
  languageToggle.setAttribute('aria-label', language === 'en' ? 'Cambiar a español' : 'Switch to English');
  localStorage.setItem('wedding-language', language);
};

languageToggle.addEventListener('click', () => {
  body.classList.add('language-transition');
  setTimeout(() => {
    currentLanguage = currentLanguage === 'en' ? 'es' : 'en';
    renderLanguage(currentLanguage);
    body.classList.remove('language-transition');
  }, reducedMotion ? 0 : 190);
});
renderLanguage(currentLanguage);

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const key = visible.target.dataset.nav;
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${key}`));
}, { rootMargin: '-25% 0px -55% 0px', threshold: [0, .2, .5] });

document.querySelectorAll('[data-nav]').forEach((section) => sectionObserver.observe(section));

const headerToneObserver = new IntersectionObserver((entries) => {
  const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (current) header.classList.toggle('header-on-dark', current.target.dataset.headerTone === 'dark');
}, { rootMargin: '-18% 0px -68% 0px', threshold: [0, .2, .5] });
document.querySelectorAll('[data-header-tone]').forEach((section) => headerToneObserver.observe(section));

document.getElementById('rsvp-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const name = data.get('name');
  const email = data.get('email');
  const attending = data.get('attending');
  const notes = data.get('notes') || 'None';
  const subject = encodeURIComponent(`Wedding RSVP — ${name}`);
  const message = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nResponse: ${attending}\nMeal, allergy or notes: ${notes}`);
  document.getElementById('form-status').textContent = 'Thank you — your email app is opening with your response prepared.';
  window.location.href = `mailto:valeriaandseanharrigan@gmail.com?subject=${subject}&body=${message}`;
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

const snapTargets = [...document.querySelectorAll('.hero,.intro,.celebration,.destination,.details,.itinerary,.dress,.special,.faq,.rsvp,.closing,.countdown,.footer')];
addEventListener('keydown', (event) => {
  if (!['ArrowDown', 'ArrowUp'].includes(event.key) || innerWidth <= 720) return;
  if (/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName)) return;
  event.preventDefault();
  const direction = event.key === 'ArrowDown' ? 1 : -1;
  const current = snapTargets.reduce((best, target, index) => Math.abs(target.offsetTop - scrollY) < Math.abs(snapTargets[best].offsetTop - scrollY) ? index : best, 0);
  const next = Math.max(0, Math.min(snapTargets.length - 1, current + direction));
  snapTargets[next].scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
});
