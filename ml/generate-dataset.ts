import fs from 'fs';
import path from 'path';

// Helper for combinations
function getRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
}

const generateIntentDataset = () => {
    const dataset: { text: string, intent: string }[] = [];
    const targetPerIntent = 100;

    // 1. knowledge_query
    const kq_prefixes = ["apa itu", "tolong jelaskan", "bagaimana aturan", "apa yang dimaksud dengan", "bisakah anda jelaskan", "sebutkan", "apa regulasi tentang", "gimana aturan", "kasih tau saya tentang"];
    const kq_topics = ["titik kritis halal", "sistem jaminan halal", "SJH", "penyembelihan hewan", "pemisahan fasilitas halal", "kriteria bahan haram", "SOP kebersihan", "undang-undang jph", "sertifikasi halal BPJPH", "audit halal", "penanganan produk tidak sesuai", "traceability batch", "Fuzzy AHP", "skala saaty"];
    for (let i = 0; i < targetPerIntent; i++) {
        const text = i < 20 ? `${getRandom(kq_prefixes)} ${getRandom(kq_topics)}?` : `${getRandom(kq_topics)} itu apa sih penjelasannya?`;
        dataset.push({ text: text.trim(), intent: "knowledge_query" });
    }

    // 2. risk_check
    const rc_prefixes = ["berapa skor risiko", "tolong cek risiko", "gimana nilai risiko", "tampilkan hasil risiko", "apakah status risiko", "berapa bobot", "hitung risiko untuk", "kasih liat bobot AHP"];
    const rc_topics = ["batch B-001", "batch B-002", "CP1", "CP4", "Titik Kritis 3", "kuesioner pakar", "penyembelihan di RPH", "transportasi daging", "fasilitas pemotongan", "kriteria fasilitas"];
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
    const od_prefixes = ["tampilkan daftar", "siapa saja", "ada berapa", "sebutkan list", "berikan data", "siapa nama", "lokasi", "mana saja"];
    const od_topics = ["farm aktif", "juru sembelih halal", "RPH yang terdaftar", "transporter", "outlet ritel", "petugas RPH", "pakar K1", "responden kuesioner", "fasilitas kandang"];
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
        // slight variation to reach 100
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
