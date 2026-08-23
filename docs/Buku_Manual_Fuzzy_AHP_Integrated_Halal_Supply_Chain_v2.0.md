# BUKU PANDUAN PENGGUNA (USER MANUAL)
**SISTEM INFORMASI MANAJEMEN HALAL SUPPLY CHAIN TERINTEGRASI (KMS & DSS)**
Versi: 2.0 — Lengkap

---

## DAFTAR ISI

1. [Pendahuluan](#1-pendahuluan)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Kuesioner 1 — Pembobotan Fuzzy AHP (Pakar)](#3-panduan-penggunaan-kuesioner-1--pembobotan-fuzzy-ahp-pakar)
4. [Kuesioner 2 — Pengukuran Tingkat Risiko (Auditor)](#4-panduan-penggunaan-kuesioner-2--pengukuran-tingkat-risiko-auditor)
5. [Kuesioner 3 — Form Kondisi Aktual (Responden Lapangan)](#5-panduan-penggunaan-kuesioner-3--form-kondisi-aktual-responden-lapangan)
6. [Kalkulasi Skor Risiko (DSS)](#6-kalkulasi-skor-risiko-dss)
7. [Halal AI Chatbot](#7-panduan-penggunaan-halal-ai-chatbot)
8. [Dashboard Admin](#8-panduan-penggunaan-dashboard-admin)
9. [Penutup](#9-penutup)

---

## 1. PENDAHULUAN

### 1.1 Tujuan Sistem
Sistem Informasi Manajemen Halal Supply Chain Terintegrasi adalah platform digital yang menggabungkan **Decision Support System (DSS)** berbasis Fuzzy AHP dan **Knowledge Management System (KMS)** yang ditenagai oleh kecerdasan buatan (Halal AI Chatbot). Sistem ini dirancang untuk memastikan ketertelusuran (*traceability*) halal, mengukur skor risiko pada titik-titik kritis (*Critical Points* / CP1–CP9), dan menyediakan asisten virtual cerdas terkait regulasi dan operasional halal.

### 1.2 Hak Akses Pengguna (Roles)
Sistem memiliki beberapa tingkatan akses pengguna:

| No | Role | Deskripsi | Akses Menu |
|----|------|-----------|------------|
| 1 | **ADMIN** | Kontrol penuh atas manajemen pengguna, master data, pengaturan Knowledge Base, dan memantau rekapitulasi data. | Semua menu |
| 2 | **PAKAR_K1** | Pakar yang mengisi Kuesioner 1 (Pembobotan Fuzzy AHP) untuk menentukan bobot prioritas kriteria risiko halal. | Kuesioner 1, Dashboard |
| 3 | **PAKAR_K2** | Auditor yang mengisi Kuesioner 2 (Pengukuran Tingkat Risiko) untuk menilai kepatuhan halal di setiap titik kritis. | Kuesioner 2, Dashboard |
| 4 | **CP1_FARM – CP9_RETAIL** | Responden lapangan (Staff Farm, Supervisor RPH, QC Transporter, dll.) yang mengisi Kuesioner 3 (Kondisi Aktual) sesuai titik kritis masing-masing dan mengunggah dokumen bukti. | Kuesioner 3 (sesuai CP), Dashboard |
| 5 | **General User** | Pengguna yang dapat memanfaatkan Halal AI Chatbot untuk melacak status halal dan menanyakan regulasi. | Chatbot |

### 1.3 Alur Kerja Umum Sistem

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          ALUR KERJA SISTEM                                      │
│                                                                                 │
│  ① PAKAR K1                  ② AUDITOR K2             ③ RESPONDEN LAPANGAN K3  │
│  ┌──────────────┐            ┌──────────────┐         ┌──────────────────────┐  │
│  │ Kuesioner 1  │            │ Kuesioner 2  │         │ Kuesioner 3          │  │
│  │ Pembobotan   │───┐        │ Pengukuran   │         │ Kondisi Aktual       │  │
│  │ Fuzzy AHP    │   │        │ Risiko (1-5) │         │ Ya/Tidak + Upload    │  │
│  └──────────────┘   │        └──────┬───────┘         │ + Validasi Supervisor│  │
│         │           │               │                 └──────────┬───────────┘  │
│         ▼           │               │                            │              │
│  ┌──────────────┐   │               │                            │              │
│  │ Bobot Global │   │               ▼                            ▼              │
│  │ & Lokal CP   │───┼──────→ ┌────────────────────────────────────┐             │
│  └──────────────┘   │        │      DSS ENGINE (Kalkulasi)        │             │
│                     │        │  Bobot × Nilai Aktual = Skor Risiko│             │
│                     │        └───────────────┬────────────────────┘             │
│                     │                        │                                  │
│                     │                        ▼                                  │
│                     │        ┌────────────────────────────────┐                 │
│                     │        │  HALAL BATCH — Risk Score      │                 │
│                     │        │  LOW / MODERATE / HIGH / CRIT  │                 │
│                     │        └───────────────┬────────────────┘                 │
│                     │                        │                                  │
│                     └────────────────────────┼──────────────────────────┐       │
│                                              │                          │       │
│                                              ▼                          ▼       │
│                              ┌─────────────────────┐    ┌──────────────────┐   │
│                              │   DASHBOARD ADMIN    │    │ HALAL AI CHATBOT │   │
│                              │   Rekap & Monitor    │    │ RAG + IndoBERT   │   │
│                              └─────────────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ARSITEKTUR SISTEM

Sistem ini terdiri dari tiga modul utama yang saling terintegrasi:

### 2.1 Modul Kuesioner Pembobotan (Fuzzy AHP)
Modul ini menerima masukan dari Pakar melalui Kuesioner Perbandingan Berpasangan. Pengisian dilakukan dalam tiga tahap bertingkat:
- **Kriteria Umum (KU Level)**: Perbandingan antar dimensi utama (Kualitas Produk, Keamanan & Kepatuhan Halal, Operasional & Logistik).
- **Level CP (CP Level)**: Perbandingan kepentingan antar 9 Titik Kritis (CP1 vs CP2, CP1 vs CP3, ...).
- **Sub-Kriteria (Sub-Level)**: Perbandingan antar sub-kriteria pada setiap CP (misalnya CP1: Asal-usul vs Kesehatan, Asal-usul vs Kebersihan Kandang, ...).

Sistem melakukan fuzzifikasi skala Saaty menjadi TFN (*Triangular Fuzzy Number*), menghitung *Fuzzy Synthetic Extent*, defuzzifikasi (*Center of Area*), dan mengecek *Consistency Ratio* (CR). Hasil akhirnya adalah **Bobot Global** dan **Bobot Lokal** untuk setiap titik kritis (CP1–CP9).

### 2.2 Modul Kuesioner Kondisi Aktual & Risiko (Traceability DSS)
Modul ini digunakan untuk melacak pergerakan produk dari hulu ke hilir (Farm → Slaughterhouse → Processing → Storage → Distribution → Retail). Terdapat dua kuesioner:
- **Kuesioner 2 (K2)**: Diisi oleh **Auditor/Pakar K2** untuk menilai *tingkat risiko* pada setiap indikator di setiap CP. Skala penilaian Likert 1–5 (Sangat Rendah hingga Sangat Tinggi).
- **Kuesioner 3 (K3)**: Diisi oleh **Responden Lapangan** untuk melaporkan *kondisi aktual* lapangan, termasuk ketersediaan bukti dokumen (Ya/Tidak), upload file pendukung, dan validasi Supervisor.

Hasil penilaian K2 dan K3 dikalkulasi dengan bobot dari K1 menghasilkan **Skor Risiko Total** dan **Klasifikasi Risiko**.

### 2.3 Modul Halal AI Chatbot (RAG & NLP)
Asisten cerdas yang menggunakan:
- **IndoBERT** (model `NurfauzanDaffa/indobert-intent`) untuk klasifikasi niat (*intent*) pengguna secara cerdas ke dalam 6 kategori.
- **Retrieval-Augmented Generation (RAG)** untuk menjawab pertanyaan berdasarkan dokumen hukum, jurnal, atau regulasi yang telah diunggah ke *Knowledge Base*.
- **LLM (GPT-4o-mini via OpenRouter)** untuk mengolah data mentah menjadi jawaban terstruktur dan mudah dipahami.

### 2.4 Entity Relationship Diagram (ERD) dan Struktur Tabel

Sistem ini didukung oleh database relasional **PostgreSQL** yang dikelola dengan **Prisma ORM**. Struktur database terbagi menjadi beberapa kelompok tabel utama:

#### A. Tabel Pengguna (User & Hak Akses)
| Tabel | Deskripsi |
|-------|-----------|
| `User` | Menyimpan data kredensial, *role* (ADMIN, PAKAR_K1, PAKAR_K2, CP1_FARM s.d. CP9_RETAIL), dan informasi asal instansi. |
| `HalalCertificate` | Menyimpan data sertifikat halal per pengguna (nomor, tanggal terbit, masa berlaku, status validitas). |

#### B. Tabel Traceability (Ketertelusuran)
| Tabel | Deskripsi |
|-------|-----------|
| `HalalBatch` | **Tabel pusat (jantung data)** yang mencatat pergerakan satu rombongan ternak/produk. Menyimpan `totalRiskScore` dan `riskLevel`. Terhubung ke `Cattle`, `Slaughterhouse`, dan semua CP Record. |
| `Cattle` | Master data sapi (earTag, breed, birthDate), terhubung ke `Farm`. |
| `Farm` | Data Peternakan (nama, lokasi, alamat). |
| `Slaughterhouse` | Data Rumah Potong Hewan (nama, lokasi). |
| `Transporter` | Data armada transportasi (nama, nomor kendaraan, jenis kendaraan). |
| `ProcessingPlant` | Data pabrik pengolahan (nama, lokasi, tipe produksi). |
| `Warehouse` | Data gudang/cold storage (nama, lokasi, tipe penyimpanan). |
| `Distributor` | Data distributor (nama, lokasi, area cakupan). |
| `RetailOutlet` | Data outlet retail (nama, lokasi, tipe outlet). |

#### C. Tabel AHP dan Pengukuran Risiko (DSS)
| Tabel | Deskripsi |
|-------|-----------|
| `CriticalPoint` | Master data Titik Kritis (CP1–CP9), lengkap dengan `globalWeight` (Bobot Global AHP), `localRiskScore`, `globalWeightedRisk`, dan `riskLevel`. |
| `CriteriaWeight` | Rincian sub-kriteria beserta bobot lokal Fuzzy AHP (kode, nama, bobot, skala TFN). |
| `CriticalPointRecord` | **Tabel transaksional krusial**. Mencatat hasil perkalian nilai aktual (dari K3) dengan bobot (dari K1), menghasilkan `riskValue` dan `weightedRisk` per titik kritis per Batch. |
| `PairwiseComparison` | Matriks perbandingan berpasangan dinamis (TFN: low, mid, up) untuk setiap level matriks. |

#### D. Tabel CP Detail Records (CP1–CP9)
Setiap CP memiliki tabel detail yang menyimpan skor risiko per sub-kriteria:

| Tabel | CP | Jumlah Sub-Kriteria | Contoh Field |
|-------|----|----|----|
| `CP1FarmRecord` | CP1 Farm/Kandang | 7 | asalUsulRisk, kesehatanRisk, kepatuhanPakanRisk, ... |
| `CP2FeedRecord` | CP2 Pakan & Kesehatan | 5 | halalFeedStatusRisk, supplierRisk, feedStorageRisk, ... |
| `CP3TransportRecord` | CP3 Transportasi | 5 | kelayakanRisk, kebersihanRisk, animalWelfareRisk, ... |
| `CP4SlaughterRecord` | CP4 RPH/Penyembelihan | 10 | sertifikatHalalRisk, kompetensiSembelihRisk, prosesSyariahRisk, ... |
| `CP5PostSlaughterRecord` | CP5 Post-Slaughter | 5 | handlingRisk, sanitasiRisk, batchIdRisk, ... |
| `CP6ProcessingRecord` | CP6 Pengolahan | 7 | halalIngredientsRisk, equipmentRisk, dedicatedLineRisk, ... |
| `CP7StorageRecord` | CP7 Cold Storage | 7 | temperatureRisk, segregasiRisk, hygieneRisk, ... |
| `CP8DistributionRecord` | CP8 Distribusi | 7 | dedicatedTransRisk, vehicleSanitasiRisk, temperatureRisk, ... |
| `CP9RetailRecord` | CP9 Retail | 7 | labelHalalRisk, displayRisk, storageTemRisk, ... |

#### E. Tabel Data Kuesioner (Raw Response) & Chatbot
| Tabel | Deskripsi |
|-------|-----------|
| `QuestionnaireResponse` | Menyimpan data mentah *form-submission* (jawaban JSON, bukti dukung, info responden, *timestamp*). Digunakan untuk Kuesioner 1 (`pembobotan`), Kuesioner 2 (`risiko`), dan Kuesioner 3 (`aktual`). |
| `ChatbotLog` | Menyimpan log query chatbot (query, intent, response, sourceType). |
| `IncidentLog` | Menyimpan log insiden (tipe, severity, corrective action, status). |

#### F. Tabel RAG / Vector Storage
| Tabel | Deskripsi |
|-------|-----------|
| `HalalDocument` | Menyimpan dokumen Knowledge Base (title, content, embedding vektor 384-dimensi, metadata). |
| `oai` | Menyimpan chunk dokumen dan embedding vektor untuk pencarian semantik RAG. |

---

## 3. PANDUAN PENGGUNAAN: KUESIONER 1 — PEMBOBOTAN FUZZY AHP (PAKAR)

Tahapan ini wajib dilakukan pada awal penyusunan sistem, atau ketika ada pembaruan prioritas kriteria halal. Kuesioner ini menggunakan metode **Fuzzy Analytic Hierarchy Process (Fuzzy AHP)** dengan skala Saaty.

### 3.1 Mengakses Kuesioner Pembobotan
1. Buka halaman utama aplikasi dan pilih **Login**.
2. Masukkan kredensial (Email & Password) dengan akun yang memiliki role **PAKAR_K1**.
3. Di **Dashboard**, pilih menu **Kuesioner Pembobotan (Kuesioner 1)**.

### 3.2 Pengisian Profil / Latar Belakang Responden (Pakar)
Sebelum memulai pengisian, lengkapi data diri pakar pada form **Latar Belakang Responden**:

| No | Field | Keterangan |
|----|-------|------------|
| 1 | Nama Lengkap | Nama lengkap pakar |
| 2 | Jenis Kelamin | Laki-laki / Perempuan |
| 3 | Jenis Keahlian | Dropdown pilihan: Ahli Halal / MUI, Ahli Peternakan / Veteriner, Ahli Logistik / Supply Chain, Auditor / Sertifikasi, Akademisi / Peneliti, Praktisi Industri Daging |
| 4 | Posisi / Jabatan | Jabatan di instansi |
| 5 | Nama Instansi | Asal instansi/lembaga |
| 6 | Pengalaman (tahun) | Lama pengalaman di bidang terkait |
| 7 | Email | Alamat email pakar |
| 8 | Tanggal Pengisian | Otomatis terisi tanggal hari ini, dapat diubah |

### 3.3 Tahap Pengisian Perbandingan Berpasangan

Pengisian Kuesioner 1 dilakukan dalam **3 tahap bertingkat** menggunakan tab navigasi:

#### Tahap A: Kriteria Umum (KU Level)
Membandingkan dimensi-dimensi utama satu sama lain:
- **Kualitas Produk**
- **Keamanan & Kepatuhan Halal**
- **Operasional & Logistik**

Pakar diminta menggeser slider untuk setiap pasangan. Contoh: *"Kualitas Produk vs Keamanan & Kepatuhan Halal"* — geser ke kanan jika Keamanan dianggap lebih penting.

#### Tahap B: Level CP (CP Level) — Perbandingan Antar Titik Kritis
Membandingkan kepentingan relatif antar 9 Critical Points (CP1–CP9). Total pasangan: `C(9,2) = 36 pasangan`.

Contoh pasangan:
- CP1 (Farm/Kandang) vs CP2 (Pakan & Kesehatan)
- CP1 (Farm/Kandang) vs CP4 (RPH/Penyembelihan)
- CP4 (RPH/Penyembelihan) vs CP7 (Cold Storage)
- ... dst.

#### Tahap C: Sub-Kriteria Per CP — Perbandingan Antar Sub-Kriteria
Untuk setiap CP, membandingkan sub-kriteria di dalamnya. Contoh untuk CP1 (Farm):
- F1 (Asal-usul sapi) vs F2 (Status kesehatan sapi)
- F1 (Asal-usul sapi) vs F3 (Kepatuhan pakan)
- ... dst.

Contoh untuk CP4 (RPH/Penyembelihan) — CP terbanyak sub-kriterianya (10 sub-kriteria, 45 pasangan):
- R1 (Sertifikat halal RPH) vs R2 (Kompetensi juru sembelih)
- R3 (Proses penyembelihan syariah) vs R5 (Sanitasi alat)
- ... dst.

### 3.4 Cara Membaca Slider Skala Saaty

Slider memiliki rentang **-8 sampai +8**, yang dipetakan ke Skala Saaty 1–9:

| Posisi Slider | Skala Saaty | Interpretasi |
|---------------|-------------|-------------|
| 0 | 1 | Sama Penting |
| -1 atau +1 | 2 | Nilai Antara |
| -2 atau +2 | 3 | Sedikit Lebih Penting |
| -3 atau +3 | 4 | Nilai Antara |
| -4 atau +4 | 5 | Lebih Penting |
| -5 atau +5 | 6 | Nilai Antara |
| -6 atau +6 | 7 | Sangat Lebih Penting |
| -7 atau +7 | 8 | Nilai Antara |
| -8 atau +8 | 9 | Mutlak Lebih Penting |

- **Geser ke KIRI** (nilai negatif) → Kriteria di sisi **kiri** lebih penting.
- **Geser ke KANAN** (nilai positif) → Kriteria di sisi **kanan** lebih penting.
- **Posisi tengah (0)** → Kedua kriteria **sama penting**.

### 3.5 Proses Submit dan Auto-Lanjut
1. Setelah seluruh perbandingan pada satu tahap diisi, klik tombol **Simpan Pembobotan**.
2. Muncul dialog konfirmasi **"Simpan & Lanjutkan?"** — pilih **Ya, Simpan** untuk menyimpan.
3. Sistem akan **otomatis melanjutkan ke tahap berikutnya**:
   - KU Level → CP Level → CP1 → CP2 → CP3 → ... → CP9.
4. Setelah seluruh tahap selesai (termasuk CP9), muncul halaman **Terima Kasih** dengan opsi **Mulai Ulang** untuk responden baru.

### 3.6 Hasil Kalkulasi Fuzzy AHP

Setelah data tersimpan, sistem DSS secara otomatis melakukan proses berikut:

1. **Fuzzifikasi**: Mengkonversi skala Saaty (1–9) menjadi Triangular Fuzzy Number (TFN) `(l, m, u)`.
2. **Matriks Fuzzy Pairwise Comparison**: Membangun matriks perbandingan berpasangan fuzzy.
3. **Fuzzy Synthetic Extent**: Menghitung *fuzzy synthetic extent* `Si` untuk setiap kriteria.
4. **Degree of Possibility**: Menghitung derajat kemungkinan `V(Si ≥ Sj)` untuk perbandingan antar kriteria.
5. **Normalisasi Bobot**: Menghasilkan bobot prioritas ternormalisasi `W = (w1, w2, ..., wn)`.
6. **Consistency Ratio (CR)**: Mengecek konsistensi matriks.
   - Jika **CR < 0.10** → Input dianggap **Konsisten**. Bobot Global dan Lokal diperbarui di database.
   - Jika **CR ≥ 0.10** → Sistem memberi peringatan **Tidak Konsisten**, Pakar diminta meninjau ulang.
7. **Update Database**: Bobot Global (`globalWeight`) pada tabel `CriticalPoint` dan bobot lokal (`weight`) pada tabel `CriteriaWeight` diperbarui.

### 3.7 Daftar Sub-Kriteria Per CP (Referensi)

| CP | Nama CP | Kode Sub-Kriteria | Jumlah |
|----|---------|-------------------|--------|
| CP1 | Farm / Kandang Sapi | F1–F7 (Asal-usul, Kesehatan, Pakan, Obat/Vaksin, Dokumentasi, Kebersihan, Kesiapan Sembelih) | 7 |
| CP2 | Pakan & Kesehatan Hewan | FD1–FD5 (Status Halal Pakan, Supplier, Penyimpanan, Obat, Pengawasan Veteriner) | 5 |
| CP3 | Transportasi Hewan ke RPH | T1–T5 (Kelayakan Kendaraan, Kebersihan, Animal Welfare, Traceability, Dokumentasi) | 5 |
| CP4 | RPH / Penyembelihan | R1–R10 (Sertifikat, Kompetensi Juru Sembelih, Proses Syariah, Pemeriksaan, Sanitasi, Segregasi, Dokumentasi, Pengawasan, Audit, Traceability) | 10 |
| CP5 | Post-Slaughter Handling | PS1–PS5 (Handling Carcass, Sanitasi, Batch ID, Segregasi, Dokumentasi) | 5 |
| CP6 | Pengolahan | P1–P7 (Halal Ingredients, Equipment, Dedicated Line, Batch Control, Packaging, Operator, Formulasi) | 7 |
| CP7 | Cold Storage / Gudang | CS1–CS7 (Temperature, Segregasi, Hygiene, Traceability, FIFO/FEFO, Dokumentasi, Incident) | 7 |
| CP8 | Distribusi / Logistik | D1–D7 (Dedicated Transport, Vehicle Sanitation, Temperature, Route, Loading, Dokumentasi, Kontaminasi) | 7 |
| CP9 | Retail / Pasar | RT1–RT7 (Label Halal, Display, Storage Temperature, Expiry, Consumer Info, Supplier Trace, Complaint) | 7 |

---

## 4. PANDUAN PENGGUNAAN: KUESIONER 2 — PENGUKURAN TINGKAT RISIKO (AUDITOR)

Kuesioner ini diisi oleh **Auditor / Tim Penilai** untuk menilai tingkat risiko dari setiap titik kritis berdasarkan observasi kelengkapan operasional. Kuesioner 2 bersifat **cross-referencing** terhadap data K3 yang telah diinput oleh responden lapangan.

### 4.1 Mengakses Kuesioner 2
1. Login menggunakan akun dengan role **PAKAR_K2** atau **ADMIN**.
2. Di **Dashboard**, pilih menu **Kuesioner Pengukuran Risiko (Kuesioner 2)**.
3. Halaman menampilkan judul: **"Kuesioner 2 — Pengukuran Tingkat Risiko"** dengan subjudul *"Pengukuran Tingkat Risiko Kepatuhan Halal Integrated Supply Chain pada Daging Sapi"*.

### 4.2 Petunjuk Pengisian & Rubrik Risiko
Di bagian atas halaman terdapat:
- **Banner Petunjuk Pengisian**: Menjelaskan bahwa kuesioner diisi oleh Auditor/Tim Penilai.
- **Tombol "Download Rubrik"**: Mengunduh file PDF rubrik penilaian tingkat risiko halal sebagai pedoman pemberian skor.
- **Tabel Referensi Skala Risiko**: Menampilkan 5 level skala beserta interpretasinya.

#### Skala Tingkat Risiko Kepatuhan Halal (Likert 1–5)

| Skala | Label | Interpretasi |
|-------|-------|-------------|
| **1** | Sangat Rendah | Risiko pelanggaran halal hampir tidak ada. Semua dokumen dan prosedur sangat lengkap dan terdokumentasi dengan baik. |
| **2** | Rendah | Risiko kecil dan masih mudah dikendalikan. Sebagian besar dokumen tersedia dengan minor kekurangan. |
| **3** | Sedang | Risiko mulai memerlukan pengawasan. Beberapa dokumen atau prosedur belum lengkap. |
| **4** | Tinggi | Risiko signifikan dan perlu tindakan segera. Banyak kekurangan dalam kepatuhan halal. |
| **5** | Sangat Tinggi | Risiko kritis ketidakpatuhan serius. Hampir tidak ada dokumentasi atau prosedur yang memadai. |

Setiap sub-kriteria memiliki **deskripsi skala spesifik** yang muncul sebagai *toast notification* saat auditor memilih skor, menjelaskan secara detail apa arti skor tersebut pada konteks sub-kriteria yang bersangkutan.

### 4.3 Memilih Tab CP (Titik Kritis)
- Di bawah tabel skala, terdapat **tab navigasi CP1–CP9** berupa tombol horizontal yang dapat di-scroll.
- Klik tab CP yang ingin dinilai (misal: CP1, CP4, CP7).
- Tab berwarna **hijau dengan ikon centang** menandakan CP tersebut sudah terisi lengkap.

### 4.4 Memilih Batch / Data Aktual K3

Sebelum melakukan penilaian, Auditor **wajib** memilih data kondisi aktual (K3) yang akan dinilai:

1. Pada bagian **"Pilih Batch / Kode Ternak (Data Kondisi Aktual K3) yang Akan Dinilai"**, pilih dropdown.
2. Dropdown menampilkan daftar respons K3 yang sudah disubmit, berformat: `[Kode Ternak] Tanggal - Nama Responden (Organisasi)`.
3. Jika data K3 sudah pernah dinilai di K2, muncul tanda **✅ (Sudah Diisi)**.
4. Setelah memilih Batch, bagian **"Data Latar Belakang Batch K3"** akan menampilkan informasi latar belakang responden K3 secara read-only.
5. **Peringatan**: Jika belum memilih Batch, tombol submit akan dinonaktifkan dan muncul pesan: *"Harap pilih data aktual terlebih dahulu sebelum melakukan penilaian."*

### 4.5 Pengisian Identitas Auditor
Lengkapi bagian **Identitas Auditor / Penilai**:

| No | Field | Keterangan |
|----|-------|------------|
| 1 | Tanggal Audit | Otomatis terisi hari ini, dapat diubah |
| 2 | Nama Auditor | Nama lengkap auditor |
| 3 | Jenis Kelamin | Laki-laki / Perempuan |
| 4 | Posisi / Jabatan | Jabatan di instansi |
| 5 | Nama Instansi | Nama instansi / lembaga |
| 6 | No Sertifikat Auditor | Nomor sertifikat (jika ada) |

### 4.6 Penilaian Indikator Per Sub-Kriteria

Setiap CP memiliki sub-kriteria yang dapat di-expand (buka/tutup dengan klik). Di dalam setiap sub-kriteria terdapat tabel indikator dengan kolom:

| Kolom | Deskripsi |
|-------|-----------|
| **No** | Nomor urut indikator |
| **Pernyataan** | Deskripsi indikator yang harus dinilai |
| **Bukti Pendukung** | Jenis dokumen pendukung yang diharapkan tersedia |
| **Dokumen Aktual** | Tautan ke dokumen yang di-upload oleh responden K3 (jika ada). Klik untuk melihat/download. |
| **Kesesuaian** | Tombol **"Sesuai"** / **"Tidak"** — Auditor menilai apakah dokumen aktual sesuai dengan indikator |
| **Tingkat Ketersediaan / Risiko** | **5 tombol skala (1–5)** — Auditor memberikan skor risiko. Skor aktif ditandai dengan warna berbeda. |

**Cara Penilaian:**
1. Buka sub-kriteria yang ingin dinilai (klik pada header sub-kriteria).
2. Untuk setiap indikator:
   - Periksa kolom **Dokumen Aktual** — klik file untuk melihat bukti yang di-upload K3.
   - Klik **Sesuai** atau **Tidak** pada kolom Kesesuaian.
   - Pilih skor **1–5** berdasarkan tingkat risiko yang diamati.
3. Di bawah setiap sub-kriteria, terdapat kolom **"Catatan Auditor"** untuk menuliskan observasi tambahan.
4. Progress bar dan counter `x/total` di atas menunjukkan progres pengisian.

### 4.7 Submit Penilaian K2
1. Setelah seluruh indikator CP dinilai, klik tombol **"Simpan Penilaian Risiko"**.
2. Muncul dialog konfirmasi **"Simpan & Lanjutkan?"** — klik **"Ya, Simpan"**.
3. Data disimpan ke tabel `QuestionnaireResponse` dengan `questionnaireType = "risiko"`.
4. Sistem **otomatis melanjutkan ke CP berikutnya** (CP1 → CP2 → ... → CP9).
5. Muncul notifikasi hijau **"Data berhasil disimpan"**.

### 4.8 Data Yang Tersimpan (K2)
Setiap submit K2 menyimpan data berikut ke database:

```json
{
  "questionnaireType": "risiko",
  "cpId": "CP1",
  "respondentName": "Nama Auditor",
  "respondentRole": "Posisi",
  "respondentOrg": "Nama Instansi",
  "respondentInfo": { "tanggalAudit": "...", "nama": "...", "noSertifikat": "...", ... },
  "answers": {
    "riskRatings": { "CP1.1_1": 2, "CP1.1_2": 3, ... },
    "evidenceCheck": { "CP1.1_1": "sesuai", "CP1.1_2": "tidak_sesuai", ... }
  },
  "notes": { "CP1.1": "Catatan auditor...", "aktualResponseId": "uuid-batch-k3" }
}
```

---

## 5. PANDUAN PENGGUNAAN: KUESIONER 3 — FORM KONDISI AKTUAL (RESPONDEN LAPANGAN)

Kuesioner ini diisi oleh pelaku langsung di lapangan (Staff, Supervisor, QC, Penyelia Halal) pada setiap Titik Kritis (CP1–CP9) sesuai role yang dimiliki.

### 5.1 Mengakses Kuesioner 3
1. Login menggunakan akun **Responden Lapangan** (role: CP1_FARM, CP2_FEED, CP3_TRANSPORT, CP4_SLAUGHTER, dst.).
2. Di **Dashboard**, pilih menu **Kuesioner Aktual (Kuesioner 3)**.
3. Halaman menampilkan judul: **"Kuesioner 3 — Kondisi Aktual"** dengan subjudul *"Form Pengisian Kondisi Aktual Kepatuhan Halal — Diisi oleh masing-masing CP"*.

**Catatan Penting**: Jika role pengguna adalah CP-specific (misal: `CP1_FARM`), maka hanya tab CP1 yang tersedia. Jika role adalah `ADMIN`, semua tab CP1–CP9 tersedia.

### 5.2 Petunjuk Pengisian
Banner informasi di atas menjelaskan:
> *"Centang ketersediaan bukti dukung (Ya/Tidak), upload bukti pendukung, dan berikan verifikasi supervisor (Sesuai/Tidak Sesuai) berdasarkan keberadaan aktual dari masing-masing indikator."*

### 5.3 Memilih Tab CP
- Tab navigasi CP1–CP9 tersedia (atau hanya CP tertentu sesuai role).
- Klik tab CP yang ingin diisi.

### 5.4 Pengisian Latar Belakang

Bagian **"Latar Belakang Pengisi Formulir"** berisi field yang berbeda-beda per CP. Contoh:

**CP1 (Farm/Kandang Sapi):**
| Field | Keterangan |
|-------|------------|
| Batch / Kode Ternak | **Dropdown** otomatis dari database master data — memilih earTag sapi. Jika sudah diisi sebelumnya, muncul **✅ (Sudah Diisi)**. |
| Nama PIC / Petugas | Nama penanggung jawab |
| Posisi / Jabatan | Jabatan di peternakan |
| Nama Farm / Perusahaan | Nama peternakan |
| Shift | Dropdown: Pagi / Siang / Malam |
| Tanggal Pengisian | Otomatis hari ini |

**CP4 (RPH/Penyembelihan):**
| Field | Keterangan |
|-------|------------|
| Batch / Kode Ternak | Dropdown dari database |
| Nama Juru Sembelih Halal | Nama juru sembelih |
| No. Sertifikat JSH | Nomor sertifikat |
| Nama RPH | Nama Rumah Potong Hewan |
| Shift | Pagi / Siang / Malam |
| Tanggal Penyembelihan | Tanggal pelaksanaan |

### 5.5 Pengisian Indikator Per Sub-Kriteria

Setiap sub-kriteria dapat di-expand. Di dalam setiap indikator terdapat kolom:

| Kolom | Deskripsi |
|-------|-----------|
| **No** | Nomor urut indikator |
| **Pernyataan** | Deskripsi aspek yang harus diperiksa (contoh: "Surat asal ternak dari peternakan yang terdaftar tersedia") |
| **Bukti Pendukung** | Jenis dokumen yang diharapkan (contoh: "Surat asal ternak, dokumen pembelian") |
| **Tersedia?** | Tombol **"Ya"** / **"Tidak"** — Apakah bukti dokumen tersedia secara fisik? |
| **Upload** | Tombol **"Upload"** — Mengunggah file bukti pendukung (PDF, TXT, Gambar). Setelah upload, nama file ditampilkan dengan tombol hapus (×). |
| **Kesesuaian** | Tombol **"Sesuai"** / **"Tidak"** — Verifikasi kesesuaian dokumen dengan standar yang berlaku. |

**Cara Pengisian:**
1. Buka sub-kriteria (klik header untuk expand).
2. Untuk setiap indikator:
   - Klik **Ya** jika bukti dukung tersedia, atau **Tidak** jika tidak ada.
   - Klik **Upload** untuk mengunggah file bukti (file diupload ke Google Drive melalui API).
   - Klik **Sesuai** jika dokumen aktual sesuai standar, atau **Tidak** jika ada ketidaksesuaian.
3. Counter `x/total` dan progress bar menunjukkan progres pengisian.

### 5.6 Validasi Supervisor

Bagian penting di akhir formulir K3 — wajib diisi oleh Supervisor:

| No | Field | Keterangan |
|----|-------|------------|
| 1 | **Nama Supervisor** | Nama supervisor yang memvalidasi |
| 2 | **Hasil Verifikasi** | Dropdown: **Sesuai** / **Tidak Sesuai** |
| 3 | **Tingkat Risiko Keseluruhan** | 5 tombol skala (1–5): Rendah–Rendah–Sedang–Tinggi–Tinggi. Saat dipilih, muncul *toast notification* dengan penjelasan level risiko. |
| 4 | **Tanggal Verifikasi** | Otomatis hari ini, dapat diubah |
| 5 | **Tindakan Korektif** | Textarea untuk menuliskan langkah perbaikan yang perlu dilakukan (jika ada ketidaksesuaian) |

**Statistik Kepatuhan:**
Sistem otomatis menghitung persentase kepatuhan berdasarkan jawaban kesesuaian:
- `% Kepatuhan = (Jumlah Sesuai / Total Dijawab) × 100%`
- Ditampilkan dengan warna: Hijau (≥80%), Kuning (50–79%), Merah (<50%).

### 5.7 Submit Kondisi Aktual K3
1. Setelah seluruh indikator diisi dan Supervisor memvalidasi, klik tombol **"Simpan Kondisi Aktual"**.
2. Muncul dialog konfirmasi **"Simpan & Lanjutkan?"** — pastikan supervisor telah memvalidasi.
3. Klik **"Ya, Simpan"** untuk menyimpan data.
4. Proses upload file ke server/cloud dilakukan secara otomatis.
5. Data disimpan ke tabel `QuestionnaireResponse` dengan `questionnaireType = "aktual"`.
6. Sistem **otomatis melanjutkan ke CP berikutnya** (jika tersedia).
7. Muncul notifikasi hijau **"Data berhasil disimpan"**.

### 5.8 Data Yang Tersimpan (K3)
Setiap submit K3 menyimpan data berikut:

```json
{
  "questionnaireType": "aktual",
  "cpId": "CP1",
  "respondentName": "Nama PIC",
  "respondentRole": "Posisi",
  "respondentOrg": "Nama Farm",
  "respondentInfo": { "CP1_batch": "TAG-A001", "CP1_namaFarm": "...", "CP1_shift": "Pagi", ... },
  "answers": {
    "risks": { "CP1.1_1": "sesuai", "CP1.1_2": "tidak_sesuai", ... },
    "evidence": { "CP1.1_1": true, "CP1.1_2": false, ... }
  },
  "notes": {
    "namaSupervisor": "...", "hasilVerifikasi": "sesuai",
    "tingkatRisiko": "2", "tindakanKorektif": "...",
    "tanggalVerifikasi": "2026-08-12",
    "complianceStats": "85% Kepatuhan (17 Sesuai)"
  },
  "files": [
    { "key": "CP1.1_1", "filename": "surat_asal_ternak.pdf", "url": "https://drive.google.com/..." }
  ]
}
```

---

## 6. KALKULASI SKOR RISIKO (DSS)

### 6.1 Alur Kalkulasi Otomatis
Setelah data K1, K2, dan K3 tersimpan di database, **DSS Engine** secara otomatis mengalkulasi:

1. **Ambil Bobot** dari K1:
   - `globalWeight` (Bobot Global) per CP dari tabel `CriticalPoint`.
   - `weight` (Bobot Lokal sub-kriteria) dari tabel `CriteriaWeight`.

2. **Ambil Nilai Aktual** dari K3:
   - Konversi jawaban kesesuaian ke nilai numerik.
   - Ambil tingkat risiko dari penilaian supervisor.

3. **Hitung Skor Risiko** per CP:
   - `riskValue = Σ(bobot_subkriteria × nilai_aktual)` per CP.
   - `weightedRisk = globalWeight × riskValue` per CP.

4. **Hitung Skor Risiko Total Batch**:
   - `totalRiskScore = Σ(weightedRisk)` dari CP1–CP9.

5. **Klasifikasi Risiko**:

| Rentang Skor | Klasifikasi | Warna |
|-------------|-------------|-------|
| < 0.26 | **Low** (Rendah) | 🟢 Hijau |
| 0.26 – 0.50 | **Moderate** (Sedang) | 🟡 Kuning |
| 0.51 – 0.75 | **High** (Tinggi) | 🟠 Oranye |
| ≥ 0.76 | **Critical** (Kritis) | 🔴 Merah |

6. **Update Database**:
   - `CriticalPointRecord.riskValue` dan `CriticalPointRecord.weightedRisk` diperbarui.
   - `HalalBatch.totalRiskScore` dan `HalalBatch.riskLevel` diperbarui.
   - Tabel CP detail (CP1FarmRecord, CP4SlaughterRecord, dst.) diperbarui dengan skor per sub-kriteria.

---

## 7. PANDUAN PENGGUNAAN: HALAL AI CHATBOT

Fitur asisten virtual dirancang agar interaktif dan terhubung dengan data Traceability serta Knowledge Base. Chatbot ini dibangun dengan arsitektur **IndoBERT** untuk klasifikasi niat (*intent*) pengguna secara cerdas yang dipadukan dengan **Large Language Model (LLM)**.

### 7.1 Mengakses Chatbot
1. Chatbot dapat diakses melalui menu **Halal AI Chatbot** di navbar utama.
2. URL langsung: `/chat`.
3. Anda bisa berinteraksi menggunakan **Bahasa Indonesia** sehari-hari.
4. Terdapat **tombol saran cepat** (*Suggested Actions*) di halaman awal:
   - 🔍 **Cek Risiko Halal** — Menampilkan analisis risiko semua CP.
   - 🐄 **Lacak Batch** — Melacak batch sapi berdasarkan eartag.
   - 📋 **Panduan Sembelih** — Menjelaskan prosedur penyembelihan halal.
   - 📊 **Bobot CP** — Menampilkan bobot Fuzzy AHP setiap CP.

### 7.2 Fitur Antarmuka Chat
- **Sidebar Riwayat Chat**: Panel di sisi kiri yang menampilkan riwayat sesi percakapan. Setiap sesi dapat dipilih, dihapus, atau dibuat baru.
- **Auto-save Session**: Setiap percakapan otomatis tersimpan di localStorage browser dan dapat dilanjutkan.
- **Markdown Rendering**: Jawaban chatbot ditampilkan dengan format Markdown (tabel, bullet points, heading, code blocks).
- **QR Code Deep Link**: Mendukung pemindaian QR Code dari produk. URL format: `/chat?trace=TAG-A001` akan otomatis memicu pelacakan batch.
- **Streaming Response**: Jawaban chatbot ditampilkan secara *real-time* (streaming), bukan menunggu seluruh jawaban selesai.

### 7.3 Alur Kerja (Flow) Chatbot secara Detail

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    ALUR KERJA CHATBOT                                    │
│                                                                          │
│  ① INPUT PENGGUNA                                                        │
│  "Berapa skor risiko CP1?"  ──────────────────────────┐                 │
│                                                        │                 │
│  ② INTENT CLASSIFICATION (IndoBERT)                    ▼                 │
│  ┌─────────────────────────────────────────────────────────┐             │
│  │  Model: NurfauzanDaffa/indobert-intent                  │             │
│  │  6 Kategori Intent:                                     │             │
│  │  • knowledge_query  → Tool: search_knowledge_base       │             │
│  │  • risk_check       → Tool: check_halal_risk            │             │
│  │  • batch_trace      → Tool: trace_halal_batch           │             │
│  │  • operational_data → Tool: get_operational_data        │             │
│  │  • greeting         → Response langsung                 │             │
│  │  • out_of_scope     → Penolakan sopan                   │             │
│  └──────────────────┬──────────────────────────────────────┘             │
│                     │                                                    │
│  ③ CONFIDENCE CHECK │                                                    │
│          ┌──────────┴──────────┐                                        │
│          │ Confidence ≥ 0.7?   │                                        │
│          └──────┬──────┬───────┘                                        │
│            YA   │      │  TIDAK                                         │
│            ▼    │      ▼                                                │
│   Panggil tool  │   LLM Function                                       │
│   spesifik      │   Calling (Fallback)                                  │
│   (1 tool)      │   (Semua 4 tools)                                     │
│          └──────┴──────┘                                                │
│                 │                                                        │
│  ④ RETRIEVAL    ▼                                                        │
│  ┌──────────────────────────────────────────┐                           │
│  │ search_knowledge_base → RAG Vector Search│                           │
│  │ check_halal_risk      → DB CriticalPoint │                           │
│  │ trace_halal_batch     → DB HalalBatch    │                           │
│  │ get_operational_data  → DB Master Data   │                           │
│  └──────────────────┬───────────────────────┘                           │
│                     │                                                    │
│  ⑤ GENERASI JAWABAN ▼                                                    │
│  ┌──────────────────────────────────────────┐                           │
│  │ LLM Engine (GPT-4o-mini via OpenRouter)  │                           │
│  │ Data mentah → Jawaban terstruktur         │                           │
│  │ Streaming ke layar pengguna               │                           │
│  └──────────────────────────────────────────┘                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Detail 6 Kategori Intent IndoBERT

| Intent | Trigger Contoh | Tool yang Dipanggil | Deskripsi |
|--------|---------------|-------------------|-----------|
| `knowledge_query` | "Apa syarat pemotongan halal menurut fatwa MUI?", "Jelaskan UU Jaminan Produk Halal" | `search_knowledge_base` | Mencari teori, regulasi, SOP, fatwa di Knowledge Base menggunakan vector similarity search (embedding 384-dimensi). |
| `risk_check` | "Berapa skor risiko CP1?", "Aman ga daging ini?", "Status risiko semua CP" | `check_halal_risk` | Mengambil bobot Fuzzy AHP, risk score, dan level risiko dari database CriticalPoint. Mendukung query per CP atau per Batch. |
| `batch_trace` | "Lacak batch TAG-A003", "Dimana eartag 998 dipotong?", "Riwayat sapi TAG-B004" | `trace_halal_batch` | Melacak jejak lengkap batch: asal ternak, farm, RPH, transporter, processing, storage, distributor, retail. Menampilkan skor risiko per CP beserta sub-kriteria dan rekomendasi AUTO-RAG. |
| `operational_data` | "Daftar RPH di Jawa Timur", "Siapa juru sembelih aktif bulan ini?" | `get_operational_data` | Mengambil daftar entitas dari database (Farm, RPH, Transporter, Batch Sapi, Personel dari QuestionnaireResponse). |
| `greeting` | "Halo", "Selamat pagi", "Terima kasih" | *(Respons langsung)* | Chatbot menjawab sapaan tanpa memanggil tool. |
| `out_of_scope` | "Siapa presiden?", "Harga saham hari ini" | *(Penolakan sopan)* | Chatbot menolak menjawab dengan sopan, mengarahkan kembali ke domain halal. |

### 7.5 Detail 4 Tools Chatbot

#### Tool 1: `search_knowledge_base` (RAG)
- **Fungsi**: Mencari dokumen, teori, aturan, fatwa, SOP, hukum, regulasi BPJPH di Knowledge Base.
- **Mekanisme**: Vector similarity search menggunakan embedding model `all-MiniLM-L6-v2` (384-dimensi). Mengambil 8 chunk terdekat.
- **Format Output**: Setiap chunk ditampilkan dengan label `[Sumber Akademik/Regulasi: Judul Dokumen] [Kategori: CP]`.
- **Aturan Sitasi**: Chatbot wajib menyebutkan referensi lengkap (nama jurnal/buku/UU, nomor, tahun, penulis).

#### Tool 2: `check_halal_risk` (DSS)
- **Fungsi**: Mengambil hasil matriks klasifikasi risiko Fuzzy AHP terkini.
- **Parameter**: `batchId` (opsional) — jika diisi, menampilkan risiko per batch; jika kosong, menampilkan ringkasan semua CP.
- **Output**: Bobot Global, Risk Score Lokal, Status (Low/Moderate/High/Critical), dan daftar sub-kriteria pemicu risiko.

#### Tool 3: `trace_halal_batch` (Traceability)
- **Fungsi**: Melacak jejak lengkap batch produk dari Farm hingga Retail.
- **Pencarian**: Berdasarkan earTag (`TAG-xxx`) atau Batch ID. Sistem melakukan normalisasi input (menghapus prefix "sapi", "batch", meng-uppercase).
- **Output Detail**:
  - Info Batch: ID, tanggal produksi, total risk score, risk level.
  - Info Ternak: earTag, breed, tanggal lahir, nama farm.
  - Per CP (CP1–CP9): Status compliance, risk score, weighted risk, sub-kriteria (diurutkan dari skor tertinggi), informasi entitas (Farm/Transporter/RPH/Gudang/dll), informasi personel.
  - **AUTO-RAG**: Untuk CP berstatus High/Critical/Moderate, sistem otomatis melampirkan referensi akademik/regulasi untuk sub-kriteria penyumbang risiko tertinggi.

#### Tool 4: `get_operational_data` (Database)
- **Fungsi**: Mengambil daftar entitas operasional dari database.
- **Kategori Didukung**: Farm, RPH/Slaughterhouse, Batch/Sapi/Ternak, serta data personel dari QuestionnaireResponse.
- **Filter**: Mendukung filter lokasi (misal: "RPH di Bandung").

### 7.6 Mekanisme Fallback & Penanganan Error
- **Confidence Rendah (<0.7)**: Jika IndoBERT tidak yakin, sistem menyerahkan seluruh 4 tools ke LLM untuk menentukan tool mana yang tepat (*LLM Function Calling fallback*).
- **Model Gagal Load**: Jika model IndoBERT gagal di-load (error jaringan, dll), semua request otomatis menggunakan LLM fallback. Status ini berlaku hingga server di-restart.
- **Quota API Habis**: Jika API key OpenRouter habis, chatbot mengembalikan pesan error: *"Limit API Key OpenRouter telah habis."*
- **Error Handling**: Semua error ditangkap dan ditampilkan sebagai pesan error yang informatif.

### 7.7 Knowledge Base & RAG (Khusus Admin)
1. Admin dapat memperkaya wawasan chatbot dengan mengakses menu **Knowledge Base** di dashboard.
2. Upload dokumen referensi (**PDF / TXT**) berisi undang-undang, jurnal, atau SOP halal perusahaan.
3. Sistem secara otomatis:
   - Memecah dokumen menjadi potongan paragraf (*chunking*).
   - Memproses setiap chunk menjadi vektor embedding 384-dimensi menggunakan model `all-MiniLM-L6-v2`.
   - Menyimpan vektor ke database PostgreSQL (tabel `oai` dan `HalalDocument`) dengan metadata (judul dokumen, kategori CP).
4. Saat pengguna bertanya, chatbot melakukan *cosine similarity search* pada vektor-vektor ini untuk menemukan informasi paling relevan.

### 7.8 Contoh Prompt dan Respons Chatbot

| Jenis Pertanyaan | Contoh Prompt | Apa yang Terjadi |
|---|---|---|
| **Regulasi/Teori** | "Apa saja syarat pemotongan hewan halal menurut fatwa MUI?" | IndoBERT → `knowledge_query` → RAG search di Knowledge Base → LLM menyusun jawaban dengan referensi lengkap. |
| **Cek Risiko** | "Berapa skor risiko untuk CP2 saat ini?" | IndoBERT → `risk_check` → Query database CriticalPoint → Tampilkan bobot dan status. |
| **Lacak Batch** | "Lacak batch sapi TAG-A003" | IndoBERT → `batch_trace` → Query HalalBatch + semua relasi → Tabel compliance per CP + rekomendasi AUTO-RAG. |
| **Data Operasional** | "Tampilkan daftar RPH" | IndoBERT → `operational_data` → Query tabel Slaughterhouse → Daftar nama dan lokasi. |
| **QR Code Scan** | *(User scan QR, redirect ke `/chat?trace=TAG-B004`)* | Auto-trigger `trace_halal_batch` → Langsung tampilkan hasil pelacakan tanpa user mengetik. |
| **Sapaan** | "Halo, terima kasih" | IndoBERT → `greeting` → Respons langsung tanpa tool. |
| **Di Luar Konteks** | "Siapa presiden Indonesia?" | IndoBERT → `out_of_scope` → Penolakan sopan, mengarahkan ke domain halal. |

---

## 8. PANDUAN PENGGUNAAN: DASHBOARD ADMIN

Panel admin digunakan untuk memantau kesehatan ekosistem *supply chain* dan mengelola data sistem.

### 8.1 Halaman Dashboard Utama
Setelah login, pengguna diarahkan ke halaman Dashboard yang menampilkan:

#### Kartu Statistik Ringkasan:
| Kartu | Deskripsi |
|-------|-----------|
| Total Batch | Jumlah seluruh batch sapi yang terdaftar |
| Batch Risiko Tinggi | Jumlah batch dengan status HIGH atau CRITICAL |
| Rata-rata Skor Risiko | Rata-rata totalRiskScore dari semua batch |
| Pass Rate | Persentase batch dengan status LOW |
| Jumlah Farm | Total peternakan terdaftar |
| Jumlah RPH | Total rumah potong hewan terdaftar |
| Jumlah Sapi | Total sapi/ternak terdaftar |
| K1/K2/K3 Count | Jumlah respons kuesioner masing-masing jenis |

#### Tabel Risiko Per CP (Critical Points):
Menampilkan 9 titik kritis beserta:
- Bobot Global (dari Fuzzy AHP).
- Risk Score Lokal.
- Global Weighted Risk.
- Status Risiko (Low / Moderate / High / Critical) dengan warna visual.
- Daftar sub-kriteria dan bobotnya.

#### Tabel Batch Terbaru:
Menampilkan daftar batch sapi dengan:
- Earag, breed, farm, RPH.
- Total Risk Score dan Risk Level.
- Detail CP Records per batch (expand/collapse).

#### Distribusi Risiko:
Grafik/chart yang menampilkan distribusi batch berdasarkan level risiko (Low, Moderate, High, Critical).

#### Respons Kuesioner Terbaru:
Tabel yang menampilkan 10 respons kuesioner terakhir (K1/K2/K3) dengan timestamp.

### 8.2 Master Data dan Pengguna
Melalui menu **User Management**:
1. Menambah, mengubah, atau menonaktifkan (ban) pengguna.
2. Mengatur role pengguna (ADMIN, PAKAR_K1, PAKAR_K2, CP1_FARM, dst.).

Melalui **Batch Management**:
1. Mengelola data batch sapi (membuat batch baru, menautkan earTag ke Farm dan RPH).
2. Melihat detail lengkap batch termasuk semua CP records.

### 8.3 Laporan dan Rekapitulasi

| Menu | Deskripsi |
|------|-----------|
| **Rekap Pembobotan** | Menampilkan ringkasan semua respons K1 dari para pakar, termasuk matriks perbandingan dan bobot yang dihasilkan. |
| **Rekap Risiko** | Menampilkan ringkasan semua respons K2 dari auditor per CP. |
| **Rekap Aktual** | Menampilkan ringkasan semua respons K3 dari responden lapangan per CP, termasuk file bukti yang diupload. |
| **AHP Steps** | Menampilkan langkah-langkah detail perhitungan Fuzzy AHP (matriks TFN, synthetic extent, defuzzifikasi, consistency ratio). |
| **Weighting** | Visualisasi bobot global dan lokal CP1–CP9 hasil Fuzzy AHP. |

### 8.4 Traceability QR Code
Setiap batch memiliki halaman detail (`/trace/[batchId]`) yang dilengkapi **QR Code** yang dapat dipindai untuk langsung membuka chatbot dan melacak status batch tersebut.

---

## 9. PENUTUP

Buku panduan ini merupakan acuan operasional lengkap untuk **Sistem Informasi Manajemen Halal Supply Chain Terintegrasi v2.0**. Sistem ini mengintegrasikan tiga pilar utama:

1. **Fuzzy AHP (Kuesioner 1)** — Pembobotan prioritas kriteria risiko oleh pakar melalui perbandingan berpasangan 3 level (Kriteria Umum, CP Level, Sub-Kriteria).
2. **Pengukuran Risiko & Kondisi Aktual (Kuesioner 2 & 3)** — Penilaian tingkat risiko oleh auditor dan pencatatan kondisi lapangan oleh responden, termasuk upload bukti dan validasi supervisor.
3. **Halal AI Chatbot (IndoBERT + RAG + LLM)** — Asisten cerdas yang mengklasifikasikan niat pengguna secara otomatis dan mengambil data dari Knowledge Base maupun database Traceability untuk menyusun jawaban yang akurat dan bereferensi.

Dengan sinergi ketiga pilar di atas, diharapkan ekosistem halal dapat dipantau dan dievaluasi secara **akurat**, **transparan**, dan **real-time** dari hulu (Farm) hingga hilir (Retail).

*Untuk pertanyaan teknis atau keluhan sistem, silakan hubungi tim administrator IT.*

---

**© 2026 — Sistem Informasi Manajemen Halal Supply Chain Terintegrasi (KMS & DSS)**
