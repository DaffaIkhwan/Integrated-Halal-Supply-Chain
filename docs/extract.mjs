import fs from 'fs';

const k2Xml = fs.readFileSync('c:/Users/Acer/Pictures/chatbot/NextRag/docs/temp_k2/word/document.xml', 'utf8');
const k3Xml = fs.readFileSync('c:/Users/Acer/Pictures/chatbot/NextRag/docs/temp_k3/word/document.xml', 'utf8');

function extractText(xml) {
    let text = xml.replace(/<w:p [^>]*>|<w:p>/g, '\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/ +/g, ' ');
    return text.trim();
}

fs.writeFileSync('c:/Users/Acer/Pictures/chatbot/NextRag/docs/k2.txt', extractText(k2Xml));
fs.writeFileSync('c:/Users/Acer/Pictures/chatbot/NextRag/docs/k3.txt', extractText(k3Xml));
console.log('Done extracting text');
