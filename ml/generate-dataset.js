const fs = require('fs');
const path = require('path');

// Helper for combinations
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const generateIntentDataset = () => {
  const dataset = [];
  const targetPerIntent = 100;

  // 1. knowledge_query
  const kq_prefixes = ["apa itu", "tolong jelaskan", "bagaimana aturan", "apa yang dimaksud dengan", "bisakah anda jelaskan", "sebutkan", "apa regulasi tentang", "gimana aturan", "kasih tau saya tentang"];
  const kq_topics = ["titik kritis halal", "sistem jaminan halal", "SJH", "penyembelihan hewan", "pemisahan fasilitas halal", "kriteria bahan haram", "SOP kebersihan", "undang-undang jph", "sertifikasi halal BPJPH", "audit halal", "penanganan produk tidak sesuai", "traceability batch", "Fuzzy AHP", "skala saaty"];
  for (let i = 0; i < targetPerIntent; i++) {
    const text = i < 20 ? `${getRandom(kq_prefixes)} ${getRandom(kq_topics)}?` : `${getRandom(kq_topics)} itu apa sih penjelasannya?`;
    dataset.push({ text: text.trim(), intent: "knowledge_query" });
  }

  // 2. risk_check
  const rc_prefixes = ["berapa skor risiko", "tolong cek risiko", "gimana nilai risiko", "tampilkan hasil risiko", "apakah status risiko", "berapa bobot", "hitung risiko untuk", "kasih liat bobot AHP", "aman ga", "safe ga", "apakah aman", "risikonya gimana", "level risiko di", "ada deviasi keamanan di"];
  const rc_topics = ["batch B-001", "batch B-002", "CP1", "CP2", "CP3", "CP4", "Titik Kritis 3", "kuesioner pakar", "penyembelihan di RPH", "transportasi daging", "fasilitas pemotongan", "kriteria fasilitas", "RPH Terpadu Semarang", "CP1 Kandang", "RPH Halal Surabaya"];
  for (let i = 0; i < targetPerIntent; i++) {
    dataset.push({ text: `${getRandom(rc_prefixes)} ${getRandom(rc_topics)}`, intent: "risk_check" });
  }

  // 3. batch_trace
  const bt_prefixes = ["lacak batch", "tolong lacak", "cari info batch", "dari mana asal", "gimana riwayat", "tampilkan traceability", "cek asal usul", "lacak eartag"];
  const bt_topics = ["B-001", "B-002", "B-099", "E-1234", "sapi dengan eartag E-001", "daging batch B-22", "batch produksi hari ini", "pengiriman B-444"];
  for (let i = 0; i < targetPerIntent; i++) {
    dataset.push({ text: `${getRandom(bt_prefixes)} ${getRandom(bt_topics)}`, intent: "batch_trace" });
  }

  // 4. operational_data
  const od_prefixes = ["berapa jumlah", "tolong tampilkan data", "cari data", "siapa saja", "apa nama", "sebutkan nama", "ada berapa banyak", "dimana lokasi", "apa fasilitas", "apa aja"];
  const od_topics = ["peternakan kita", "juru sembelih", "RPH terdaftar", "distributor", "cold storage", "batch yang lolos", "RPH yang ada di Jatim", "cold storage yang ada di Bandung", "distributor di Jabodetabek", "peternakan di Jatim", "RPH di Jateng", "cold storage di Jabar", "RPH di Bogor"];
  for (let i = 0; i < targetPerIntent; i++) {
    dataset.push({ text: `${getRandom(od_prefixes)} ${getRandom(od_topics)}`, intent: "operational_data" });
  }

  // 5. greeting
  const gr_words = ["halo", "assalamualaikum", "hai", "selamat pagi", "selamat siang", "selamat malam", "terima kasih", "makasih", "ok paham", "oke thanks", "hi bot", "p", "test"];
  for (let i = 0; i < targetPerIntent; i++) {
    dataset.push({ text: getRandom(gr_words) + (Math.random() > 0.5 ? " " + getRandom(["ya", "bot", "bantu saya", "min"]) : ""), intent: "greeting" });
  }

  // 6. out_of_scope
  const oos_texts = [
    "berapa harga bitcoin hari ini", "tolong buatkan resep nasi goreng", "siapa presiden amerika", "cuaca hari ini gimana",
    "cara install windows", "apa rekomendasi film bagus", "buatkan puisi cinta", "berita bola semalam",
    "cara hack wifi", "lirik lagu indonesia raya", "cara masak rendang", "jadwal kereta api", "cara daftar cpns",
    "game paling seru", "rekomendasi hp murah", "cara mengatasi rambut rontok"
  ];
  for (let i = 0; i < targetPerIntent; i++) {
    const base = getRandom(oos_texts);
    const suffix = Math.random() > 0.5 ? " dong" : " ya";
    dataset.push({ text: base + (Math.random() > 0.3 ? suffix : ""), intent: "out_of_scope" });
  }

  // Shuffle array
  for (let i = dataset.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dataset[i], dataset[j]] = [dataset[j], dataset[i]];
  }

  // Write to CSV
  const csvContent = "text,label\n" + dataset.map(d => `"${d.text}",${d.intent}`).join("\n");
  const filePath = path.join(__dirname, 'dataset_intent.csv');
  fs.writeFileSync(filePath, csvContent);

  console.log(`✅ Berhasil men-generate ${dataset.length} baris dataset ke ${filePath}`);
};

