const fs = require("fs");
const path = require("path");
const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, Table, TableRow, TableCell, WidthType,
    BorderStyle, Shading, ShadingType,
} = require("docx");

const DOC_PATH = "C:\\Users\\ASUS\\OneDrive\\Desktop\\MarketingAI_Project_Documentation.docx";
const MD_FILE = "C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\4c5717d7-bcb3-4d93-aa02-c78cc10a7593\\project_documentation.md";

// Read the markdown
const markdown = fs.readFileSync(MD_FILE, "utf-8");
const lines = markdown.split("\n");

// Helper: make a styled paragraph
function makeHeading(text, level) {
    const levels = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
    };
    return new Paragraph({
        text: text.replace(/^#+\s*/, ""),
        heading: levels[level] || HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 },
    });
}

function makeBody(text) {
    // Handle inline bold: **text**
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    const runs = parts.map(part => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return new TextRun({ text: part.slice(2, -2), bold: true });
        }
        if (part.startsWith("`") && part.endsWith("`")) {
            return new TextRun({ text: part.slice(1, -1), font: "Courier New", size: 18, color: "6B21A8" });
        }
        return new TextRun({ text: part });
    });
    return new Paragraph({ children: runs, spacing: { after: 80 } });
}

function makeCode(text) {
    return new Paragraph({
        children: [new TextRun({ text, font: "Courier New", size: 16, color: "1E3A5F" })],
        spacing: { before: 40, after: 40 },
        indent: { left: 720 },
        shading: { type: ShadingType.SOLID, color: "F0F4FF", fill: "F0F4FF" },
    });
}

function makeBullet(text, level = 0) {
    const clean = text.replace(/^[-*]\s*/, "").replace(/^\[.\]\s*/, "");
    const parts = clean.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    const runs = parts.map(part => {
        if (part.startsWith("**") && part.endsWith("**")) return new TextRun({ text: part.slice(2, -2), bold: true });
        if (part.startsWith("`") && part.endsWith("`")) return new TextRun({ text: part.slice(1, -1), font: "Courier New", size: 18, color: "6B21A8" });
        return new TextRun({ text: part });
    });
    return new Paragraph({
        children: runs,
        bullet: { level },
        spacing: { after: 60 },
    });
}

function makeHR() {
    return new Paragraph({
        border: { bottom: { color: "CCCCCC", space: 1, value: BorderStyle.SINGLE, size: 6 } },
        spacing: { before: 200, after: 200 },
    });
}

function makeTableRow(cells, isHeader = false) {
    return new TableRow({
        children: cells.map(cellText => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({
                    text: cellText.trim(),
                    bold: isHeader,
                    color: isHeader ? "FFFFFF" : "1F2937",
                })],
                spacing: { before: 60, after: 60 },
            })],
            shading: isHeader ? { type: ShadingType.SOLID, color: "4F46E5", fill: "4F46E5" } : undefined,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
        })),
        tableHeader: isHeader,
    });
}

// Parse markdown to docx elements
const children = [];
let inCode = false;
let codeBuffer = [];
let tableBuffer = [];
let inTable = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith("```")) {
        if (!inCode) {
            inCode = true;
            codeBuffer = [];
        } else {
            inCode = false;
            codeBuffer.forEach(cl => children.push(makeCode(cl)));
            children.push(new Paragraph({ spacing: { after: 80 } }));
            codeBuffer = [];
        }
        continue;
    }
    if (inCode) { codeBuffer.push(line); continue; }

    // Table detection
    if (trimmed.startsWith("|")) {
        const cells = trimmed.split("|").slice(1, -1);
        if (cells.every(c => c.trim().match(/^[-:]+$/))) continue; // separator row
        tableBuffer.push(cells);
        inTable = true;
        continue;
    } else if (inTable) {
        // Flush table
        if (tableBuffer.length > 0) {
            const rows = tableBuffer.map((cells, idx) => makeTableRow(cells, idx === 0));
            children.push(new Table({
                rows,
                width: { size: 9000, type: WidthType.DXA },
            }));
            children.push(new Paragraph({ spacing: { after: 120 } }));
        }
        tableBuffer = [];
        inTable = false;
    }

    // Headings
    if (trimmed.startsWith("# ")) { children.push(new Paragraph({ children: [], pageBreakBefore: children.length > 0 })); children.push(makeHeading(trimmed, 1)); continue; }
    if (trimmed.startsWith("## ")) { children.push(makeHeading(trimmed, 2)); continue; }
    if (trimmed.startsWith("### ")) { children.push(makeHeading(trimmed, 3)); continue; }
    if (trimmed.startsWith("#### ")) { children.push(makeHeading(trimmed, 4)); continue; }

    // Horizontal rules
    if (trimmed === "---") { children.push(makeHR()); continue; }

    // Bullets / checkboxes
    if (trimmed.match(/^[-*]\s/) || trimmed.match(/^\[.\]\s/)) {
        const depth = (line.match(/^\s+/) || [""])[0].length > 0 ? 1 : 0;
        children.push(makeBullet(trimmed, depth));
        continue;
    }

    // Empty line
    if (trimmed === "") { children.push(new Paragraph({ spacing: { after: 40 } })); continue; }

    // Normal paragraph
    children.push(makeBody(trimmed));
}

// Flush remaining table
if (tableBuffer.length > 0) {
    const rows = tableBuffer.map((cells, idx) => makeTableRow(cells, idx === 0));
    children.push(new Table({ rows, width: { size: 9000, type: WidthType.DXA } }));
}

// Build document
const doc = new Document({
    sections: [{
        properties: {},
        children,
    }],
    styles: {
        default: {
            document: {
                run: { font: "Calibri", size: 22 },
            },
        },
        paragraphStyles: [
            {
                id: "Heading1",
                name: "Heading 1",
                basedOn: "Normal",
                run: { size: 40, bold: true, color: "4F46E5" },
                paragraph: { spacing: { before: 360, after: 180 } },
            },
            {
                id: "Heading2",
                name: "Heading 2",
                basedOn: "Normal",
                run: { size: 32, bold: true, color: "1F2937" },
                paragraph: { spacing: { before: 240, after: 120 } },
            },
            {
                id: "Heading3",
                name: "Heading 3",
                basedOn: "Normal",
                run: { size: 26, bold: true, color: "4B5563" },
                paragraph: { spacing: { before: 180, after: 80 } },
            },
        ],
    },
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(DOC_PATH, buffer);
    console.log("✅ Documentation generated:", DOC_PATH);
}).catch(err => {
    console.error("Error generating docx:", err.message);
});
