export const PLANNING_DAYS = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miercoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
];

export const createEmptyPlanningSession = () => ({
  subject: '',
  title: '',
});

export const createEmptyPlanningDay = (day) => ({
  day_key: day.key,
  day_label: day.label,
  date_label: '',
  sessions: [createEmptyPlanningSession()],
});

export const createEmptyPlanningWeek = (weekNumber) => ({
  week_number: weekNumber,
  title: `Semana ${weekNumber}`,
  days: PLANNING_DAYS.map((day) => createEmptyPlanningDay(day)),
});

export const normalizePlanningWeeks = (weeks) => {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return [1, 2, 3].map((weekNumber) => createEmptyPlanningWeek(weekNumber));
  }

  return weeks.map((week, weekIndex) => ({
    week_number: Number(week?.week_number) || weekIndex + 1,
    title: week?.title || `Semana ${weekIndex + 1}`,
    days: PLANNING_DAYS.map((day, dayIndex) => {
      const sourceDay = Array.isArray(week?.days)
        ? week.days.find((item) => item?.day_key === day.key) || week.days[dayIndex]
        : null;

      const sessions = Array.isArray(sourceDay?.sessions) && sourceDay.sessions.length > 0
        ? sourceDay.sessions.map((session) => ({
          subject: session?.subject || '',
          title: session?.title || '',
        }))
        : [createEmptyPlanningSession()];

      return {
        day_key: sourceDay?.day_key || day.key,
        day_label: sourceDay?.day_label || day.label,
        date_label: sourceDay?.date_label || '',
        sessions,
      };
    }),
  }));
};

export const createEmptyPlanningForm = () => ({
  planning_type: 'planificador',
  title: '',
  description: '',
  file_url: '',
  source_file_url: '',
  grade_id: '',
  month_id: '',
  unit_number: '',
  unit_title: '',
  situation_context: '',
  learning_challenge: '',
  structured_content: [1, 2, 3].map((weekNumber) => createEmptyPlanningWeek(weekNumber)),
});

export const getPlanningTypeMeta = (planningType) => {
  if (planningType === 'planificador') {
    return {
      label: 'Planificador',
      color: '#6d4c41',
      bg: '#efebe9',
    };
  }

  if (planningType === 'guia') {
    return {
      label: 'Guia',
      color: '#1565c0',
      bg: '#e3f2fd',
    };
  }

  return {
    label: 'Horario',
    color: '#ef6c00',
    bg: '#fff3e0',
  };
};
