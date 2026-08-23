# 🎬 Script Narasi — Video Tutorial User Manual
**Sistem Informasi Manajemen Halal Supply Chain Terintegrasi (KMS & DSS)**

> **Durasi Total Estimasi:** ~15-20 menit  
> **Format:** 7 segmen video terpisah + narasi dubbing  
> **URL Aplikasi:** https://integratedhalal.vercel.app/

---

## 📋 DAFTAR SEGMEN VIDEO

| No | Segmen | Durasi Est. | Akun Login |
|----|--------|-------------|------------|
| 1 | Login → Dashboard | 1-2 menit | admin@halal-kms.com |
| 2 | Kuesioner 1 — Pembobotan Fuzzy AHP | 3-4 menit | pakark1@halal.com |
| 3 | Kuesioner 3 — Kondisi Aktual | 3-4 menit | farm@halal-kms.com |
| 4 | Kuesioner 2 — Pengukuran Risiko | 3-4 menit | pakark2@halal.com |
| 5 | Halal AI Chatbot | 2-3 menit | admin@halal-kms.com |
| 6 | Dashboard Admin | 2-3 menit | admin@halal-kms.com |
| 7 | Knowledge Base Management | 1-2 menit | admin@halal-kms.com |

---

## SEGMEN 1: LOGIN → DASHBOARD
**🎬 Recording: `01_login_dashboard`**

### Narasi:

> *"Selamat datang di tutorial penggunaan Sistem Informasi Manajemen Halal Supply Chain Terintegrasi.*
>
> *Sistem ini menggabungkan Decision Support System berbasis Fuzzy AHP dengan Knowledge Management System yang ditenagai oleh kecerdasan buatan.*
>
> *Mari kita mulai dengan cara login ke dalam sistem."*

### Langkah-langkah:

1. **Buka browser** → Ketik URL `https://integratedhalal.vercel.app/`
2. **Halaman utama muncul** → Klik tombol **Login** atau navigasi ke `/login`

> *"Pada halaman login, masukkan email dan password sesuai role Anda. Sistem memiliki beberapa jenis akun:*
> - *ADMIN — untuk kontrol penuh*
> - *PAKAR K1 — untuk pengisian pembobotan Fuzzy AHP*
> - *PAKAR K2 — untuk penilaian risiko sebagai auditor*
> - *Responden Lapangan (CP1 sampai CP9) — untuk input kondisi aktual di setiap titik kritis."*

3. **Input email:** `admin@halal-kms.com`
4. **Input password:** `admin123`
5. **Klik Login**

> *"Setelah berhasil login, Anda akan diarahkan ke halaman Dashboard utama. Di sini Anda dapat melihat ringkasan statistik sistem, termasuk jumlah batch, skor risiko rata-rata, dan status setiap titik kritis."*

6. **Tunjukkan kartu statistik** (Total Batch, Batch Risiko Tinggi, Rata-rata Skor, Pass Rate, dll.)
7. **Scroll ke tabel Risiko Per CP** — tunjukkan 9 titik kritis dengan bobot dan statusnya
8. **Tunjukkan navbar** — jelaskan menu yang tersedia

> *"Dari dashboard ini, Anda bisa mengakses berbagai fitur melalui menu navigasi di bagian atas. Mari kita lanjutkan ke pengisian Kuesioner 1."*

---

## SEGMEN 2: KUESIONER 1 — PEMBOBOTAN FUZZY AHP
**🎬 Recording: `02_kuesioner1_ahp`**

### Narasi:

> *"Sekarang kita akan mengisi Kuesioner 1, yaitu Pembobotan Fuzzy AHP. Kuesioner ini diisi oleh Pakar untuk menentukan bobot prioritas kriteria risiko halal.*
>
> *Pertama, login menggunakan akun Pakar K1."*

### Langkah-langkah:

1. **Login** dengan `pakark1@halal.com` / `pakar123`
2. **Navigasi ke menu Kuesioner 1 (Pembobotan)**

> *"Sebelum memulai pengisian, lengkapi data diri pakar pada form Latar Belakang Responden."*

