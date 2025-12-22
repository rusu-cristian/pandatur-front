/**
 * Truncates a string to a specified length and appends "..." if needed.
 * @param {string} text - The string to truncate.
 * @param {number} maxLength - Maximum allowed length.
 * @returns {string} - The truncated string.
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || typeof text !== "string") {
    // console.warn('truncateText: Invalid input', text);
    return "N/A"
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

/**
 * Parses a tag string or returns an array directly if already formatted.
 * @param {string | string[]} tags - The tags in string or array format.
 * @returns {string[]} - Parsed array of tags.
 */
export const parseTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags // Already an array, return as is.
  }
  if (typeof tags === "string" && tags.startsWith("{") && tags.endsWith("}")) {
    const content = tags.slice(1, -1).trim() // Remove braces and trim.
    return content ? content.split(",").map((tag) => tag.trim()) : []
  }
  return [] // Return empty array for unsupported formats.
}
