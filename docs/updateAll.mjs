import fs from 'fs';

const cps = JSON.parse(fs.readFileSync('c:/Users/Acer/Pictures/chatbot/NextRag/docs/parsed_cps.json', 'utf8'));

// Background fields mapping
const bgFields = {
  CP4: [
    { key: 'namaRPH', label: 'Nama Rumah Potong Hewan (RPH)', type: 'text' },
    { key: 'nomorSertifikat', label: 'Nomor Sertifikat Halal RPH', type: 'text' },
    { key: 'masaBerlaku', label: 'Masa Berlaku Sertifikat Halal', type: 'date' },
    { key: 'alamat', label: 'Alamat RPH', type: 'text' },
    { key: 'namaPIC', label: 'Nama Responsible Person (PIC)', type: 'text' },
    { key: 'jabatan', label: 'Jabatan', type: 'select', options: ['Juru Sembelih Halal', 'QC', 'Supervisor', 'Veteriner', 'Penyelia Halal', 'Operator Produksi'] },
    { key: 'idKaryawan', label: 'Nomor ID Karyawan', type: 'text' },
    { key: 'tanggal', label: 'Tanggal Pengisian', type: 'date' },
    { key: 'shift', label: 'Shift Operasional', type: 'select', options: ['Pagi', 'Siang', 'Malam'] },
    { key: 'waktuMulai', label: 'Waktu Mulai Operasi', type: 'time' },
    { key: 'batch', label: 'Batch / Kode Produksi', type: 'text' },
    { key: 'jumlahHewan', label: 'Jumlah Hewan Disembelih', type: 'number' },
    { key: 'asalHewan', label: 'Asal Hewan', type: 'text' },
    { key: 'kendaraan', label: 'Nomor Kendaraan Pengangkut', type: 'text' },
    { key: 'supplier', label: 'Nama Supplier / Peternakan', type: 'text' }
  ],
  CP5: [
    { key: 'namaRPH', label: 'Nama Rumah Potong Hewan (RPH)', type: 'text' },
    { key: 'nomorSertifikat', label: 'Nomor Sertifikat Halal RPH', type: 'text' },
    { key: 'masaBerlaku', label: 'Masa Berlaku Sertifikat Halal', type: 'date' },
    { key: 'alamat', label: 'Alamat RPH', type: 'text' },
    { key: 'namaPIC', label: 'Nama Responsible Person (PIC)', type: 'text' },
    { key: 'jabatan', label: 'Jabatan', type: 'select', options: ['Juru Sembelih Halal', 'QC', 'Supervisor', 'Veteriner', 'Penyelia Halal', 'Operator Produksi'] },
    { key: 'idKaryawan', label: 'Nomor ID Karyawan', type: 'text' },
    { key: 'tanggal', label: 'Tanggal Pengisian', type: 'date' },
    { key: 'shift', label: 'Shift Operasional', type: 'select', options: ['Pagi', 'Siang', 'Malam'] },
    { key: 'waktuMulai', label: 'Waktu Mulai Operasi', type: 'time' },
    { key: 'batch', label: 'Batch / Kode Produksi', type: 'text' }
  ],
  CP6: [
    { key: 'namaPerusahaan', label: 'Nama Perusahaan / Unit Processing', type: 'text' },
    { key: 'lokasi', label: 'Lokasi Fasilitas Produksi', type: 'text' },
    { key: 'namaPIC', label: 'Nama Responsible Person (PIC)', type: 'text' },
    { key: 'jabatan', label: 'Jabatan', type: 'select', options: ['Operator Produksi', 'QC', 'Supervisor', 'Penyelia Halal', 'Warehouse', 'Maintenance'] },
    { key: 'idKaryawan', label: 'Nomor ID Karyawan', type: 'text' },
    { key: 'tanggal', label: 'Tanggal Pengisian', type: 'date' },
    { key: 'shift', label: 'Shift Produksi', type: 'select', options: ['Pagi', 'Siang', 'Malam'] },
    { key: 'waktuMulai', label: 'Waktu Mulai Produksi', type: 'time' },
    { key: 'batch', label: 'Batch / Kode Produksi', type: 'text' },
    { key: 'namaProduk', label: 'Nama Produk', type: 'text' },
    { key: 'jenisProduk', label: 'Jenis Produk', type: 'select', options: ['Fresh Meat', 'Frozen Meat', 'Processed Meat', 'Ready-to-Cook'] },
    { key: 'jumlahProduk', label: 'Jumlah Produksi', type: 'number' }
  ],
  CP7: [
    { key: 'namaPerusahaan', label: 'Nama Perusahaan / Unit Processing', type: 'text' },
    { key: 'lokasi', label: 'Lokasi Fasilitas Produksi', type: 'text' },
    { key: 'namaPIC', label: 'Nama Responsible Person (PIC)', type: 'text' },
    { key: 'jabatan', label: 'Jabatan', type: 'select', options: ['Operator Produksi', 'QC', 'Supervisor', 'Penyelia Halal', 'Warehouse', 'Maintenance'] },
    { key: 'idKaryawan', label: 'Nomor ID Karyawan', type: 'text' },
    { key: 'tanggal', label: 'Tanggal Pengisian', type: 'date' },
    { key: 'shift', label: 'Shift Produksi', type: 'select', options: ['Pagi', 'Siang', 'Malam'] },
    { key: 'waktuMulai', label: 'Waktu Mulai Produksi', type: 'time' },
    { key: 'batch', label: 'Batch / Kode Produksi', type: 'text' },
    { key: 'namaProduk', label: 'Nama Produk', type: 'text' },
    { key: 'jenisProduk', label: 'Jenis Produk', type: 'select', options: ['Fresh Meat', 'Frozen Meat', 'Processed Meat', 'Ready-to-Cook'] },
    { key: 'jumlahProduk', label: 'Jumlah Produksi', type: 'number' }
  ],
  CP8: [
    { key: 'namaPerusahaan', label: 'Nama Perusahaan / Distributor', type: 'text' },
    { key: 'lokasi', label: 'Lokasi Distribusi', type: 'text' },
    { key: 'namaPIC', label: 'Nama PIC / Responsible Person', type: 'text' },
    { key: 'jabatan', label: 'Jabatan', type: 'select', options: ['Driver', 'Logistic Staff', 'Warehouse Staff', 'Supervisor', 'QC', 'Penyelia Halal'] },
    { key: 'idKaryawan', label: 'Nomor ID Karyawan', type: 'text' },
    { key: 'tanggal', label: 'Tanggal Pengiriman', type: 'date' },
    { key: 'shift', label: 'Shift Operasional', type: 'select', options: ['Pagi', 'Siang', 'Malam'] },
    { key: 'kendaraan', label: 'Nomor Kendaraan', type: 'text' },
    { key: 'jenisKendaraan', label: 'Jenis Kendaraan', type: 'select', options: ['Refrigerated Truck', 'Box Truck', 'Container', 'Lainnya'] },
    { key: 'batch', label: 'Nomor Batch Produk', type: 'text' },
    { key: 'namaProduk', label: 'Nama Produk', type: 'text' },
    { key: 'jumlahProduk', label: 'Jumlah Produk', type: 'number' },
    { key: 'lokasiAsal', label: 'Lokasi Asal Pengiriman', type: 'text' }
  ],
  CP9: [
    { key: 'namaRetail', label: 'Nama Retail / Supermarket', type: 'text' },
    { key: 'cabang', label: 'Cabang / Lokasi', type: 'text' },
    { key: 'namaPIC', label: 'Nama PIC / Responsible Person', type: 'text' },
    { key: 'jabatan', label: 'Jabatan', type: 'select', options: ['Store Staff', 'Supervisor', 'QC', 'Warehouse', 'Penyelia Halal'] },
    { key: 'idKaryawan', label: 'Nomor ID Karyawan', type: 'text' },
    { key: 'tanggal', label: 'Tanggal Pengisian', type: 'date' },
    { key: 'shift', label: 'Shift Operasional', type: 'select', options: ['Pagi', 'Siang', 'Malam'] },
    { key: 'areaRetail', label: 'Area Retail', type: 'select', options: ['Frozen Area', 'Chiller', 'Dry Storage', 'Display Area'] },
    { key: 'namaProduk', label: 'Nama Produk', type: 'text' },
    { key: 'batch', label: 'Nomor Batch Produk', type: 'text' },
    { key: 'supplier', label: 'Supplier Produk', type: 'text' },
    { key: 'jumlahProduk', label: 'Jumlah Produk', type: 'number' }
  ]
};

