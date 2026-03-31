const landingPageTextDefaults = {
  nav_home_label: 'Inicio',
  nav_about_label: 'Quienes Somos',
  nav_news_label: 'Noticias',
  login_button_label: 'Ingresar',
  hero_title_line_1: 'Rompiendo barreras,',
  hero_title_line_2: 'impulsando aprendizajes',
  hero_description:
    'Con ABL Educacion, nuestros estudiantes acceden a nuevas actividades de matematica cada semana y pueden aprender incluso con conectividad limitada.',
  hero_primary_button_label: 'Registrarme',
  hero_secondary_button_label: 'Descargar app',
  about_chip_label: 'Quienes Somos',
  about_title: 'Tecnologia educativa con foco en resultados reales',
  about_description_1:
    'ABL Educacion acompana a docentes, directivos y estudiantes con recursos, seguimiento y reportes para fortalecer el aprendizaje de matematica.',
  about_description_2:
    'Combinamos actividades semanales, portal docente y analitica simple para tomar decisiones pedagogicas con informacion clara.',
  about_card_1_title: 'Implementado por',
  about_card_1_value: 'ABL Educacion',
  about_card_2_title: 'Enfoque',
  about_card_2_value: 'Aprendizaje aplicado y divertido',
  about_card_3_title: 'Cobertura',
  about_card_3_value: 'Aulas, directivos y familias',
  about_card_4_title: 'Objetivo',
  about_card_4_value: 'Mejorar progreso y seguimiento',
  steps_title: 'ABL Educacion de manera divertida desde hoy',
  steps_button_label: 'Registrarme',
  step_1_title: 'Crea tus aulas e inscribe a tus estudiantes',
  step_1_description:
    'Registrate en ABL Educacion, ingresa al Portal Docente e inscribe a tus estudiantes.',
  step_2_title: 'Descarguen e ingresen al aplicativo',
  step_2_description:
    'Comparte con tus estudiantes sus usuarios y contrasenas para empezar a aprender de manera divertida.',
  step_3_title: 'Revisa recursos y reportes',
  step_3_description:
    'Accede a videos pedagogicos, fichas curriculares y reportes automaticos desde tu portal.',
  news_chip_label: 'Noticias',
  news_title: 'Ultimas novedades de ABL Educacion',
  news_description:
    'Revisa anuncios, actividades destacadas y novedades recientes de ABL Educacion.',
};

const landingPageTextKeys = Object.keys(landingPageTextDefaults);

const normalizeString = (value, fallback = '') => (typeof value === 'string' ? value : fallback);

const normalizeHighlights = (highlights = []) => {
  if (!Array.isArray(highlights)) {
    return [];
  }

  const cleaned = [];

  highlights.forEach((item) => {
    const value = normalizeString(item, '').trim();
    if (!value || cleaned.includes(value)) {
      return;
    }
    cleaned.push(value);
  });

  return cleaned.slice(0, 4);
};

export const buildDefaultHeroSlides = (source = landingPageTextDefaults) => {
  const base = { ...landingPageTextDefaults, ...source };

  return [
    {
      eyebrow: 'Experiencia inmersiva ABL Educacion',
      title: `${base.hero_title_line_1}\n${base.hero_title_line_2}`.trim(),
      description: base.hero_description,
      primary_button_label: base.hero_primary_button_label,
      primary_button_url: '/register',
      secondary_button_label: base.hero_secondary_button_label,
      secondary_button_url: '/login',
      highlights: [
        base.about_card_2_value,
        base.about_card_3_value,
        base.about_card_4_value,
      ],
      media_type: 'scene',
      media_url: '',
      poster_url: '',
      accent_color: '#7CF4FF',
      background_start: '#081B36',
      background_end: '#1B8DFF',
      overlay_color: 'rgba(7, 17, 34, 0.58)',
    },
    {
      eyebrow: 'Aulas conectadas',
      title: 'Planifica,\ncoordina y comparte',
      description:
        'Convierte la portada en un tablero vivo para familias, docentes y estudiantes con contenidos listos para actuar.',
      primary_button_label: 'Explorar noticias',
      primary_button_url: '/inicio#noticias',
      secondary_button_label: 'Conocer mas',
      secondary_button_url: '/inicio#quienes-somos',
      highlights: [
        base.about_card_1_value,
        base.about_card_2_value,
        base.about_card_3_value,
      ],
      media_type: 'image',
      media_url: '',
      poster_url: '',
      accent_color: '#FFD166',
      background_start: '#102246',
      background_end: '#56CCF2',
      overlay_color: 'rgba(8, 19, 38, 0.52)',
    },
    {
      eyebrow: 'Seguimiento claro',
      title: 'Cada avance\nen una sola vista',
      description:
        'Destaca clases, reportes y novedades con una portada moderna que cambia slide por slide sin perder legibilidad.',
      primary_button_label: 'Ingresar',
      primary_button_url: '/login',
      secondary_button_label: 'Ver pasos',
      secondary_button_url: '/inicio#pasos',
      highlights: [
        base.step_1_title,
        base.step_2_title,
        base.step_3_title,
      ],
      media_type: 'video',
      media_url: '',
      poster_url: '',
      accent_color: '#FF8A5B',
      background_start: '#160A2C',
      background_end: '#8338EC',
      overlay_color: 'rgba(15, 8, 29, 0.5)',
    },
  ];
};

