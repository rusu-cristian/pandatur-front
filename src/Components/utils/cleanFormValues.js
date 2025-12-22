export const cleanFormValues = (values) => {
  return Object.entries(values).reduce((acc, [key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      acc[key] = value
    }
    return acc
  }, {})
}
