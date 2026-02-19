
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import saveAs from 'file-saver';

export const generateWordFile = async (title: string, content: string) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...content.split('\n').map(line => 
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 24, // 12pt is size 24 in docx units (half-points)
                }),
              ],
              spacing: { after: 200 },
            })
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Medisch_Informatieverzoek.docx");
};