generateIntentDataset();
"apa itu fatwa halal?",
  "MUI itu organisasi apa?",
  "apa itu letter of guarantee?",
  "apa itu istihalah?",
  "jelaskan proses samak",
  "apa hukum gelatin dalam islam?",
  "aturan alkohol dalam produk halal gimana?",
  "jelaskan positive list bahan halal",
  "apa itu CEROL?",
  "gimana cara cek kehalalan bahan baku?",
  "apa itu surveillance audit?",
  "jelaskan perbedaan HCP dan CCP",
  "apa itu halal value chain?",
    ],
  },

risk_check: {
  test: [
    "berapa skor risiko batch B-001?",
    "apakah RPH ini aman?",
    "cek tingkat risiko kontaminasi gudang",
    "bobot prioritas CP mana yang tertinggi?",
    "tampilkan skor risiko semua titik kritis",
    "nilai fuzzy AHP untuk CP1 berapa?",
    "mana yang lebih berisiko penyembelihan atau transportasi?",
    "berapa bobot kriteria kebersihan peralatan?",
    "apakah ada titik kritis di atas ambang batas?",
    "tampilkan ranking risiko dari tertinggi",
    "apakah bobot AHP sudah divalidasi pakar?",
    "berapa threshold risiko yang tidak aman?",
    "skor akhir fuzzy AHP sudah keluar?",
    "cek level risiko pendinginan daging",
    "tampilkan risk matrix untuk semua CCP",
    "berapa risk priority number setiap bahaya?",
    "tampilkan heat map risiko",
    "berapa skor risk maturity saat ini?",
    "cek overall risk posture",
    "ada critical risk yang perlu ditangani?",
    "RPH Jakarta gimana kondisi risikonya?",
    "batch terakhir aman gak skornya?",
    "kondisi risiko gudang gimana?",
    "cold storage aman gak suhunya?",
    "transportasi daging risikonya gimana?",
    "supplier ini aman gak?",
    "batch B-001 lolos standar gak?",
    "compliance keamanan gimana?",
    "ada deviasi dari standar keamanan?",
    "ada temuan audit keamanan?",
  ],
    train: [
      "fasilitas pemotongan lolos standar gak?",
      "daging ini layak konsumsi gak?",
      "proses pemotongan sesuai standar?",
      "RPH Tangerang risikonya gimana?",
      "ada masalah keamanan gak?",
      "semua titik kritis aman?",
      "ada warning dari sistem risiko?",
      "ada issue keamanan gak?",
      "kondisi keamanan pangan gimana?",
      "kualitas batch ini masih bagus?",
      "standar keamanan terpenuhi gak?",
      "sesuai SOP keamanan gak?",
      "lolos audit keamanan gak?",
      "masalah keamanan apa yang ditemukan?",
      "perlu perbaikan keamanan gak?",
      "rekomendasi perbaikan keamanan apa?",
      "prioritas perbaikan risiko yang mana?",
      "yang paling urgent diperbaiki apa?",
      "action plan keamanan apa?",
      "apakah mitigasi risiko sudah efektif?",
      "berapa residual risk setelah mitigasi?",
      "risk appetite perusahaan berapa?",
      "ada emerging risk baru gak?",
      "risk register sudah di-update?",
      "berapa total risk exposure?",
      "risk trend bulan ini naik atau turun?",
      "early warning system aktif gak?",
      "contingency plan sudah siap?",
      "stress testing hasilnya gimana?",
      "probability of occurrence berapa?",
      "near miss incident ada gak?",
      "root cause analysis sudah dilakukan?",
      "corrective action completion rate berapa?",
      "follow up temuan sudah?",
      "inherent risk vs residual risk gimana?",
      "risk maturity level perusahaan dimana?",
      "ada update regulasi yang affect risk?",
      "risk velocity masing-masing risiko gimana?",
      "risk concentration di area mana?",
      "berapa gap antara actual risk dan target?",
    ],
  },

