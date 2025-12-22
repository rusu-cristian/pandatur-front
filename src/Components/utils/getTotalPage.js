export const getTotalPages = (items, pageSize = 50) => {
  if (!items || !pageSize) return 1;
  return Math.ceil(items / pageSize);
};