const normalizeHeroSlide = (slide = {}, fallback = {}) => ({
  eyebrow: normalizeString(slide.eyebrow, fallback.eyebrow || ''),
  title: normalizeString(slide.title, fallback.title || ''),
  description: normalizeString(slide.description, fallback.description || ''),
  primary_button_label: normalizeString(
    slide.primary_button_label,
    fallback.primary_button_label || '',
  ),
  primary_button_url: normalizeString(
    slide.primary_button_url,
    fallback.primary_button_url || '/register',
  ),
  secondary_button_label: normalizeString(
    slide.secondary_button_label,
    fallback.secondary_button_label || '',
  ),
  secondary_button_url: normalizeString(
    slide.secondary_button_url,
    fallback.secondary_button_url || '/login',
  ),
  highlights: normalizeHighlights(slide.highlights || fallback.highlights),
  media_type: ['scene', 'image', 'video'].includes(slide.media_type)
    ? slide.media_type
    : fallback.media_type || 'scene',
  media_url: normalizeString(slide.media_url, fallback.media_url || ''),
  poster_url: normalizeString(slide.poster_url, fallback.poster_url || ''),
  accent_color: normalizeString(slide.accent_color, fallback.accent_color || '#7CF4FF'),
  background_start: normalizeString(
    slide.background_start,
    fallback.background_start || '#081B36',
  ),
  background_end: normalizeString(slide.background_end, fallback.background_end || '#1B8DFF'),
  overlay_color: normalizeString(
    slide.overlay_color,
    fallback.overlay_color || 'rgba(7, 17, 34, 0.58)',
  ),
});

const syncLegacyHeroFields = (payload, slides) => {
  const primarySlide = Array.isArray(slides) && slides.length > 0
    ? slides[0]
    : buildDefaultHeroSlides(payload)[0];
  const lines = normalizeString(primarySlide.title, '')
    .split('\n')
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    ...payload,
    hero_title_line_1: lines[0] || payload.hero_title_line_1,
    hero_title_line_2: lines.slice(1).join(' ') || '',
    hero_description: normalizeString(primarySlide.description, payload.hero_description),
    hero_primary_button_label: normalizeString(
      primarySlide.primary_button_label,
      payload.hero_primary_button_label,
    ),
    hero_secondary_button_label: normalizeString(
      primarySlide.secondary_button_label,
      payload.hero_secondary_button_label,
    ),
    hero_slides: slides,
  };
};

export const landingPageDefaults = syncLegacyHeroFields(
  { ...landingPageTextDefaults },
  buildDefaultHeroSlides(landingPageTextDefaults),
);

export const mergeLandingPageConfig = (config = {}) => {
  const mergedText = landingPageTextKeys.reduce((acc, key) => {
    acc[key] = normalizeString(config?.[key], landingPageTextDefaults[key]);
    return acc;
  }, {});
  const fallbackSlides = buildDefaultHeroSlides(mergedText);
  const providedSlides = Array.isArray(config?.hero_slides) ? config.hero_slides : [];
  const heroSlides = (providedSlides.length > 0 ? providedSlides : fallbackSlides)
    .slice(0, 6)
    .map((slide, index) => normalizeHeroSlide(slide, fallbackSlides[index] || fallbackSlides[0]));

  return syncLegacyHeroFields(mergedText, heroSlides);
};

export const buildLandingPagePayload = (config = {}) => {
  const payload = landingPageTextKeys.reduce((acc, key) => {
    const value = config?.[key];
    acc[key] = typeof value === 'string' ? value.trim() : landingPageTextDefaults[key];
    return acc;
  }, {});
  const fallbackSlides = buildDefaultHeroSlides(payload);
  const providedSlides = Array.isArray(config?.hero_slides) ? config.hero_slides : [];
  const heroSlides = (providedSlides.length > 0 ? providedSlides : fallbackSlides)
    .slice(0, 6)
    .map((slide, index) => normalizeHeroSlide(slide, fallbackSlides[index] || fallbackSlides[0]));

  return syncLegacyHeroFields(payload, heroSlides);
};
