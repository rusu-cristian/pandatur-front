export const extractNumbers = (str) => {
  return str?.slice(1, -1).split(",").map(Number);
};
