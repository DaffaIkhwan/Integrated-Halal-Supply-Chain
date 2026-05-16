const fs = require('fs');

const rawText = `
CP1.1
1: Seluruh asal ternak dapat ditelusuri digital/manual lengkap, supplier terverifikasi halal
2: Dokumen lengkap namun update histori belum realtime
3: Sebagian histori perpindahan ternak tidak terdokumentasi
4: Traceability lemah dan supplier belum tervalidasi
5: Asal ternak tidak jelas atau tidak dapat ditelusuri

CP1.2
1: Pemeriksaan veteriner rutin, bebas zoonosis, vaksinasi lengkap
2: Pemeriksaan berjalan namun terdapat keterlambatan dokumentasi
3: Sebagian rekam kesehatan tidak lengkap
4: Monitoring kesehatan tidak konsisten
5: Tidak ada pengawasan kesehatan ternak

CP1.3
1: Seluruh bahan pakan bersertifikat halal dan terdokumentasi
2: Ada bahan belum tersertifikasi namun memiliki declaration
3: Formula pakan tidak lengkap
4: Supplier pakan tidak tervalidasi
5: Menggunakan bahan haram/syubhat

CP1.4
1: SOP, cleaning log, audit internal lengkap dan berjalan
2: Dokumen tersedia namun belum konsisten update
3: Sebagian checklist maintenance hilang
4: Audit halal tidak rutin
5: Tidak ada dokumentasi pemeliharaan

CP1.5
1: Sanitasi kandang optimal dan terdokumentasi
2: Sanitasi berjalan dengan minor issue
3: Cleaning tidak konsisten
4: Area kandang kotor dan berpotensi kontaminasi
5: Kondisi kandang tidak higienis dan melanggar SOP halal

CP2.1
1: Seluruh bahan pakan memiliki sertifikat halal valid, additive tervalidasi halal, formula terdokumentasi lengkap, bebas bahan nonhalal dan sesuai SOP
2: Sebagian bahan menggunakan supplier declaration, namun masih dapat diverifikasi
3: Sebagian formula atau additive belum memiliki validasi halal lengkap
4: Banyak bahan belum tervalidasi, supplier tidak konsisten, dan dokumentasi lemah
5: Menggunakan bahan hewani nonhalal/syubhat atau additive tanpa status halal

CP2.2
1: Seluruh obat/vaksin legal, terdokumentasi, halal compliant, withdrawal period dipatuhi
2: Minor issue administratif pada pencatatan atau update dokumen
3: Sebagian penggunaan antibiotik atau vaksin tidak terdokumentasi lengkap
4: Penggunaan obat tidak terkontrol dan monitoring withdrawal lemah
5: Menggunakan obat/vaksin ilegal atau mengandung unsur non-halal

CP2.3
1: Pemeriksaan veteriner rutin berjalan, SOP biosecurity diterapkan, audit kesehatan aktif
2: Pemeriksaan berjalan namun dokumentasi belum sepenuhnya digital
3: Audit kesehatan atau monitoring tidak konsisten
4: Pengawasan veteriner minim dan SOP biosecurity tidak optimal
5: Tidak ada pengawasan veteriner dan tidak ada SOP biosecurity

CP2.4
1: Supplier legal, tersertifikasi halal, audit berkala, SLA aktif dan terdokumentasi
2: Minor issue administratif supplier namun masih compliant
3: Sebagian supplier belum diaudit rutin
4: Supplier tidak tervalidasi dengan baik dan banyak dokumen expired
5: Supplier tidak memiliki legalitas atau status halal tidak jelas

CP2.5
1: Pakan halal disimpan terpisah, FIFO/FEFO berjalan, gudang higienis dan termonitor
2: Minor issue labeling atau monitoring suhu
3: Segregasi belum optimal dan monitoring gudang tidak konsisten
4: Risiko pencampuran tinggi dan sanitasi gudang lemah
5: Pakan halal bercampur dengan bahan non-halal atau gudang tidak higienis

CP3.1
1: Kendaraan memenuhi welfare standard dan terdokumentasi
2: Minor issue pada ventilasi atau kapasitas
3: Monitoring transport tidak konsisten
4: Overcrowding atau handling kasar
5: Hewan mengalami stress berat/cedera signifikan

CP3.2
1: Sanitasi kendaraan sesuai SOP halal logistics
2: Cleaning dilakukan namun logbook kurang lengkap
3: Sanitasi tidak konsisten
4: Potensi kontaminasi tinggi
5: Kendaraan terkontaminasi bahan non-halal

CP3.3
1: GPS, RFID, dan shipment tracking berjalan
2: Data tersedia namun belum realtime
3: Sebagian histori hilang
4: Sistem traceability manual dan lemah
5: Perjalanan tidak dapat ditelusuri

CP3.4
1: Seluruh surat jalan, sertifikat kesehatan, jadwal perjalanan, dan incident report lengkap
2: Minor issue administratif pada dokumen
3: Sebagian dokumen perjalanan belum lengkap
4: Banyak dokumen tidak tervalidasi atau tidak update
5: Tidak tersedia dokumen perjalanan atau perjalanan ilegal

CP3.5
1: Seluruh handler memahami SOP halal handling, animal welfare, dan emergency procedure
2: Minor issue training refreshment
3: Evaluasi kompetensi tidak konsisten
4: Petugas kurang memahami SOP halal logistics
5: Tidak ada pelatihan halal handling dan terjadi kesalahan penanganan serius

CP4.1
1: Sertifikat halal aktif dan sesuai scope
2: Dokumen lengkap namun mendekati expired
3: Audit surveillance terlambat
4: Scope sertifikasi tidak sesuai aktivitas
5: Tidak memiliki sertifikat halal aktif

CP4.2
1: Seluruh JULEHA tersertifikasi dan kompeten
2: Sebagian training perlu refresh
3: Evaluasi kompetensi tidak rutin
4: Kompetensi syariah lemah
5: Penyembelih tidak tersertifikasi

CP4.3
1: Seluruh proses sesuai syariah dan SJPH
2: Minor deviation administratif
3: Stunning belum terdokumentasi optimal
4: Prosedur syariah tidak konsisten
5: Penyembelihan tidak sesuai syariat Islam

CP4.4
1: Pemeriksaan lengkap dan terdokumentasi
2: Minor delay dokumentasi
3: Sebagian inspeksi tidak lengkap
4: Pengawasan veteriner lemah
5: Tidak dilakukan inspeksi kesehatan

CP4.5
1: Seluruh area produksi, alat sembelih, conveyor, lantai, drainase, dan fasilitas sanitasi dibersihkan sesuai SOP halal sanitation serta terdokumentasi lengkap
2: Sanitasi berjalan baik dengan minor issue administratif pada checklist atau jadwal cleaning
3: Sanitasi tidak konsisten pada beberapa area atau cleaning validation belum lengkap
4: Area atau alat berpotensi menyebabkan kontaminasi biologis/najis dan monitoring sanitasi lemah
5: Area produksi tidak higienis, alat tercemar najis/non-halal, atau tidak dilakukan sanitasi sesuai SOP

CP4.6
1: Jalur produksi, area penyimpanan, alat, handling, dan distribusi halal sepenuhnya terpisah dari non-halal
2: Segregasi berjalan dengan minor issue pada labeling atau visual identification
3: Area segregasi tersedia namun belum optimal atau belum terdokumentasi lengkap
4: Risiko pencampuran halal/non-halal tinggi akibat shared equipment atau layout tidak sesuai
5: Terjadi cross contamination atau pencampuran langsung produk halal dan non-halal

CP4.7
1: Seluruh batch karkas dapat ditelusuri mulai dari asal ternak, penyembelihan, processing, hingga distribusi secara real-time
2: Sistem traceability berjalan baik namun terdapat minor issue administratif
3: Sebagian batch belum terintegrasi penuh dengan sistem traceability
4: Dokumentasi tidak konsisten dan sistem traceability lemah/manual
5: Produk tidak dapat ditelusuri dan dokumentasi produksi tidak tersedia

CP4.8
1: Audit internal halal dilakukan rutin, seluruh temuan ditindaklanjuti melalui CAPA dan diverifikasi efektivitasnya
2: Audit berjalan baik dengan minor delay corrective action
3: Audit tidak konsisten atau sebagian CAPA belum terdokumentasi
4: Banyak temuan audit berulang dan tindakan korektif tidak efektif
5: Tidak ada audit internal atau tidak ada sistem corrective action

CP4.9
1: Penyelia halal aktif melakukan monitoring, verifikasi halal, pelaporan, sosialisasi, dan evaluasi rutin terhadap seluruh aktivitas RPH
2: Pengawasan berjalan baik dengan minor issue dokumentasi monitoring
3: Monitoring halal belum konsisten di seluruh area
4: Penyelia halal tidak aktif atau pelaporan halal lemah
5: Tidak ada sistem pengawasan halal internal

CP5.1
1: Karkas ditangani higienis sesuai SOP halal
2: Minor issue APD atau sanitasi
3: Cleaning tidak konsisten
4: Karkas berpotensi kontaminasi
5: Karkas terkontaminasi najis

CP5.2
1: Batch tracking lengkap dan realtime
2: Labeling minor issue
3: Sebagian batch tidak terdokumentasi
4: Traceability lemah
5: Batch tidak dapat ditelusuri

CP5.3
1: Karkas halal dan non-halal sepenuhnya terpisah pada seluruh proses
2: Segregasi berjalan dengan minor issue labeling
3: Area segregasi belum optimal
4: Risiko pencampuran tinggi
5: Terjadi cross contamination halal/non-halal

CP5.4
1: Seluruh aktivitas post-slaughter terdokumentasi lengkap dan realtime
2: Minor issue pencatatan administratif
3: Sebagian logbook atau checklist tidak lengkap
4: Dokumentasi tidak konsisten dan sulit diverifikasi
5: Tidak tersedia dokumentasi proses

CP6.1
1: Semua additive dan bahan tambahan bersertifikat halal dan tervalidasi
2: Sebagian menggunakan supplier declaration
3: Sebagian dokumen halal belum update
4: Additive tidak tervalidasi dengan baik
5: Menggunakan additive non-halal/syubhat

CP6.2
1: Seluruh peralatan dibersihkan sesuai SOP halal sanitation dan tervalidasi
2: Cleaning berjalan dengan minor issue dokumentasi
3: Sanitasi tidak konsisten
4: Potensi kontaminasi biologis/najis tinggi
5: Peralatan terpapar non-halal atau tidak disanitasi

CP6.3
1: Dedicated halal line tersedia dan tervalidasi
2: Shared line dengan cleansing procedure tervalidasi
3: Segregasi line belum optimal
4: Risiko pencampuran halal/nonhalal tinggi
5: Jalur produksi halal dan non-halal bercampur

CP6.4
1: Batch dan formula produk tervalidasi, terdokumentasi, dan realtime traceable
2: Minor issue administrasi batch
3: Sebagian formula belum terdokumentasi lengkap
4: Kontrol batch lemah dan rawan kesalahan
5: Formula tidak tervalidasi atau batch tidak dapat ditelusuri

CP6.5
1: Kemasan dan label sesuai regulasi halal dan BPJPH
2: Minor issue desain/administratif label
3: Sebagian label belum update
4: Label halal tidak tervalidasi
5: Produk tanpa label halal resmi atau mislabeling

CP6.6
1: Seluruh operator telah training halal, hygiene, dan SOP processing
2: Training berjalan namun refreshment belum rutin
3: Sebagian operator belum dievaluasi kompetensinya
4: Pemahaman SOP halal rendah
5: Tidak ada training halal atau operator tidak kompeten

CP7.1
1: Monitoring suhu realtime dan stabil
2: Ada deviasi minor suhu
3: Alarm suhu tidak konsisten
4: Fluktuasi suhu tinggi
5: Suhu gagal dikontrol

CP7.2
1: Penyimpanan halal terpisah sempurna
2: Minor issue labeling
3: Area segregasi kurang jelas
4: Risiko pencampuran tinggi
5: Produk halal bercampur nonhalal

CP7.3
1: Gudang sangat higienis
2: Minor issue sanitasi
3: Cleaning tidak konsisten
4: Area berpotensi kontaminasi
5: Gudang tidak higienis dan tercemar

CP7.4
1: Traceability realtime dan FIFO berjalan optimal
2: Minor issue administrasi
3: Sebagian batch tidak lengkap
4: Sistem traceability lemah
5: Produk tidak dapat ditelusuri

CP7.5
1: Sistem incident handling berjalan efektif
2: Ada delay minor penanganan
3: Respons insiden tidak konsisten
4: Banyak insiden tidak tertangani
5: Tidak ada sistem incident handling

CP8.1
1: Kendaraan khusus halal tervalidasi
2: Shared transport dengan cleansing tervalidasi
3: Cleaning tidak konsisten
4: Riwayat nonhalal tidak jelas
5: Transport digunakan campuran halal/non-halal

CP8.2
1: Sanitasi kendaraan optimal
2: Minor issue sanitasi
3: Sanitasi tidak konsisten
4: Risiko kontaminasi tinggi
5: Kendaraan terkontaminasi najis/non-halal

CP8.3
1: Suhu distribusi stabil dan termonitor
2: Deviasi minor
3: Monitoring manual
4: Banyak fluktuasi suhu
5: Tidak ada kontrol suhu

CP8.4
1: Traceability realtime berjalan
2: Minor issue administratif
3: Data distribusi tidak lengkap
4: Sistem traceability lemah
5: Shipment tidak dapat ditelusuri

CP8.5
1: Loading sangat higienis dan terkontrol
2: Minor issue operasional
3: Segregasi loading kurang optimal
4: Risiko kontaminasi tinggi
5: Terjadi cross contamination

CP8.6
1: Dokumentasi lengkap dan realtime
2: Minor issue administrasi
3: Sebagian dokumen tidak lengkap
4: Dokumentasi sulit diverifikasi
5: Tidak tersedia dokumentasi

CP9.1
1: Seluruh label halal valid dan terverifikasi
2: Minor issue administratif
3: Sebagian label kurang jelas
4: Label halal tidak tervalidasi
5: Produk tanpa label halal resmi

CP9.2
1: Display halal terpisah sempurna
2: Minor issue layout
3: Label display kurang jelas
4: Risiko pencampuran tinggi
5: Produk halal dan non-halal bercampur

CP9.3
1: Suhu stabil dan termonitor
2: Minor deviation
3: Monitoring kurang konsisten
4: Fluktuasi suhu tinggi
5: Tidak ada kontrol suhu

CP9.4
1: FIFO/FEFO berjalan optimal
2: Minor issue administrasi
3: Monitoring expired lemah
4: Banyak produk near expired
5: Produk expired dijual

CP9.5
1: Supplier traceability sangat baik
2: Minor issue dokumen
3: Traceability sebagian belum lengkap
4: Supplier verification lemah
5: Supplier tidak dapat diverifikasi

CP9.6
1: Sistem complaint handling berjalan efektif
2: Respons lambat minor
3: Sebagian complaint tidak terdokumentasi
4: Tidak ada tindak lanjut jelas
5: Tidak ada sistem penanganan keluhan
`;

const lines = rawText.split('\\n');
const dict = {};
let currentKey = null;

for (const line of lines) {
  const t = line.trim();
  if (!t) continue;
  if (t.startsWith('CP')) {
    currentKey = t;
    dict[currentKey] = [];
  } else if (currentKey && t.match(/^[1-5]:/)) {
    dict[currentKey].push(t.substring(2).trim());
  }
}

const fileContent = \`export const SCALE_DESCRIPTIONS: Record<string, string[]> = \${JSON.stringify(dict, null, 2)};
\`;

fs.writeFileSync('src/lib/data/scale-descriptions.ts', fileContent);
console.log('Scale descriptions generated.');