3. **Isi profil pakar:**
   - Nama Lengkap: `Dr. Ahmad Sulaiman`
   - Jenis Kelamin: `Laki-laki`
   - Jenis Keahlian: `Ahli Halal / MUI`
   - Posisi/Jabatan: `Ketua Komisi Fatwa`
   - Nama Instansi: `MUI Pusat`
   - Pengalaman: `15 tahun`
   - Email: `pakark1@halal.com`

> *"Pengisian Kuesioner 1 dilakukan dalam 3 tahap bertingkat."*

4. **Tahap A — Kriteria Umum (KU Level):**

> *"Tahap pertama adalah perbandingan antar dimensi utama: Kualitas Produk, Keamanan dan Kepatuhan Halal, serta Operasional dan Logistik.*
>
> *Gunakan slider untuk menentukan tingkat kepentingan relatif. Geser ke kiri jika kriteria di sisi kiri lebih penting, geser ke kanan jika kriteria di sisi kanan lebih penting. Posisi tengah berarti sama penting.*
>
> *Misalnya, jika menurut Anda Keamanan dan Kepatuhan Halal sangat lebih penting daripada Kualitas Produk, geser slider 6 poin ke kanan."*

   - Isi beberapa perbandingan menggunakan slider
   - Klik **Simpan Pembobotan**
   - Konfirmasi **Ya, Simpan**

5. **Tahap B — Level CP (Perbandingan Antar Titik Kritis):**

> *"Tahap kedua membandingkan kepentingan relatif antar 9 Critical Points. Total ada 36 pasangan perbandingan.*
>
> *Contoh: CP1 Farm/Kandang versus CP4 RPH/Penyembelihan — tentukan mana yang lebih kritis dari segi risiko halal."*

   - Isi beberapa perbandingan CP
   - Simpan dan lanjutkan

6. **Tahap C — Sub-Kriteria Per CP:**

> *"Tahap terakhir membandingkan sub-kriteria di dalam masing-masing CP. Misalnya untuk CP1 Farm, Anda membandingkan Asal-usul Sapi versus Status Kesehatan, Asal-usul versus Kepatuhan Pakan, dan seterusnya.*
>
> *Setelah semua tahap diisi, sistem akan otomatis menghitung bobot menggunakan metode Fuzzy AHP, termasuk pengecekan Consistency Ratio."*

   - Isi perbandingan sub-kriteria CP1
   - Simpan → Sistem auto-lanjut ke CP2

> *"Perhatikan bahwa jika Consistency Ratio kurang dari 0.10, input dianggap konsisten dan bobot akan diperbarui. Jika tidak, Anda akan diminta meninjau ulang jawaban."*

---

## SEGMEN 3: KUESIONER 3 — KONDISI AKTUAL (RESPONDEN LAPANGAN)
**🎬 Recording: `03_kuesioner3_aktual`**

### Narasi:

> *"Sekarang kita beralih ke Kuesioner 3, yaitu Form Kondisi Aktual yang diisi oleh responden lapangan.*
>
> *Perhatikan: Kuesioner 3 diisi SEBELUM Kuesioner 2, karena Auditor di K2 akan menilai berdasarkan data yang sudah diinput di K3.*
>
> *Login menggunakan akun responden lapangan."*

### Langkah-langkah:

1. **Login** dengan `farm@halal-kms.com` / `farm123`
2. **Navigasi ke Kuesioner 3 (Kondisi Aktual)**

> *"Halaman menampilkan form Kuesioner 3 dengan judul 'Kondisi Aktual'. Karena login sebagai CP1 Farm, hanya tab CP1 yang tersedia."*

3. **Isi Latar Belakang:**
   - Batch/Kode Ternak: (pilih dari dropdown)
   - Nama PIC: `Budi Santoso`
   - Posisi: `Kepala Peternakan`
   - Nama Farm: `PT Sapi Sehat Sejahtera`
   - Shift: `Pagi`

> *"Pilih Batch atau Kode Ternak dari dropdown. Jika sudah pernah diisi sebelumnya, akan muncul tanda centang."*

