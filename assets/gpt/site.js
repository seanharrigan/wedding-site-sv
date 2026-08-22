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
const envelopeStage = document.querySelector('.envelope-stage');
const suiteCards = [...document.querySelectorAll('.suite-card[href], .suite-hotspot[href]')];

const revealInvitation = () => {
  invitationIntro.hidden = false;
  body.classList.add('invitation-active');
  invitationIntro.classList.remove('is-open', 'is-leaving');
  invitationIntro.setAttribute('aria-hidden', 'false');
  envelopeStage.setAttribute('aria-hidden', 'true');
  setTimeout(() => openEnvelope.focus(), reducedMotion ? 0 : 180);
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
  envelopeStage.setAttribute('aria-hidden', 'false');
  setTimeout(() => enterSite.focus(), reducedMotion ? 0 : 860);
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
invitationReplay.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  invitationIntro.classList.add('is-replaying');
  revealInvitation();
  document.getElementById('home').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  setTimeout(() => invitationIntro.classList.remove('is-replaying'), reducedMotion ? 0 : 760);
});

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

const uiTranslations = {
  navStory: ['Our story', 'Nuestra historia'], navSchedule: ['Schedule', 'Programa'], navTravel: ['Travel', 'Viaje'],
  introKicker: ['The Wedding Of', 'La Boda De'], openEnvelope: ['Click to open', 'Haz clic para abrir'], openInvitation: ['Open invitation', 'Abrir invitación'], inviteEyebrow: ['With joy', 'Con alegría'], inviteFamily: ['Together with their families', 'Junto con sus familias'], inviteCopy: ['request the pleasure of your company as they celebrate their marriage.', 'solicitan el placer de su compañía para celebrar su matrimonio.'], inviteVenue: ['Hotel Piedra Viva<br>Tepoztlán, Morelos · México', 'Hotel Piedra Viva<br>Tepoztlán, Morelos · México'], enterSite: ['Enter our celebration <span aria-hidden="true">→</span>', 'Entrar a la celebración <span aria-hidden="true">→</span>'], viewInvitation: ['Invitation', 'Invitación'],
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
  finDesc: ['Carriages, hugs and a very happy goodnight.', 'Despedidas, abrazos y muy buenas noches.'],
  travelWeddingDay: ['Wedding day', 'Día de la boda'],
  travelWeddingDayCopy: ['Our ceremony will begin at 2:45 pm and will take place at El Gran Jardin. Please arrive at 2:00pm. After we say I do we’ll celebrate with drinks &amp; canapés at cocktail hour, before moving inside for dinner, speeches, and dancing the night away!', 'Nuestra ceremonia comenzará a las 2:45pm y se realizará en El Gran Jardin. Favor de llegar a las 2:00pm. Después de dar el sí, celebraremos con cocteles y canapés durante la hora de coctel, antes de pasar al interior para la cena, los discursos y bailar toda la noche!'],
  travelAccommodation: ['Accommodation', 'Estancia'],
  travelAccommodationCopy: ['Hotel Piedra Viva is approximately a 1.5-hour drive from Mexico City. For convenience, we recommend accommodation at the hotel. Due to limited capacity, priority will be given to close family members.', 'Hotel Piedra Viva se encuentra a 1.5 horas de la ciudad. Por conveniencia, recomendamos estancia en el hotel. Debido al límite de cupo, se dará prioridad a familia inmediata.'],
  travelAccommodationMore: ['Pricing per night is $2,250 MXN for 2 guests (approximately $180 CAD). For double suites, a 3rd and 4th guest are an additional $850 MXN per person. Tepoztlán is also home to many wonderful nearby boutique hotels, and we’ve listed several recommended options below for your convenience.', 'Gracias por tu comprensión. Hotel Piedra Viva precio por noche $2,250 MXN. Tepoztlán tiene otras alternativas cercanas enlistadas.'],
  travelTransport: ['Transport', 'Transporte'],
  travelTransportAirport: ['<strong>Airport</strong><br>Benito Juárez International Airport in Mexico City.', '<strong>Aeropuerto</strong><br>Aeropuerto Internacional Benito Juárez'],
  travelTransportCity: ['<strong>Mexico City to Tepoztlán</strong><br>Tepoztlán is approximately a 1.5-hour drive from the city, making it easily accessible by private transfer, taxi, Uber or car rental. Shuttle services will be available closer to the date. Please stay tuned.', '<strong>CDMX a Tepoztlán</strong><br>Tepoztlán se encuentra a una hora y media de la Ciudad con medios de transporte como Taxi, Uber o Autobús. El servicio de traslado del Hotel estará disponible acercada la fecha.'],
  travelTransportLocal: ['<strong>Tepoztlán to venue</strong><br>Tepoztlán is a small town, with all accommodation being close to the venue. The best method of transport will be via shuttle, Uber or taxi.', '<strong>Tepoztlán centro a Hotel Piedra Viva</strong><br>El mejor medio de transporte es Uber, Taxi o Servicio de traslado del Hotel. Más información por venir.'],
  travelTransportParking: ['<strong>Parking</strong><br>Hotel Piedra Viva offers complimentary parking.', '<strong>Estacionamiento</strong><br>Hotel Piedra Viva ofrecerá servicio gratuito de estacionamiento.'],
  travelWeather: ['November weather', 'Clima'],
  travelWeatherCopy: ['November in México is typically comfortable and pleasant, with warm days, cool nights, and minimal rain. Please bring a coat as night temperatures can drop.<br><strong>Day: 20–25° &nbsp; Night: 8–12°</strong>', 'En Noviembre, México es típicamente cómodo y agradable, con días calurosos, noches frías y lluvia mínima. Por favor, trae un abrigo o chamarra ya que la temperatura puede bajar.<br><strong>Día: 20–25° &nbsp; Noche: 8–12°</strong>'],
  cityIntro: ['We’ve chosen our wedding dates to fall just after Día de los Muertos (November 1st), one of Mexico’s most meaningful and beautiful celebrations. If you are able, we would love for you to celebrate this day with us in Mexico City.', 'Para nuestros invitados del extranjero, escogimos la fecha cerca del Día de Muertos, una de las celebraciones más especiales de México. Si te es posible, nos encantaría que celebres este día con nosotros.'],
  cityStay: ["For accommodation, we recommend staying in Roma Norte, Condesa, Reforma, or Centro Histórico, all well-located and easy to explore. Don't hesitate to contact us for more tips.", 'Para el alojamiento, recomendamos estancia en Colonia Roma, Condesa, Reforma o Centro Histórico, todas fáciles de recorrer y transportarse. Para más consejos, mándanos correo o mensaje.'],
  cityMap: ['View our city map', 'Ver nuestro mapa'],
  ofrendaCopy: ['We kindly invite you to bring a small framed photo of a loved one who is no longer with us. In keeping with tradition, we will be preparing an <em>ofrenda</em> to honour and remember those who remain in our hearts.', 'Te invitamos a traer una foto enmarcada de alguien que ya no está con nosotros. Para seguir con la tradición, prepararemos una <em>ofrenda</em> para honrar y recordar a los que permanecen en nuestros corazones.'],
  giftSummary: ['Your presence is the greatest gift we could receive.', 'Tu presencia es el mayor regalo que podríamos recibir. Por favor, no te sientas obligado a traer un obsequio.'],
  giftDetails: ['Gift details', 'Detalles del regalo'],
  giftCopy: ['If you wish to give one, a monetary contribution toward our future would be deeply appreciated. For our Canadian guests, e-transfers may be sent to valeriaandseanharrigan@gmail.com. We kindly ask that any gifts be made via electronic transfer only, rather than cash. Thank you for your kindness and generosity.', 'Si deseas hacer un regalo, una contribución monetaria para nuestro futuro será profundamente apreciada. Para nuestros invitados en México, el regalo puede realizarse mediante transferencia electrónica. Te pedimos amablemente que sea únicamente por transferencia electrónica (no efectivo). Agradecemos mucho tu amabilidad y generosidad. Información de transferencia acercada la fecha.'],
  alcoholQuestion: ['Can I bring my own alcohol?', '¿Puedo traer mi propio alcohol?'],
  alcoholAnswer: ['No need! We’ll have an open bar throughout the celebration. Please note that the hotel does not allow outside alcohol. Just bring your best energy and get ready to celebrate!', '¡No es necesario! Tendremos barra libre durante toda la celebración. Ten en cuenta que el hotel no permite alcohol externo. ¡Solo trae tu mejor energía y prepárate para celebrar!'],
  welcomeCopy: ['We are delighted to welcome you to our wedding website. Here, you will find all the essential details for our special day.', 'Estamos super emocionados por recibirte en nuestro sitio web. Aquí encontrarás todos los detalles de nuestro día especial.'],
  cityMapNote: ['Please click on the map below to explore some of our favourite places in the City.', 'Dale click al mapa para explorar algunos de nuestros lugares favoritos en la Ciudad.'],
  dressCopy: ['Formal attire encouraged, fall colours welcomed. Feel free to wear whatever makes you feel comfortable.', 'Vestimenta formal. Colores otoñales bienvenidos. Asiste como te sientas más cómodo.'],
  rsvpIntro: ['To help us plan accommodations and events, we kindly ask that you RSVP by March 30, 2026. Please don’t hesitate to reach out if you have any questions, we’re happy to help.', 'Para ayudarnos a organizar el alojamiento y las celebraciones, les pedimos amablemente que confirmen su asistencia antes del 30 de marzo de 2026. Si tienen alguna pregunta, no duden en contactarnos; con gusto les ayudaremos.'],
  faqGuestAnswer: ['Please refer to the names listed on your invitation. Reach out to Sean or Valeria if anything is unclear.', 'Por favor, consulta los nombres indicados en tu invitación. Comunícate con Sean o Valeria si tienes alguna duda.'],
  faqChildrenAnswer: ['Please follow the names on your invitation, or contact us directly with any questions.', 'Por favor, sigue los nombres indicados en tu invitación o contáctanos directamente si tienes alguna duda.'],
  faqArrivalAnswer: ['We recommend arriving in Mexico City by October 31 and travelling to Tepoztlán on November 2. Guest arrival at the venue begins at 2:00 PM on November 3.', 'Recomendamos llegar a Ciudad de México antes del 31 de octubre y viajar a Tepoztlán el 2 de noviembre. La llegada de invitados al lugar comienza a las 2:00 PM el 3 de noviembre.'],
  faqIndoorsAnswer: ['The ceremony begins outdoors. Dinner and dancing follow inside; bring a light layer for the cool evening.', 'La ceremonia comienza al aire libre. La cena y el baile serán en el interior; trae una capa ligera para la noche fresca.'],
  faqTransportAnswer: ['Shuttle details will be shared closer to the date. Taxis and rideshare options are also available locally.', 'Los detalles del servicio de traslado se compartirán más cerca de la fecha. También hay taxis y opciones de transporte por aplicación en la zona.']
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
  const phone = data.get('phone');
  const meal = data.get('meal');
  const notes = data.get('notes') || 'None';
  const subject = encodeURIComponent(`Wedding RSVP — ${name}`);
  const message = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nResponse: ${attending}\nMeal: ${meal}\nFood allergy or dietary restriction: ${notes}`);
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