batch_trace: {
  test: [
    "daging di gudang ini asalnya dari mana?",
    "lacak asal usul batch yang barusan masuk",
    "sapi eartag E-1234 dari farm mana?",
    "riwayat perjalanan daging ini dari awal",
    "dari RPH mana batch B-001 dipotong?",
    "siapa yang motong sapi batch ini?",
    "kapan batch B-002 masuk gudang?",
    "traceability daging ke outlet Jakarta",
    "jalur distribusi batch terakhir",
    "nomor kendaraan pengangkut batch B-099",
    "tanggal penyembelihan batch ini",
    "jam berapa batch B-001 dipotong?",
    "juru sembelih batch ini siapa?",
    "dari peternakan siapa sapi E-001?",
    "berapa lama daging di perjalanan?",
    "suhu selama pengiriman batch ini",
    "hasil post mortem sapi E-1234",
    "sertifikat kesehatan hewan dari mana?",
    "dokter hewan yang memeriksa siapa?",
    "batch B-444 sudah sampai outlet?",
    "batch B-001 dari mana asalnya?",
    "sapi ini berasal dari mana?",
    "daging ini dari RPH mana?",
    "ini dari RPH mana ya?",
    "masuk ke gudang kapan?",
    "siapa yang kirim batch ini?",
    "rute pengiriman gimana?",
    "sudah sampai tujuan belum?",
    "posisi batch ini dimana sekarang?",
    "status pengiriman batch ini gimana?",
  ],
    train: [
      "asal usulnya dari mana?",
      "asalnya dari farm mana sih?",
      "datangnya kapan batch ini?",
      "siapa yang terima di gudang?",
      "lewat jalur mana pengirimannya?",
      "perjalanan batch ini gimana?",
      "prosesnya sudah sampai tahap mana?",
      "ada di gudang mana sekarang?",
      "dikirim ke outlet mana?",
      "outlet mana yang sudah terima?",
      "catatan pengiriman batch ini ada?",
      "dokumen batch ini lengkap?",
      "sertifikat halal RPH pemotong ada?",
      "surat jalan batch ini ada?",
      "data pengiriman batch ini ada gak?",
      "record perjalanan batch gimana?",
      "history perpindahan batch gimana?",
      "log pergerakan batch ada?",
      "kapan terakhir batch ini dicek?",
      "siapa yang cek terakhir kali?",
      "nomor resi pengiriman berapa?",
      "kode batch ini apa?",
      "eartag sapi ini nomor berapa?",
      "ID sapi ini apa?",
      "nomor batch berapa?",
      "detail batch ini apa aja?",
      "info lengkap batch B-002 dong",
      "cek riwayat batch B-099",
      "lihat jejak perjalanan batch ini",
      "tampilkan info sapi E-001",
      "ante mortem sapi ini gimana?",
      "SKKH batch ini nomor berapa?",
      "izin potong batch B-001 ada?",
      "pemilik ternak asal siapa?",
      "alamat farm asal sapi ini dimana?",
      "ada residu antibiotik di batch ini?",
      "uji mikrobiologi batch ini hasilnya?",
      "batch ini pernah di-recall gak?",
      "complaint untuk batch ini ada?",
      "shelf life batch ini berapa hari lagi?",
    ],
  },