4. **Buka sub-kriteria pertama** (klik untuk expand)

> *"Untuk setiap indikator, Anda perlu:*
> 1. *Mencentang apakah bukti dokumen tersedia — klik Ya atau Tidak*
> 2. *Mengupload file bukti pendukung — klik tombol Upload untuk mengunggah PDF, gambar, atau dokumen*
> 3. *Menentukan kesesuaian — klik Sesuai atau Tidak berdasarkan standar yang berlaku"*

5. **Isi beberapa indikator:**
   - Klik **Ya** untuk ketersediaan bukti
   - Klik **Upload** → pilih file contoh
   - Klik **Sesuai** untuk kesesuaian

6. **Scroll ke Validasi Supervisor:**

> *"Di bagian akhir formulir, terdapat validasi Supervisor yang wajib diisi. Supervisor menentukan hasil verifikasi, tingkat risiko keseluruhan, dan tindakan korektif jika diperlukan.*
>
> *Perhatikan juga statistik kepatuhan yang otomatis dihitung berdasarkan jawaban Anda."*

   - Nama Supervisor: `Ir. Hasan Basri`
   - Hasil Verifikasi: `Sesuai`
   - Tingkat Risiko: pilih level 2
   - Tindakan Korektif: (kosongkan atau isi jika ada)

7. **Klik Simpan Kondisi Aktual** → Konfirmasi

> *"Data berhasil disimpan. Sistem akan otomatis melanjutkan ke CP berikutnya jika tersedia."*

---

## SEGMEN 4: KUESIONER 2 — PENGUKURAN RISIKO (AUDITOR)
**🎬 Recording: `04_kuesioner2_risiko`**

### Narasi:

> *"Sekarang kita mengisi Kuesioner 2, yaitu Pengukuran Tingkat Risiko yang diisi oleh Auditor.*
>
> *Kuesioner ini bersifat cross-referencing — artinya Auditor akan menilai berdasarkan data K3 yang sudah disubmit oleh responden lapangan."*

### Langkah-langkah:

1. **Login** dengan `pakark2@halal.com` / `pakar123`
2. **Navigasi ke Kuesioner 2 (Pengukuran Risiko)**

> *"Di halaman ini, Anda akan melihat banner petunjuk pengisian, tombol Download Rubrik untuk mengunduh pedoman penilaian, dan tabel referensi skala risiko dari 1 sampai 5."*

3. **Tunjukkan tabel skala risiko:**

> *"Skala penilaian menggunakan Likert 1 sampai 5:*
> - *Skor 1 = Sangat Rendah — risiko hampir tidak ada*
> - *Skor 2 = Rendah — risiko kecil dan mudah dikendalikan*
> - *Skor 3 = Sedang — mulai memerlukan pengawasan*
> - *Skor 4 = Tinggi — perlu tindakan segera*
> - *Skor 5 = Sangat Tinggi — risiko kritis"*

4. **Pilih Tab CP1**

5. **Pilih Batch / Data K3:**

> *"Langkah penting: pilih data kondisi aktual K3 yang akan dinilai dari dropdown. Tanpa memilih Batch, tombol submit akan dinonaktifkan."*

   - Pilih salah satu respons K3 dari dropdown

6. **Isi Identitas Auditor:**
   - Tanggal Audit: (otomatis hari ini)
   - Nama Auditor: `Dr. Fatimah Zahra`
   - Jenis Kelamin: `Perempuan`
   - Posisi: `Auditor Senior Halal`
   - Nama Instansi: `BPJPH`
   - No. Sertifikat: `AH-2024-001`

7. **Buka sub-kriteria dan mulai penilaian:**

> *"Expand sub-kriteria yang ingin dinilai. Untuk setiap indikator:*
> 1. *Periksa dokumen aktual yang diupload oleh responden K3 — klik file untuk melihat bukti*
> 2. *Tentukan kesesuaian — klik Sesuai atau Tidak*
> 3. *Berikan skor risiko 1 sampai 5 berdasarkan observasi Anda"*

   - Klik pada dokumen aktual (jika ada)
   - Klik **Sesuai** / **Tidak**
   - Pilih skor risiko (misal: 2)
   - Isi catatan auditor

