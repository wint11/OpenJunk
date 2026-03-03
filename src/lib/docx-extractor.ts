
import PizZip from 'pizzip';

/**
 * Extracts raw text from a DOCX file buffer.
 * It works by unzipping the docx (which is a zip archive) and reading the word/document.xml file.
 * Then it strips XML tags to get the text content.
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const zip = new PizZip(buffer);
    
    // Check if word/document.xml exists
    const documentXml = zip.file("word/document.xml");
    
    if (!documentXml) {
      throw new Error("Invalid DOCX file: word/document.xml not found");
    }

    const xmlContent = documentXml.asText();
    
    // Simple regex to strip XML tags. 
    // This is not perfect for preserving formatting, but sufficient for extracting text for AI.
    // We add a space after closing tags to prevent words from merging.
    const text = xmlContent
      .replace(/<w:p>/g, '\n') // New paragraph -> New line
      .replace(/<[^>]+>/g, ' ') // Strip other tags and replace with space
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return text;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("Failed to parse DOCX file");
  }
}
