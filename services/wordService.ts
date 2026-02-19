
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import saveAs from 'file-saver';

/**
 * Filtert Markdown-symbolen uit de tekst voor een schone Word-export.
 */
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Verwijder vetgedrukt (**)
    .replace(/\*(.*?)\*/g, '$1')     // Verwijder cursief of opsommingsteken (*)
    .replace(/__(.*?)__/g, '$1')     // Verwijder underscores (__)
    .replace(/^#+\s+/gm, '')         // Verwijder heading tekens (#)
    .replace(/^-+\s+/gm, '• ')       // Vervang streepjes door echte bulletpoints
    .replace(/^>\s+/gm, '')          // Verwijder quote tekens (>)
    .replace(/`/g, '');              // Verwijder backticks
};

/**
 * Genereert en downloadt een professioneel Word-bestand zonder Markdown-tekens.
 */
export const downloadAsWord = async (title: string, content: string) => {
  const cleanedContent = cleanMarkdown(content);
  
  const doc = new Document({
    creator: "AI Medisch Info Generator",
    title: title,
    description: "Geautomatiseerd medisch informatieverzoek",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            }
          }
        },
        children: [
          new Paragraph({
            text: title.toUpperCase(),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          ...cleanedContent.split('\n').map(line => {
            const isBullet = line.startsWith('•');
            return new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 24, // 12pt
                  font: "Calibri",
                }),
              ],
              spacing: { 
                before: line.trim() === "" ? 0 : 120,
                after: 120 
              },
              indent: isBullet ? { left: 720, hanging: 360 } : undefined,
            });
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, fileName);
};
