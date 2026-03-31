export const getLiveClassDate = (liveClass) =>
  liveClass?.scheduled_at || liveClass?.date_time || null;

export const formatLiveClassDate = (liveClass, options) => {
  const value = getLiveClassDate(liveClass);
  if (!value) return null;

  return new Date(value).toLocaleDateString('es-PE', options);
};

export const formatLiveClassDateTime = (liveClass, options) => {
  const value = getLiveClassDate(liveClass);
  if (!value) return null;

  return new Date(value).toLocaleString('es-PE', options);
};

export const formatLiveClassTime = (liveClass, options) => {
  const value = getLiveClassDate(liveClass);
  if (!value) return null;

  return new Date(value).toLocaleTimeString('es-PE', options);
};