function generateFile(startIndex, endIndex) {
  let output = `import type { CPQuestionnaire } from './questionnaire-data';\n`;
  for (let i = startIndex; i <= endIndex; i++) {
    const cp = cps[i];
    output += `\n// ══════════════════════════════════════\n`;
    output += `// ${cp.cpId} — ${cp.cpName}\n`;
    output += `// ══════════════════════════════════════\n`;
    output += `export const ${cp.cpId}_QUESTIONNAIRE: CPQuestionnaire = {\n`;
    output += `  cpId: '${cp.cpId}', cpName: '${cp.cpName}', cpNameEn: '${cp.cpNameEn}',\n`;
    output += `  backgroundFields: ${JSON.stringify(bgFields[cp.cpId], null, 4).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'").replace(/\n/g, '\n  ')},\n`;
    
    output += `  subCriteria: [\n`;
    for (const sub of cp.subCriteria) {
      output += `    { code: '${sub.code}', name: '${sub.name}', nameEn: '${sub.nameEn}',\n`;
      output += `      indicators: [\n`;
      for (const ind of sub.indicators) {
        output += `        { no: ${ind.no}, statement: '${ind.statement.replace(/'/g, "\\'")}', evidence: '${ind.evidence.replace(/'/g, "\\'")}' },\n`;
      }
      output += `      ],\n    },\n`;
    }
    output += `  ],\n};\n`;
  }
  return output;
}

fs.writeFileSync('c:/Users/Acer/Pictures/chatbot/NextRag/src/lib/data/questionnaire-cp4-6.ts', generateFile(3, 5));
fs.writeFileSync('c:/Users/Acer/Pictures/chatbot/NextRag/src/lib/data/questionnaire-cp7-9.ts', generateFile(6, 8));

// Fix questionnaire-data.ts
const targetPath = 'c:/Users/Acer/Pictures/chatbot/NextRag/src/lib/data/questionnaire-data.ts';
let currentContent = fs.readFileSync(targetPath, 'utf8');
const splitIndex = currentContent.indexOf('export const CP4_QUESTIONNAIRE');
if (splitIndex !== -1) {
  // We need to find the beginning of CP4 comment
  const commentIndex = currentContent.lastIndexOf('// ══════════════════════════════════════', splitIndex);
  if (commentIndex !== -1) {
    fs.writeFileSync(targetPath, currentContent.substring(0, commentIndex));
  }
}

console.log('Fixed files');
