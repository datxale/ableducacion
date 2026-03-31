export const CONTACT_INFO = {
  email: 'info@ableducacion.com',
  whatsappNumber: '51929220076',
  whatsappLabel: '+51 929 220 076',
  location: 'Lima, Peru',
  facebookUrl: 'https://facebook.com',
  instagramUrl: 'https://instagram.com',
};

export const getWhatsAppUrl = (message = '') => {
  const base = `https://wa.me/${CONTACT_INFO.whatsappNumber}`;
  const cleaned = message.trim();
  if (!cleaned) return base;
  return `${base}?text=${encodeURIComponent(cleaned)}`;
};