8. **Simpan Penilaian Risiko** → Konfirmasi

> *"Data penilaian berhasil disimpan. Sistem otomatis melanjutkan ke CP berikutnya."*

---

## SEGMEN 5: HALAL AI CHATBOT
**🎬 Recording: `05_chatbot_demo`**

### Narasi:

> *"Fitur unggulan dari sistem ini adalah Halal AI Chatbot — asisten virtual cerdas yang menggunakan IndoBERT untuk memahami pertanyaan Anda dan RAG untuk mengambil informasi dari Knowledge Base."*

### Langkah-langkah:

1. **Navigasi ke menu Halal AI Chatbot** (atau buka `/chat`)

> *"Di halaman awal chatbot, Anda akan melihat tombol saran cepat untuk membantu memulai percakapan."*

2. **Tunjukkan tombol saran:** Cek Risiko Halal, Lacak Batch, Panduan Sembelih, Bobot CP

3. **Demo Pertanyaan 1 — Regulasi/Teori:**

> *"Mari kita coba bertanya tentang regulasi halal."*

   - Ketik: `Apa saja syarat pemotongan hewan halal menurut fatwa MUI?`
   - Tunggu respons streaming

> *"Chatbot mengklasifikasikan pertanyaan ini sebagai knowledge query, lalu mencari di Knowledge Base menggunakan vector similarity search, dan menyusun jawaban lengkap dengan referensi."*

4. **Demo Pertanyaan 2 — Cek Risiko:**

   - Ketik: `Berapa skor risiko untuk CP4 saat ini?`

> *"Untuk pertanyaan risiko, chatbot mengambil data langsung dari database DSS dan menampilkan bobot global, risk score, dan status risiko."*

5. **Demo Pertanyaan 3 — Lacak Batch:**

   - Ketik: `Lacak batch sapi TAG-A001`

> *"Fitur pelacakan batch menampilkan jejak lengkap dari Farm hingga Retail, termasuk skor risiko per CP dan rekomendasi otomatis dari referensi akademik."*

6. **Demo Pertanyaan 4 — Data Operasional:**

   - Ketik: `Tampilkan daftar RPH`

> *"Chatbot juga bisa mengambil data operasional seperti daftar Farm, RPH, Transporter, dan lainnya dari database."*

7. **Tunjukkan sidebar riwayat chat:**

> *"Di sidebar kiri, Anda dapat melihat riwayat percakapan, membuat sesi baru, atau menghapus sesi lama. Percakapan otomatis tersimpan di browser Anda."*

---

## SEGMEN 6: DASHBOARD ADMIN
**🎬 Recording: `06_dashboard_admin`**

### Narasi:

> *"Sekarang kita lihat Dashboard Admin untuk memantau kesehatan ekosistem supply chain."*

### Langkah-langkah:

1. **Login sebagai Admin** → Buka Dashboard

> *"Dashboard utama menampilkan kartu statistik ringkasan: Total Batch, Batch Risiko Tinggi, Rata-rata Skor Risiko, Pass Rate, Jumlah Farm, RPH, Sapi, dan jumlah respons kuesioner."*

2. **Tunjukkan kartu statistik satu per satu**

3. **Scroll ke Tabel Risiko Per CP:**

> *"Tabel ini menampilkan 9 titik kritis beserta Bobot Global dari Fuzzy AHP, Risk Score Lokal, Global Weighted Risk, dan status risiko dengan kode warna — Hijau untuk Low, Kuning untuk Moderate, Oranye untuk High, Merah untuk Critical."*

4. **Tunjukkan Tabel Batch Terbaru:**

> *"Di bawahnya ada tabel batch sapi terbaru. Klik pada salah satu batch untuk melihat detail CP Records."*

   - Expand salah satu batch

5. **Navigasi ke Rekap Pembobotan:**

