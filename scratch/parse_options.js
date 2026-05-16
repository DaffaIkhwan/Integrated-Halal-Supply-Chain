const fs = require('fs');

const text = fs.readFileSync('scratch/clean.txt', 'utf8');

const lines = text.split('\n');

const cps = [];
let currentCP = null;
let currentSub = null;

let state = 'search'; // search, read_options

const optionPattern = /^(1|2|3|4|5)\s+(.*)$/;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  
  if (line.match(/^CP\d+\./) && !line.match(/^CP\d+\.\d+/)) {
    // CP Header
    const match = line.match(/^(CP\d+)\.\s+(.*)$/);
    if (match) {
      currentCP = {
        id: match[1],
        name: match[2],
        subs: []
      };
      cps.push(currentCP);
    }
  } else if (line.match(/^CP\d+\.\d+\./) || line.match(/^CP\d+\.\d+\s/)) {
    // Sub criteria
    const match = line.match(/^(CP\d+\.\d+)\.?\s+(.*)$/);
    if (match && currentCP) {
      currentSub = {
        id: match[1],
        name: match[2].replace(/\s+/g, ' '),
        options: []
      };
      currentCP.subs.push(currentSub);
    }
  } else if (currentSub && currentSub.options.length < 5) {
     // We need to parse the 5 columns from the row
     // The row in clean.txt seems to have the 5 options distributed over several lines, or perhaps separated by spaces
     // Actually let's look at the structure of clean.txt
     // In clean.txt, the options for a sub-criteria are usually below it. 
     // Wait, the table in clean.txt has columns: 1 2 3 4 5
     // Then it lists the 5 indicators for the sub-criteria
     // Then below that, it lists the 5 risk options for the sub-criteria, sometimes spread across multiple columns.
  }
}
console.log(JSON.stringify(cps, null, 2));
