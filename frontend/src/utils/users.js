export const getUserDisplayName = (user) => {
  if (!user) return 'Usuario';

  if (user.full_name) return user.full_name;

  const fallbackName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (fallbackName) return fallbackName;
  if (user.username) return user.username;
  if (user.email) return user.email;

  return 'Usuario';
};

export const getUserInitial = (user) => {
  const displayName = getUserDisplayName(user).trim();
  return displayName ? displayName[0].toUpperCase() : 'U';
};

export const getUserRoleLabel = (user) => {
  if (user?.role === 'admin') return 'Admin';
  if (user?.role === 'docente') return 'Docente';
  return 'Estudiante';
};

export const getUserRoleColor = (user) => {
  if (user?.role === 'admin') return '#9c27b0';
  if (user?.role === 'docente') return '#1976d2';
  return '#4caf50';
};
