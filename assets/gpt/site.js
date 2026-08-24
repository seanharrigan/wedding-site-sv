const body = document.body;
const header = document.getElementById('site-header');
const menuToggle = document.getElementById('menu-toggle');
const navLinks = [...document.querySelectorAll('.nav-link')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const languageToggle = document.getElementById('language-toggle');
const introLanguageToggle = document.getElementById('intro-language-toggle');
const invitationIntro = document.getElementById('invitation-intro');
const openEnvelope = document.getElementById('open-envelope');
const enterSite = document.getElementById('enter-site');
const introClose = document.getElementById('intro-close');
const invitationReplay = document.getElementById('invitation-replay');
const envelopeStage = document.querySelector('.envelope-stage');
const suiteCards = [...document.querySelectorAll('.suite-card[href], .suite-hotspot[href]')];
const nav = document.getElementById('nav-links');
const mobileCurrent = document.getElementById('mobile-current');

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
  setTimeout(() => enterSite.focus(), reducedMotion ? 0 : 1550);
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
  setTimeout(() => invitationIntro.classList.remove('is-replaying'), reducedMotion ? 0 : 1500);
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
  travelWeddingDayCopy: ['Our ceremony will begin at 2:45 PM at La Cascada. Please arrive at 2:00 PM. After we say “I do,” we’ll celebrate with drinks and canapés at cocktail hour before moving inside for dinner, speeches, and dancing the night away.', 'Nuestra ceremonia comenzará a las 2:45 PM en La Cascada. Favor de llegar a las 2:00 PM. Después de dar el sí, celebraremos con cocteles y canapés durante la hora del cóctel antes de pasar al interior para la cena, los discursos y bailar toda la noche.'],
  travelAccommodation: ['Accommodation', 'Estancia'],
  travelAccommodationCopy: ['Hotel Piedra Viva is a 1.5-hour drive from Mexico City. We recommend staying at the hotel; rooms are limited, so close family will be given priority.', 'Hotel Piedra Viva está a 1.5 horas de la Ciudad de México. Recomendamos hospedarse en el hotel; el cupo es limitado, por lo que se dará prioridad a la familia cercana.'],
  travelAccommodationMore: ['$2,250 MXN per night for two (about $180 CAD); a 3rd or 4th guest in a double suite is $850 MXN each. Tepoztlán also has lovely boutique hotels nearby.', '$2,250 MXN por noche para dos; el tercer y cuarto huésped en suite doble pagan $850 MXN cada uno. Tepoztlán también cuenta con encantadores hoteles boutique cercanos.'],
  travelTransport: ['Transport', 'Transporte'],
  travelTransportAirport: ['<strong>Airport</strong><br>Benito Juárez International Airport in Mexico City.', '<strong>Aeropuerto</strong><br>Aeropuerto Internacional Benito Juárez'],
  travelTransportCity: ['<strong>Mexico City to Tepoztlán</strong><br>About 1.5 hours by private transfer, taxi, rideshare or rental car.', '<strong>CDMX a Tepoztlán</strong><br>Aproximadamente 1.5 horas en traslado privado, taxi, transporte por aplicación o auto rentado.'],
  travelTransportLocal: ['<strong>Tepoztlán to venue</strong><br>The town and nearby hotels are close by; taxis and rideshares are the easiest way over.', '<strong>Tepoztlán al recinto</strong><br>El pueblo y los hoteles cercanos están a poca distancia; los taxis y transportes por aplicación son la opción más sencilla.'],
  travelTransportParking: ['<strong>Parking</strong><br>Complimentary at Hotel Piedra Viva.', '<strong>Estacionamiento</strong><br>Gratuito en Hotel Piedra Viva.'],
  travelWeather: ['November weather', 'Clima en noviembre'],
  travelWeatherCopy: ['Dry and comfortable, with warm afternoons and cool evenings. Bring a light layer for after sunset.', 'Seco y agradable, con tardes cálidas y noches frescas. Lleva una capa ligera para después del atardecer.'],
  cityTab: ['Mexico City', 'Ciudad de México'], tepoztlanTab: ['Tepoztlán', 'Tepoztlán'],
  cityIntro: ['We’ve chosen our wedding dates to fall just after Día de los Muertos (November 1st), one of Mexico’s most meaningful and beautiful celebrations. If you are able, we would love for you to celebrate this day with us in Mexico City.', 'Para nuestros invitados del extranjero, escogimos la fecha cerca del Día de Muertos, una de las celebraciones más especiales de México. Si te es posible, nos encantaría que celebres este día con nosotros en la Ciudad de México.'],
  cityStay: ["For accommodation, we recommend staying in Roma Norte, Condesa, Reforma, or Centro Histórico, all well-located and easy to explore. Don't hesitate to contact us for more tips.", 'Para el alojamiento, recomendamos estancia en Colonia Roma, Condesa, Reforma o Centro Histórico, todas fáciles de recorrer y transportarse. Para más consejos, mándanos correo o mensaje.'],
  cityMap: ['View our city map', 'Ver nuestro mapa'],
  tepoztlanTitle: ['Things to do<br>in <em>Tepoztlán</em>.', 'Qué hacer<br>en <em>Tepoztlán</em>.'],
  tepoztlanIntro: ['A mountain town of stone, colour and history—held beneath the dramatic Tepozteco ridge and filled with markets, gardens and centuries-old architecture.', 'Un pueblo de piedra, color e historia, resguardado por la imponente sierra del Tepozteco y lleno de mercados, jardines y arquitectura centenaria.'],
  tepoztlanStay: ['Wander through the market, visit the Ex-Convento de la Natividad, or hike toward El Tepozteco for sweeping views. Leave some time simply to enjoy the town’s cafés, food and slower rhythm.', 'Recorre el mercado, visita el Ex Convento de la Natividad o camina hacia El Tepozteco para disfrutar de vistas panorámicas. Reserva también un poco de tiempo para los cafés, la comida y el ritmo tranquilo del pueblo.'],
  tepoztlanMapNote: ['Use the map to begin exploring the town and the places surrounding our venue.', 'Usa el mapa para comenzar a explorar el pueblo y los lugares cercanos a nuestro recinto.'],
  tepoztlanMap: ['Explore Tepoztlán', 'Explorar Tepoztlán'],
  romaLabel: ['Roma Norte', 'Roma Norte'], romaCaption: ['Leafy streets, galleries and cafés', 'Calles arboladas, galerías y cafés'], bellasLabel: ['Bellas Artes', 'Bellas Artes'], bellasCaption: ['Architecture, murals and golden light', 'Arquitectura, murales y luz dorada'],
  conventLabel: ['The Ex-Convent', 'El Ex Convento'], conventCaption: ['Stone courtyards and centuries of history', 'Patios de piedra y siglos de historia'], ridgeLabel: ['The Tepozteco', 'El Tepozteco'], ridgeCaption: ['Dramatic mountains above the town', 'Montañas imponentes sobre el pueblo'],
  ofrendaCopy: ['We kindly invite you to bring a small framed photo of a loved one who is no longer with us. In keeping with tradition, we will be preparing an <em>ofrenda</em> to honour and remember those who remain in our hearts.', 'Te invitamos a traer una foto enmarcada de alguien que ya no está con nosotros. Para seguir con la tradición, prepararemos una <em>ofrenda</em> para honrar y recordar a los que permanecen en nuestros corazones.'],
  giftSummary: ['Your presence is the greatest gift we could receive.', 'Tu presencia es el mayor regalo que podríamos recibir. Por favor, no te sientas obligado a traer un obsequio.'],
  giftDetails: ['Gift details', 'Detalles del regalo'],
  giftCopy: ['If you wish to give one, a monetary contribution toward our future would be deeply appreciated. For our Canadian guests, e-transfers may be sent to valeriaandseanharrigan@gmail.com. We kindly ask that any gifts be made via electronic transfer only, rather than cash. Thank you for your kindness and generosity.', 'Si deseas hacer un regalo, una contribución monetaria para nuestro futuro será profundamente apreciada. Para nuestros invitados en México, el regalo puede realizarse mediante transferencia electrónica. Te pedimos amablemente que sea únicamente por transferencia electrónica (no efectivo). Agradecemos mucho tu amabilidad y generosidad. Información de transferencia acercada la fecha.'],
  alcoholQuestion: ['Can I bring my own alcohol?', '¿Puedo traer mi propio alcohol?'],
  alcoholAnswer: ['No need! We’ll have an open bar throughout the celebration. Please note that the hotel does not allow outside alcohol. Just bring your best energy and get ready to celebrate!', '¡No es necesario! Tendremos barra libre durante toda la celebración. Ten en cuenta que el hotel no permite alcohol externo. ¡Solo trae tu mejor energía y prepárate para celebrar!'],
  welcomeCopy: ['We are delighted to welcome you<br>to our wedding website. Here, you will<br>find all the essential details for our special day.', 'Estamos super emocionados por recibirte<br>en nuestro sitio web. Aquí encontrarás<br>todos los detalles de nuestro día especial.'],
  cityMapNote: ['Please click on the map below to explore some of our favourite places in the City.', 'Dale click al mapa para explorar algunos de nuestros lugares favoritos en la Ciudad.'],
  dressCopy: ['Formal attire encouraged, fall colours welcomed. Feel free to wear whatever makes you feel comfortable.', 'Vestimenta formal. Colores otoñales bienvenidos. Asiste como te sientas más cómodo.'],
  faqGuestAnswer: ['Please refer to the names listed on your invitation. Reach out to Sean or Valeria if anything is unclear.', 'Por favor, consulta los nombres indicados en tu invitación. Comunícate con Sean o Valeria si tienes alguna duda.'],
  faqChildrenAnswer: ['Please follow the names on your invitation, or contact us directly with any questions.', 'Por favor, sigue los nombres indicados en tu invitación o contáctanos directamente si tienes alguna duda.'],
  faqArrivalAnswer: ['We recommend arriving in Mexico City by October 31 and travelling to Tepoztlán on November 2. Guest arrival at the venue begins at 2:00 PM on November 3.', 'Recomendamos llegar a Ciudad de México antes del 31 de octubre y viajar a Tepoztlán el 2 de noviembre. La llegada de invitados al lugar comienza a las 2:00 PM el 3 de noviembre.'],
  faqIndoorsAnswer: ['The ceremony begins outdoors. Dinner and dancing follow inside; bring a light layer for the cool evening.', 'La ceremonia comienza al aire libre. La cena y el baile serán en el interior; trae una capa ligera para la noche fresca.'],
  faqLocalTransportAnswer: ['Taxis and rideshare services are the simplest options between local accommodation and Hotel Piedra Viva. Complimentary parking is available at the venue.', 'Los taxis y transportes por aplicación son las opciones más sencillas entre los alojamientos locales y Hotel Piedra Viva. El recinto cuenta con estacionamiento gratuito.'],
  faqKicker: ['Good to know', 'Información útil'], faqTitle: ['Frequently<br>asked questions.', 'Preguntas<br>frecuentes.'], faqGuestQuestion: ['Can I bring a guest?', '¿Puedo llevar acompañante?'], faqChildrenQuestion: ['Are children invited?', '¿Están invitados los niños?'], faqArrivalQuestion: ['When should I arrive?', '¿Cuándo debo llegar?'], faqIndoorsQuestion: ['Is the celebration indoors or outdoors?', '¿La celebración es interior o exterior?'], faqLocalTransportQuestion: ['How should I get around Tepoztlán?', '¿Cómo debo moverme en Tepoztlán?'], faqContactQuestion: ['Who can I contact?', '¿A quién puedo contactar?'],
  welcomeTitle: ['Welcome', 'Bienvenidos'],
  saveEyebrow: ['Our wedding day', 'El día de nuestra boda'], saveWord: ['Save', 'Reserva'], theWord: ['the', 'la'], dateWord: ['Date', 'Fecha'], saveDate: ['Tuesday, November 3, 2026', 'Martes, 3 de noviembre de 2026'], saveDateCopy: ['Our ceremony begins at 2:45 PM at La Cascada. Please arrive at 2:00 PM. After we say “I do,” we’ll celebrate with drinks and canapés at cocktail hour before moving inside for dinner, speeches, and dancing the night away.', 'Nuestra ceremonia comienza a las 2:45 PM en La Cascada. Favor de llegar a las 2:00 PM. Después de dar el sí, celebraremos con cocteles y canapés durante la hora del cóctel antes de pasar al interior para la cena, los discursos y bailar toda la noche.'],
  detailsKicker: ['The gathering', 'El encuentro'], detailsTitle: ['Wedding details', 'Detalles de la boda'], venueTitle: ['Venue', 'Lugar'], openMap: ['Open map', 'Abrir mapa'], dressTitle: ['Dress code', 'Código de vestimenta'], formalAttire: ['Formal attire', 'Vestimenta formal'], programEyebrow: ['The order of the day', 'El orden del día'], celebrationTitle: ['Celebration', 'Celebración'],
  travelKicker: ['The journey', 'El viaje'], travelTitle: ['Travel', 'Viaje'], browseHotels: ['Browse hotels', 'Ver hoteles'],
  travelSubline: ['A week in México', 'Una semana en México'], chapterSchedule: ['Schedule', 'Itinerario'], monthOct: ['Oct', 'Oct'], monthNov: ['Nov', 'Nov'],
  cityArriving: ['Arriving', 'Llegada'], cityStayTitle: ['Where to stay', 'Dónde hospedarse'], tepoztlanKicker: ['Things to do in', 'Qué hacer en'], weatherDays: ['Days', 'Días'], weatherNights: ['Nights', 'Noches'],
  cityEyebrow: ['Explore Mexico with us', 'Explora México con nosotros'], cityTitle: ['Things to do<br>in the <em>City</em>.', 'Qué hacer<br>en la <em>Ciudad</em>.'],
  specialEyebrow: ['A special request', 'Una petición especial'], specialTitle: ['For those who<br>remain in spirit.', 'Para quienes<br>permanecen en espíritu.'], giftsEyebrow: ['Gifts', 'Regalos'], giftsTitle: ['Your presence<br>is our gift.', 'Su presencia<br>es nuestro regalo.'], contactUs: ['Contact us', 'Contáctanos'],
  weekKicker: ['For those travelling afar', 'Para quienes viajan desde lejos'], weekTitle: ['A week<br>in <em>Mexico</em>.', 'Una semana<br>en <em>México</em>.'], weekBrief: ['Arrive early, stay a little longer, and make the celebration part of a beautiful week away.', 'Llega antes, quédate un poco más y convierte la celebración en parte de una hermosa semana de viaje.'],
  weekArrival: ['Arrive in Mexico City', 'Llegada a Ciudad de México'], weekArrivalCopy: ['Land in the capital, settle in and begin your Mexico City adventure.', 'Llega a la capital, instálate y comienza tu aventura en la Ciudad de México.'], weekMuertos: ['Día de Muertos parade', 'Desfile de Día de Muertos'], weekMuertosCopy: ['Experience the city in its most luminous season—marigolds, music and remembrance.', 'Vive la ciudad en su temporada más luminosa: cempasúchil, música y memoria.'], weekTravel: ['Travel to Tepoztlán', 'Viaje a Tepoztlán'], weekTravelCopy: ['Head south into the mountains; the journey from Mexico City is roughly ninety minutes.', 'Viaja hacia las montañas; el trayecto desde la Ciudad de México dura aproximadamente noventa minutos.'], weekWedding: ['Wedding day', 'Día de la boda'], weekWeddingCopy: ['Gather with us at Hotel Piedra Viva for an afternoon and evening under the Tepozteco.', 'Acompáñanos en Hotel Piedra Viva para una tarde y noche bajo el Tepozteco.'], weekPool: ['Pool day or hike', 'Día de alberca o caminata'], weekPoolCopy: ['Keep the day unhurried—cool off by the pool or take in the panoramic mountain trail.', 'Disfruta el día sin prisa: descansa en la alberca o recorre el sendero panorámico de la montaña.'], weekReturn: ['Return to Mexico City', 'Regreso a Ciudad de México'], weekReturnCopy: ['Travel back to the city with a little time left for one last coffee or market visit.', 'Regresa a la ciudad con tiempo para un último café o una visita al mercado.'],
  checkInKicker: ['Your journey', 'Tu viaje'], checkInTitle: ['Check-In', 'Registro'], checkInIntro: ['Share your travel dates and menu preferences so we can prepare a thoughtful welcome for everyone joining us in Tepoztlán.', 'Comparte tus fechas de viaje y preferencias de menú para que podamos preparar una bienvenida especial para quienes nos acompañen en Tepoztlán.'], partyLabel: ['Who is coming?', '¿Quién viene?'], phoneLabel: ['Phone number', 'Número de teléfono'], arrivalDateLabel: ['Arrival date', 'Fecha de llegada'], departureDateLabel: ['Departure date', 'Fecha de salida'], starterLegend: ['Starter preference', 'Preferencia de entrada'], starterNote: ['Final dishes will be confirmed closer to the date.', 'Los platillos finales se confirmarán más cerca de la fecha.'], seasonalStarter: ['Seasonal starter', 'Entrada de temporada'], vegetarianStarter: ['Vegetarian starter', 'Entrada vegetariana'], mainLegend: ['Main course', 'Plato fuerte'], salmonOption: ['Salmon', 'Salmón'], steakOption: ['Steak', 'Filete'], dietaryLabel: ['Allergies or dietary notes', 'Alergias o notas alimentarias'], checkInSubmit: ['Prepare Check-In email <span aria-hidden="true">→</span>', 'Preparar correo de registro <span aria-hidden="true">→</span>'], closingTitle: ['We cannot wait<br>to celebrate together.', 'No podemos esperar<br>para celebrar juntos.']
};

