const fs = require('fs');
const { marked } = require('marked');
const HTMLtoDOCX = require('html-to-docx');

async function createDocx() {
  try {
    const mdPath = 'C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\13d121fe-1014-4b68-9b0b-45d56d47c79e\\latest_evaluation_report.md';
    const docxPath = 'C:\\Users\\Acer\\Pictures\\chatbot\\Halal\\Laporan_Evaluasi_KMS_DSS.docx';

    // Read Markdown
    let mdContent = fs.readFileSync(mdPath, 'utf8');

    // Remove GitHub-specific alerts as they don't render well standardly
    mdContent = mdContent.replace(/> \[!TIP\]\n> /g, '**TIP:** ');

    // Convert to HTML
    const htmlString = marked(mdContent);

    // Provide some basic styling wrapper
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid black;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          ${htmlString}
        </body>
      </html>
    `;

    // Convert HTML to DOCX
    const fileBuffer = await HTMLtoDOCX(fullHtml, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    // Write file
    fs.writeFileSync(docxPath, fileBuffer);
    console.log(`Berhasil membuat file DOCX di: ${docxPath}`);
  } catch (error) {
    console.error('Error generating DOCX:', error);
  }
}

createDocx();