> *"Menu Rekap Pembobotan menampilkan ringkasan semua respons Kuesioner 1 dari para pakar, termasuk matriks perbandingan dan bobot yang dihasilkan."*

6. **Navigasi ke menu AHP Steps:**

> *"Menu AHP Steps menampilkan langkah-langkah detail perhitungan Fuzzy AHP — mulai dari matriks TFN, Fuzzy Synthetic Extent, defuzzifikasi, hingga Consistency Ratio."*

7. **Navigasi ke Weighting:**

> *"Menu Weighting menampilkan visualisasi bobot global dan lokal untuk setiap CP."*

8. **Navigasi ke User Management:**

> *"Melalui User Management, Admin bisa menambah, mengubah, atau menonaktifkan pengguna, serta mengatur role mereka."*

---

## SEGMEN 7: KNOWLEDGE BASE MANAGEMENT
**🎬 Recording: `07_knowledge_base`**

### Narasi:

> *"Fitur terakhir yang kita bahas adalah Knowledge Base Management. Fitur ini khusus untuk Admin, digunakan untuk memperkaya wawasan chatbot."*

### Langkah-langkah:

1. **Navigasi ke menu Knowledge Base**

> *"Di halaman Knowledge Base, Anda dapat melihat daftar dokumen yang sudah diupload ke sistem."*

2. **Tunjukkan daftar dokumen yang ada**

3. **Demo Upload Dokumen Baru:**

> *"Untuk menambah dokumen baru, klik tombol Upload. Anda bisa mengunggah file PDF atau TXT berisi undang-undang, jurnal, fatwa, atau SOP halal perusahaan.*
>
> *Sistem secara otomatis akan:*
> 1. *Memecah dokumen menjadi potongan paragraf (chunking)*
> 2. *Memproses setiap chunk menjadi vektor embedding 384 dimensi*
> 3. *Menyimpan vektor ke database untuk pencarian semantik"*

   - Klik Upload → Pilih file PDF contoh
   - Tunggu proses selesai

> *"Setelah upload, dokumen langsung tersedia untuk chatbot. Ketika pengguna bertanya, chatbot akan mencari informasi paling relevan menggunakan cosine similarity search pada vektor-vektor ini."*

4. **Tunjukkan bahwa dokumen baru sudah muncul di daftar**

---

## 🎬 PENUTUP (Narasi saja, tanpa recording baru)

> *"Demikian tutorial lengkap penggunaan Sistem Informasi Manajemen Halal Supply Chain Terintegrasi.*
>
> *Ringkasan alur kerja sistem:*
> 1. *Pakar K1 mengisi Kuesioner 1 untuk menentukan bobot prioritas menggunakan Fuzzy AHP*
> 2. *Responden Lapangan mengisi Kuesioner 3 untuk melaporkan kondisi aktual di setiap titik kritis*
> 3. *Auditor K2 mengisi Kuesioner 2 untuk menilai tingkat risiko berdasarkan data K3*
> 4. *Sistem DSS mengkalkulasi skor risiko total*
> 5. *Chatbot AI membantu menjawab pertanyaan dan melacak status halal secara real-time*
>
> *Dengan sinergi ketiga pilar ini, diharapkan ekosistem halal dapat dipantau dan dievaluasi secara akurat, transparan, dan real-time dari hulu hingga hilir.*
>
> *Untuk pertanyaan teknis, silakan hubungi tim administrator IT.*
>
> *Terima kasih telah menonton tutorial ini."*

---

## ✅ TIPS RECORDING

1. **Resolusi**: Rekam di 1920×1080 (Full HD)
2. **Kecepatan mouse**: Gerakkan mouse dengan pelan dan jelas
3. **Pause**: Beri jeda 2-3 detik sebelum dan setelah setiap aksi penting
4. **Zoom**: Zoom in pada area penting (form input, tombol, hasil)
5. **Narasi**: Baca script dengan tempo sedang, tidak terlalu cepat
6. **Background**: Gunakan browser tanpa bookmark bar / tab lain
7. **Error handling**: Jika terjadi error, pause recording, fix, lalu lanjutkan