const phraseTranslations = new Map(Object.entries({
  'Welcome':'Bienvenidos','Hand in hand, a new chapter.':'De la mano, un nuevo capítulo.',
  'It is our delight to welcome you to our wedding celebration. We cannot wait to gather with the people we love most in the mountains of Tepoztlán.':'Nos llena de alegría darles la bienvenida a nuestra boda. No podemos esperar para reunirnos con quienes más amamos entre las montañas de Tepoztlán.',
  'Please join us before God on Tuesday, November 3, 2026, at Hotel Piedra Viva.':'Acompáñennos ante Dios el martes 3 de noviembre de 2026 en Hotel Piedra Viva.',
  'Discover Tepoztlán':'Descubrir Tepoztlán','Tuesday · November 3':'Martes · 3 de noviembre','The celebration':'La celebración',
  'A mountain town of stone, colour and history—held beneath the dramatic Tepozteco ridge and filled with markets, gardens and centuries-old architecture.':'Un pueblo de piedra, color e historia, protegido por la sierra del Tepozteco y lleno de mercados, jardines y arquitectura centenaria.',
  'The town':'El pueblo','The mountains':'Las montañas','Earth & flowers':'Tierra y flores','Our palette':'Nuestra paleta',
  'Getting there & staying.':'Cómo llegar y dónde hospedarse.','Venue':'Lugar','Getting there':'Cómo llegar','Where to stay':'Dónde hospedarse','Local transport':'Transporte local','November weather':'Clima en noviembre','Browse hotels':'Ver hoteles','Open map':'Abrir mapa',
  'For those travelling afar':'Para quienes viajan desde lejos','A week in Mexico.':'Una semana en México.','View our city map':'Ver nuestro mapa','Arrive in Mexico City':'Llegada a Ciudad de México','Día de Muertos parade':'Desfile de Día de Muertos','Travel to Tepoztlán':'Viaje a Tepoztlán','Wedding day':'Día de la boda','Pool day or hike Tepozteco':'Día de alberca o caminata al Tepozteco','Return to Mexico City':'Regreso a Ciudad de México',
  'What to wear':'Código de vestimenta','Formal attire, fall colours.':'Vestimenta formal, colores otoñales.','Formal attire is encouraged and warm autumn tones are welcomed. Above all, wear whatever makes you feel comfortable and beautiful.':'Sugerimos vestimenta formal y tonos cálidos de otoño. Sobre todo, usa algo que te haga sentir cómodo y hermoso.','Sun-washed colour':'Color bajo el sol','Terracotta & ivory':'Terracota y marfil','Candlelit gold':'Dorado a la luz de las velas','Olive & cream':'Olivo y crema',
  'A special request':'Una petición especial','For those who remain in spirit.':'Para quienes permanecen en espíritu.','Gifts':'Regalos','Your presence is our gift.':'Su presencia es nuestro regalo.','Contact us':'Contáctanos',
  'Good to know':'Información útil','Frequently asked questions.':'Preguntas frecuentes.','Can I bring a guest?':'¿Puedo llevar un acompañante?','Are children invited?':'¿Están invitados los niños?','When should I arrive?':'¿Cuándo debo llegar?','Is the celebration indoors or outdoors?':'¿La celebración es interior o exterior?','Will transportation be provided?':'¿Habrá transporte?','Who can I contact?':'¿A quién puedo contactar?',
  'Gracias':'Gracias','We cannot wait to celebrate together.':'No podemos esperar para celebrar juntos.','Until we say I do':'Hasta el gran día','The countdown':'La cuenta regresiva','Days':'Días','Hours':'Horas','Minutes':'Minutos','Seconds':'Segundos'
}));

