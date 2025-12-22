export const cleanValue = (value) => {
  if (!value || value === "{NULL}") return "—"
  if (
    typeof value === "string" &&
    value.startsWith("{") &&
    value.endsWith("}")
  ) {
    return value.slice(1, -1)
  }
  return value
}
