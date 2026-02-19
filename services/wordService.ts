
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export const downloadAsWord = async (content: string, filename: string = "medisch_informatieverzoek.docx") => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "MEDISCH INFORMATIEVERZOEK",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...content.split('\n').map(line => 
            new Paragraph({
              children: [
                new TextRun({
                  text: line.trim(),
                  size: 24, // 12pt
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
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