const normalizeText = (value) => value.replace(/\s+/g, ' ').trim();
const translatedElements = [...document.querySelectorAll('p,h2,h3,a,label,figcaption,span,strong')]
  .map((element) => ({ element, key: normalizeText(element.textContent), english: element.innerHTML }))
  .filter((item) => phraseTranslations.has(item.key));

const storedLanguage = localStorage.getItem('wedding-language');
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
  translatedElements.forEach(({ element, key, english }) => {
    element.innerHTML = language === 'es' ? phraseTranslations.get(key) : english;
  });
  languageToggle.querySelector('.language-current').textContent = language.toUpperCase();
  languageToggle.querySelector('.language-next').textContent = language === 'en' ? 'ES' : 'EN';
  languageToggle.setAttribute('aria-label', language === 'en' ? 'Cambiar a español' : 'Switch to English');
  introLanguageToggle.querySelector('.language-current').textContent = language.toUpperCase();
  introLanguageToggle.querySelector('.language-next').textContent = language === 'en' ? 'ES' : 'EN';
  introLanguageToggle.setAttribute('aria-label', language === 'en' ? 'Cambiar a español' : 'Switch to English');
  localStorage.setItem('wedding-language', language);
  syncNavigation();
};

languageToggle.addEventListener('click', () => {
  body.classList.add('language-transition');
  setTimeout(() => {
    currentLanguage = currentLanguage === 'en' ? 'es' : 'en';
    renderLanguage(currentLanguage);
    body.classList.remove('language-transition');
  }, reducedMotion ? 0 : 190);
});
introLanguageToggle.addEventListener('click', () => languageToggle.click());
renderLanguage(currentLanguage);

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const key = visible.target.dataset.nav;
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${key}`));
  syncNavigation();
}, { rootMargin: '-25% 0px -55% 0px', threshold: [0, .2, .5] });

document.querySelectorAll('[data-nav]').forEach((section) => sectionObserver.observe(section));
addEventListener('resize', syncNavigation);
syncNavigation();

const headerToneObserver = new IntersectionObserver((entries) => {
  const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (current) header.classList.toggle('header-on-dark', current.target.dataset.headerTone === 'dark');
}, { rootMargin: '-18% 0px -68% 0px', threshold: [0, .2, .5] });
document.querySelectorAll('[data-header-tone]').forEach((section) => headerToneObserver.observe(section));

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
  const notes = data.get('notes') || 'None';
  const subject = encodeURIComponent(`Wedding Check-In — ${party}`);
  const message = encodeURIComponent(`Who is coming: ${party}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nArrival: ${arrival}\nDeparture: ${departure}\nStarter: ${starter}\nMain course: ${main}\nAllergy or dietary notes: ${notes}`);
  document.getElementById('form-status').textContent = currentLanguage === 'es'
    ? 'Gracias. Tu aplicación de correo se abrirá con el registro preparado.'
    : 'Thank you — your email app is opening with your Check-In prepared.';
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
