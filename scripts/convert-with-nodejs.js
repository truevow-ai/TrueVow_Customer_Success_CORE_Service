/**
 * Alternative Markdown to DOCX converter using Node.js
 * Requires: npm install markdown-pdf docx
 * 
 * This is a fallback option if pandoc is not available
 */

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

// Simple markdown parser (basic implementation)
function parseMarkdown(markdown) {
    const lines = markdown.split('\n');
    const elements = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Headers
        if (line.startsWith('# ')) {
            elements.push(new Paragraph({
                text: line.replace(/^# /, ''),
                heading: HeadingLevel.HEADING_1
            }));
        } else if (line.startsWith('## ')) {
            elements.push(new Paragraph({
                text: line.replace(/^## /, ''),
                heading: HeadingLevel.HEADING_2
            }));
        } else if (line.startsWith('### ')) {
            elements.push(new Paragraph({
                text: line.replace(/^### /, ''),
                heading: HeadingLevel.HEADING_3
            }));
        } else if (line.trim() === '') {
            elements.push(new Paragraph({ text: '' }));
        } else {
            elements.push(new Paragraph({
                text: line
            }));
        }
    }
    
    return elements;
}

async function convertMarkdownToDocx(inputFile, outputFile) {
    try {
        const markdown = fs.readFileSync(inputFile, 'utf8');
        const elements = parseMarkdown(markdown);
        
        const doc = new Document({
            sections: [{
                children: elements
            }]
        });
        
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(outputFile, buffer);
        
        console.log(`SUCCESS: Created ${outputFile}`);
    } catch (error) {
        console.error(`ERROR: ${error.message}`);
        process.exit(1);
    }
}

// Main
const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
    console.error('Usage: node convert-with-nodejs.js <input.md> <output.docx>');
    process.exit(1);
}

convertMarkdownToDocx(inputFile, outputFile);
