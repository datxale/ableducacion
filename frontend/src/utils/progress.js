export const PROGRESS_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const getProgressStatusLabel = (status) => {
  if (status === PROGRESS_STATUS.COMPLETED) return 'Completada';
  if (status === PROGRESS_STATUS.IN_PROGRESS) return 'En progreso';
  return 'Pendiente';
};

export const getProgressStatusColor = (status) => {
  if (status === PROGRESS_STATUS.COMPLETED) return '#4caf50';
  if (status === PROGRESS_STATUS.IN_PROGRESS) return '#ff9800';
  return '#9e9e9e';
};

export const buildProgressMap = (progressRecords = []) =>
  Object.fromEntries(progressRecords.map((record) => [record.activity_id, record]));

export const countProgressByStatus = (progressRecords = []) =>
  progressRecords.reduce(
    (totals, record) => {
      if (record.status === PROGRESS_STATUS.COMPLETED) totals.completed += 1;
      else if (record.status === PROGRESS_STATUS.IN_PROGRESS) totals.inProgress += 1;
      else totals.pending += 1;
      return totals;
    },
    { completed: 0, inProgress: 0, pending: 0 }
  );