operational_data: {
  test: [
    "ada berapa RPH yang terdaftar?",
    "tampilkan daftar farm aktif",
    "siapa saja juru sembelih tersertifikasi?",
    "list transporter yang kerja sama",
    "berapa jumlah outlet ritel kita?",
    "data petugas RPH hari ini siapa saja?",
    "siapa pakar responden AHP?",
    "berapa karyawan RPH Jakarta?",
    "jadwal shift juru sembelih minggu ini",
    "kapasitas potong RPH berapa per hari?",
    "rata-rata volume pemotongan per bulan",
    "data produksi kuartal terakhir",
    "jumlah batch yang diproses bulan ini",
    "statistik pengiriman minggu ini",
    "berapa persentase on-time delivery?",
    "berapa kendaraan pengangkut kita?",
    "daftar gudang beserta kapasitasnya",
    "suhu rata-rata cold storage minggu ini",
    "laporan maintenance peralatan RPH",
    "jadwal kalibrasi alat ukur kapan?",
    "data RPH lengkap dong",
    "info semua RPH Jakarta",
    "RPH Tangerang datanya apa saja?",
    "minta semua data operasional",
    "laporan bulanan mana?",
    "statistik operasional gimana?",
    "angka produksi berapa?",
    "jumlah pemotongan berapa?",
    "total pengiriman berapa?",
    "berapa banyak yang diproses?",
  ],
    train: [
      "ada berapa batch hari ini?",
      "siapa saja yang bertugas?",
      "list karyawan dong",
      "daftar petugas dong",
      "tampilkan semua data",
      "lihatkan laporan dong",
      "kasih data produksi",
      "minta laporan mingguan",
      "kirim data operasional",
      "export data ke excel dong",
      "download laporan bulanan",
      "print data RPH",
      "ada file laporannya gak?",
      "excel data produksi ada?",
      "PDF laporan bulanan ada?",
      "bisa kirim via email gak?",
      "rekap data bulanan dong",
      "ringkasan operasional mingguan",
      "summary produksi dong",
      "grafik produksi ada?",
      "chart pengiriman dong",
      "tren produksi gimana?",
      "perbandingan bulan ini dan lalu",
      "tahun lalu produksi berapa?",
      "bulan lalu pengiriman berapa?",
      "minggu lalu berapa batch?",
      "hari ini sudah berapa?",
      "update data terbaru dong",
      "data terkini apa aja?",
      "progress target produksi gimana?",
      "pencapaian target berapa persen?",
      "KPI operasional gimana?",
      "performance RPH gimana?",
      "produktivitas karyawan gimana?",
      "efisiensi produksi berapa?",
      "biaya operasional berapa?",
      "budget bulanan berapa?",
      "pengeluaran RPH berapa?",
      "pendapatan bulan ini berapa?",
      "profit margin berapa?",
    ],
  },

greeting: {
  test: [
    "halo",
    "hai",
    "assalamualaikum",
    "selamat pagi",
    "selamat siang",
    "selamat sore",
    "selamat malam",
    "hi",
    "hey",
    "p",
    "halo admin",
    "hai bot",
    "pagi",
    "siang",
    "sore",
    "malam",
    "waalaikumsalam",
    "terima kasih",
    "makasih",
    "makasih ya",
    "thanks",
    "ok terima kasih",
    "oke makasih",
    "sip makasih",
    "ok paham",
    "oke",
    "sip",
    "ok",
    "baik",
    "siap",
  ],
    train: [
      "paham",
      "mengerti",
      "oke deh",
      "oke siap",
      "iya paham",
      "oh gitu",
      "oke noted",
      "test",
      "testing",
      "ping",
      "bot aktif?",
      "halo ada orang?",
      "masih aktif?",
      "bisa bantu?",
      "minta bantuan",
      "halo mau tanya",
      "permisi",
      "maaf ganggu",
      "boleh tanya?",
      "bye",
      "dadah",
      "sampai jumpa",
      "wassalam",
      "salam kenal",
      "nice",
      "mantap",
      "keren",
      "wow",
      "good",
      "bagus",
      "hallo",
      "helo",
      "hy",
      "yoo",
      "yo",
      "woi",
      "min",
      "admin",
      "salam",
      "met pagi",
    ],
  },

