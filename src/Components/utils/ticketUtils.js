export const priorityColors = {
  joasă: "#88c999",
  medie: "#5b92e5",
  înaltă: "#f5a25d",
  critică: "#e57373",
  default: "#d3d3d3",
};

export const getPriorityColor = (priority) => {
  return priorityColors[priority] || priorityColors["default"];
};
