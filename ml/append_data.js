const fs = require('fs');
const path = require('path');

const newTrainData = [
  // operational_data locations
  { text: "Sebutkan nama RPH yang ada di Jatim.", label: "operational_data" },
  { text: "Apa fasilitas cold storage yang ada di Bandung?", label: "operational_data" },
  { text: "RPH Syariah Al-Anam ada di kota mana?", label: "operational_data" },
  { text: "Sebutkan nama distributor di Jabodetabek.", label: "operational_data" },
  { text: "Nama peternakan di Jatim apa saja?", label: "operational_data" },
  { text: "Ada berapa batch halal yang diproduksi antara Januari dan Februari 2026?", label: "operational_data" },
  { text: "Dimana lokasi peternakan Sumber Rejeki?", label: "operational_data" },
  { text: "Apakah ada cold storage di Bandung yang halal?", label: "operational_data" },
  { text: "Nama RPH di Jateng apa aja?", label: "operational_data" },
  { text: "Nama peternakan di Jabar?", label: "operational_data" },
  { text: "Apa aja fasilitas cold storage di Jabar?", label: "operational_data" },
  { text: "Nama distributor di Bandung?", label: "operational_data" },
  { text: "Nama RPH di Bogor apa?", label: "operational_data" },
  { text: "RPH yang ada di lokasi Jakarta?", label: "operational_data" },
  { text: "distributor yang terdaftar di area Malang?", label: "operational_data" },
  { text: "berapa jumlah peternakan sapi di jawa barat?", label: "operational_data" },

  // risk_check specific CPs
  { text: "Cek risiko AHP di CP4 RPH, aman ga?", label: "risk_check" },
  { text: "Apakah CP1 Kandang terjamin keamanannya?", label: "risk_check" },
  { text: "cek risiko CP2 di RPH Terpadu Semarang gimana?", label: "risk_check" },
  { text: "berapa tingkat risiko CP3 Transportasi?", label: "risk_check" },
  { text: "aman ga sih CP4 Penyembelihan?", label: "risk_check" },
  { text: "evaluasi keamanan CP2 Pakan ternak", label: "risk_check" },
  { text: "gimana level risiko CP1 di peternakan?", label: "risk_check" },
  { text: "kasih liat bobot AHP buat CP4", label: "risk_check" },
  { text: "status keamanan CP3 saat distribusi", label: "risk_check" },
  { text: "risiko penyembelihan CP4 tinggi ga?", label: "risk_check" }
];

const newTestData = [
  { text: "RPH di kalimantan ada berapa?", label: "operational_data" },
  { text: "apakah CP4 aman?", label: "risk_check" },
  { text: "cek risiko keamanan di CP1 kandang", label: "risk_check" },
  { text: "apa nama cold storage di surabaya", label: "operational_data" }
];

function appendToCsv(filename, newData) {
  const filepath = path.join(__dirname, filename);
  let content = fs.readFileSync(filepath, 'utf8').trim();
  
  const lines = newData.map(row => `"${row.text}",${row.label}`);
  content += '\n' + lines.join('\n') + '\n';
  
  fs.writeFileSync(filepath, content);
  console.log(`Added ${newData.length} rows to ${filename}`);
}

appendToCsv('dataset_intent_train.csv', newTrainData);
appendToCsv('dataset_intent_test.csv', newTestData);