out_of_scope: {
  test: [
    "berapa harga bitcoin?",
    "resep nasi goreng dong",
    "siapa presiden pertama Indonesia?",
    "cuaca Jakarta gimana?",
    "cara install Windows",
    "rekomendasi film dong",
    "buatkan puisi cinta",
    "hasil bola semalam",
    "cara hack wifi",
    "lirik lagu Indonesia Raya",
    "cara masak rendang",
    "jadwal kereta Jakarta Surabaya",
    "cara daftar CPNS",
    "game seru apa?",
    "HP murah terbaik apa?",
    "cara atasi rambut rontok",
    "kurs dollar berapa?",
    "lowongan kerja Jakarta",
    "tempat wisata Bali",
    "cara diet sehat",
    "berapa harga sapi per kilo?",
    "dimana beli daging murah?",
    "resep steak sapi",
    "cara masak daging biar empuk",
    "harga daging di pasar berapa?",
    "jual daging online dimana?",
    "cara potong daging untuk sate",
    "resep sop sapi",
    "restoran steak enak dimana?",
    "cara awetkan daging tanpa kulkas",
  ],
    train: [
      "daging tahan berapa lama di freezer?",
      "cara cairkan daging beku",
      "kenapa daging sapi mahal?",
      "cara ternak sapi",
      "modal ternak sapi berapa?",
      "penyakit sapi apa aja?",
      "cara obati sapi sakit",
      "lacak paket Shopee",
      "tracking JNE resi ini",
      "cek pengiriman Tokopedia",
      "lacak HP hilang",
      "risiko main forex",
      "risiko investasi properti",
      "manajemen risiko konstruksi",
      "data statistik penduduk",
      "data COVID terbaru",
      "data inflasi Indonesia",
      "apa itu machine learning?",
      "cara belajar programming",
      "apa itu AI?",
      "cara bikin website",
      "apa itu blockchain?",
      "cara mining bitcoin",
      "promo cashback hari ini",
      "kode voucher gratis ongkir",
      "cara dapat followers",
      "apa itu SEO?",
      "tips wawancara kerja",
      "cara bikin CV",
      "cara menabung efektif",
      "bank digital terbaik",
      "RPH terdekat dari rumah dimana?",
      "berapa gaji kerja di RPH?",
      "lowongan kerja di RPH ada?",
      "cara melamar kerja di RPH",
      "sapi kurban terbaik apa?",
      "harga sapi kurban tahun ini",
      "tips beli sapi yang sehat",
      "cara bedakan daging sapi dan babi",
      "daging sapi palsu cirinya apa?",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// GENERATE: Train (augmented) + Test (murni) → 1 file CSV
// dengan kolom "split" agar Colab tahu mana train mana test
// ═══════════════════════════════════════════════════════════════

const TRAIN_TARGET = 270; // per intent

const generateDataset = () => {
  let trainRows = [];
  let testRows = [];

  for (const [intent, { train: trainSeeds, test: testSeeds }] of Object.entries(intentData)) {
    // TEST: masukkan apa adanya tanpa augmentasi
    for (const s of testSeeds) {
      testRows.push({ text: s.toLowerCase().trim(), intent });
    }

    // TRAIN: augmentasi dari train seeds sampai 270
    const generated = new Set();
    for (const s of trainSeeds) {
      generated.add(s.toLowerCase().trim());
    }
    let attempts = 0;
    while (generated.size < TRAIN_TARGET && attempts < 20000) {
      const base = getRandom(trainSeeds);
      generated.add(augment(base));
      attempts++;
    }
    while (generated.size < TRAIN_TARGET) {
      const base = getRandom(trainSeeds);
      generated.add(augment(base) + " " + getRandom(fillers));
    }
    for (const text of generated) {
      trainRows.push({ text, intent });
    }
  }

  // Shuffle masing-masing
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };
  shuffle(trainRows);
  shuffle(testRows);

  const escapeCsv = (str) => `"${str.replace(/"/g, '""')}"`;

  // Write TRAIN
  const trainCsv = "text,label\n" + trainRows.map(d => `${escapeCsv(d.text)},${d.intent}`).join("\n");
  fs.writeFileSync(path.join(__dirname, 'dataset_intent_train.csv'), trainCsv);

  // Write TEST
  const testCsv = "text,label\n" + testRows.map(d => `${escapeCsv(d.text)},${d.intent}`).join("\n");
  fs.writeFileSync(path.join(__dirname, 'dataset_intent_test.csv'), testCsv);

  // Write COMBINED (for backward compat)
  const allRows = [...trainRows, ...testRows];
  shuffle(allRows);
  const allCsv = "text,label\n" + allRows.map(d => `${escapeCsv(d.text)},${d.intent}`).join("\n");
  fs.writeFileSync(path.join(__dirname, 'dataset_intent.csv'), allCsv);

  console.log(`\n✅ Dataset berhasil di-generate!`);
  console.log(`\n📊 TRAIN (${trainRows.length} baris):`);
  const tc = {};
  for (const d of trainRows) tc[d.intent] = (tc[d.intent] || 0) + 1;
  for (const [k, v] of Object.entries(tc)) console.log(`   ${k}: ${v}`);

  console.log(`\n📊 TEST (${testRows.length} baris):`);
  const ec = {};
  for (const d of testRows) ec[d.intent] = (ec[d.intent] || 0) + 1;
  for (const [k, v] of Object.entries(ec)) console.log(`   ${k}: ${v}`);

  console.log(`\n📁 File yang dihasilkan:`);
  console.log(`   dataset_intent_train.csv (${trainRows.length} baris)`);
  console.log(`   dataset_intent_test.csv  (${testRows.length} baris)`);
  console.log(`   dataset_intent.csv       (${allRows.length} baris, gabungan)`);
};

generateDataset();
