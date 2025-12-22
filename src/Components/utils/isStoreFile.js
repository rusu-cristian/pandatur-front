const STORAGE_URL = "https://storage.googleapis.com";
const PDF_FILE = [".pdf"];

export const isStoreFile = (file) => {
  return file.startsWith(STORAGE_URL) && file.endsWith(PDF_FILE);
};
