# Raw Data Dropdown Opsi — Perhitungan Fuzzy AHP

## Skala Linguistik Fuzzy (Triangular Fuzzy Number)

Setiap opsi dropdown menggunakan **5 tingkat linguistik** yang di-mapping ke TFN:

| Level | Label | TFN (l, m, u) | Defuzzifikasi | Risk |
|-------|-------|---------------|---------------|------|
| 1 | Sangat Patuh | (0, 0.05, 0.15) | (0+0.05+0.15)/3 | **0.07** |
| 2 | Patuh | (0.10, 0.25, 0.35) | (0.10+0.25+0.35)/3 | **0.23** |
| 3 | Cukup | (0.30, 0.45, 0.55) | (0.30+0.45+0.55)/3 | **0.43** |
| 4 | Tidak Patuh | (0.50, 0.65, 0.80) | (0.50+0.65+0.80)/3 | **0.65** |
| 5 | Sangat Buruk | (0.75, 0.90, 1.00) | (0.75+0.90+1.00)/3 | **0.88** |

**Metode Defuzzifikasi**: Center of Area (CoA) → `D = (l + m + u) / 3`

---

## Klasifikasi Risk Level

| Skor | Level | Warna |
|------|-------|-------|
| 0.00 – 0.25 | Low | 🟢 Hijau |
| 0.26 – 0.50 | Moderate | 🟡 Kuning |
| 0.51 – 0.75 | High | 🟠 Oranye |
| 0.76 – 1.00 | Critical | 🔴 Merah |

---

## CP1 — Farm / Kandang Sapi (7 Kriteria)

### F1: Asal-usul sapi
| Opsi | Deskripsi | TFN | Risk |
|------|-----------|-----|------|
| f1_1 | Bersertifikat halal + dokumen lengkap | (0, 0.05, 0.15) | 0.07 |
| f1_2 | Ada dokumen asal tapi belum sertifikasi halal | (0.10, 0.25, 0.35) | 0.23 |
| f1_3 | Dokumen sebagian, asal-usul kurang jelas | (0.30, 0.45, 0.55) | 0.43 |
| f1_4 | Tidak ada dokumen, asal dari pasar bebas | (0.50, 0.65, 0.80) | 0.65 |
| f1_5 | Asal-usul tidak diketahui sama sekali | (0.75, 0.90, 1.00) | 0.88 |

### F2: Status kesehatan sapi
| Opsi | Deskripsi | TFN | Risk |
|------|-----------|-----|------|
| f2_1 | Sehat, surat keterangan veteriner valid | (0, 0.05, 0.15) | 0.07 |
| f2_2 | Sehat, pemeriksaan rutin tapi surat belum update | (0.10, 0.25, 0.35) | 0.23 |
| f2_3 | Ada riwayat sakit ringan, sudah diobati | (0.30, 0.45, 0.55) | 0.43 |
| f2_4 | Kondisi kurang sehat, belum diperiksa dokter hewan | (0.50, 0.65, 0.80) | 0.65 |
| f2_5 | Sakit / ada gejala penyakit menular | (0.75, 0.90, 1.00) | 0.88 |

### F3: Kepatuhan pakan
| Opsi | Deskripsi | TFN | Risk |
|------|-----------|-----|------|
| f3_1 | Pakan 100% halal certified, tercatat lengkap | (0, 0.05, 0.15) | 0.07 |
| f3_2 | Pakan halal tapi belum semua tersertifikasi | (0.10, 0.25, 0.35) | 0.23 |
| f3_3 | Sebagian pakan belum terverifikasi kehalalannya | (0.30, 0.45, 0.55) | 0.43 |
| f3_4 | Pakan campuran, ada bahan yang meragukan | (0.50, 0.65, 0.80) | 0.65 |
| f3_5 | Pakan mengandung bahan haram / tidak diketahui | (0.75, 0.90, 1.00) | 0.88 |

### F4: Penggunaan obat/vaksin
| Opsi | Deskripsi | TFN | Risk |
|------|-----------|-----|------|
| f4_1 | Obat/vaksin halal certified, withdrawal period terpenuhi | (0, 0.05, 0.15) | 0.07 |
| f4_2 | Obat terdaftar BPOM, withdrawal period terpenuhi | (0.10, 0.25, 0.35) | 0.23 |
| f4_3 | Obat terdaftar tapi withdrawal period belum pasti | (0.30, 0.45, 0.55) | 0.43 |
| f4_4 | Penggunaan obat tanpa resep / tidak tercatat | (0.50, 0.65, 0.80) | 0.65 |
| f4_5 | Obat ilegal / mengandung bahan haram | (0.75, 0.90, 1.00) | 0.88 |

### F5: Dokumentasi pemeliharaan
| Opsi | Deskripsi | TFN | Risk |
|------|-----------|-----|------|
| f5_1 | Dokumentasi lengkap dan digital | (0, 0.05, 0.15) | 0.07 |
| f5_2 | Dokumentasi manual tapi lengkap | (0.10, 0.25, 0.35) | 0.23 |
| f5_3 | Dokumentasi sebagian, ada yang hilang | (0.30, 0.45, 0.55) | 0.43 |
| f5_4 | Dokumentasi sangat minim | (0.50, 0.65, 0.80) | 0.65 |
| f5_5 | Tidak ada dokumentasi sama sekali | (0.75, 0.90, 1.00) | 0.88 |

### F6: Kebersihan kandang
| Opsi | Deskripsi | TFN | Risk |
|------|-----------|-----|------|
| f6_1 | Kandang bersih, sanitasi rutin terjadwal | (0, 0.05, 0.15) | 0.07 |
| f6_2 | Kandang cukup bersih, sanitasi periodik | (0.10, 0.25, 0.35) | 0.23 |
| f6_3 | Kebersihan kurang, sanitasi tidak rutin | (0.30, 0.45, 0.55) | 0.43 |
| f6_4 | Kandang kotor, jarang dibersihkan | (0.50, 0.65, 0.80) | 0.65 |
| f6_5 | Kondisi sangat kotor, potensi kontaminasi tinggi | (0.75, 0.90, 1.00) | 0.88 |

### F7: Kesiapan hewan disembelih
| Opsi | Deskripsi | TFN | Risk |
|------|-----------|-----|------|
| f7_1 | Hewan sehat, istirahat cukup, ante-mortem PASS | (0, 0.05, 0.15) | 0.07 |
| f7_2 | Hewan sehat, istirahat cukup tapi belum ante-mortem | (0.10, 0.25, 0.35) | 0.23 |
| f7_3 | Hewan lelah / stres ringan | (0.30, 0.45, 0.55) | 0.43 |
| f7_4 | Hewan sakit ringan / sangat stres | (0.50, 0.65, 0.80) | 0.65 |
| f7_5 | Hewan tidak layak sembelih | (0.75, 0.90, 1.00) | 0.88 |

---

## CP2 — Pakan & Kesehatan Hewan (5 Kriteria)

### FD1–FD5 menggunakan pola yang sama (lihat file `cp-options-1-5.ts`)

| Kode | Kriteria | Opsi Terbaik (Risk 0.07) | Opsi Terburuk (Risk 0.88) |
|------|----------|--------------------------|---------------------------|
| FD1 | Status halal bahan pakan | Semua bersertifikat halal | Ada bahan haram |
| FD2 | Reliabilitas supplier | Tersertifikasi, rekam jejak baik | Bermasalah/terindikasi haram |
| FD3 | Segregasi penyimpanan | Terpisah, berlabel, terkontrol | Halal-haram tercampur |
| FD4 | Kontrol pengobatan | Semua tercatat, halal, resep drh | Obat terlarang/bahan haram |
| FD5 | Supervisi veteriner | Drh tetap, kunjungan rutin | Tidak ada akses ke drh |

---

## CP3 — Transportasi ke RPH (5 Kriteria)

| Kode | Kriteria | Opsi Terbaik (Risk 0.07) | Opsi Terburuk (Risk 0.88) |
|------|----------|--------------------------|---------------------------|
| T1 | Kelayakan kendaraan | Khusus ternak, terawat, layak | Tidak layak angkut ternak |
| T2 | Kebersihan kendaraan | Disinfeksi sebelum & sesudah | Kotor, sisa angkutan sebelumnya |
| T3 | Animal welfare | Kepadatan sesuai standar | Kondisi menyiksa, cedera |
| T4 | Traceability transport | GPS + dokumen lengkap | Tidak ada dokumentasi |
| T5 | Dokumentasi perjalanan | Surat jalan, SKKH, log suhu | Tidak ada dokumen |

---

## CP4 — RPH / Penyembelihan — PALING KRITIS (10 Kriteria)

| Kode | Kriteria | Opsi Terbaik (Risk 0.07) | Opsi Terburuk (Risk 0.88) |
|------|----------|--------------------------|---------------------------|
| R1 | Sertifikat halal RPH | MUI valid, audit PASS | Tidak punya sertifikat |
| R2 | Kompetensi juru sembelih | Sertifikat MUI, >5 thn | Tidak kompeten / bukan Muslim |
| R3 | Proses syariah | 100% sesuai standar MUI | Tidak ikut prosedur syariah |
| R4 | Pemeriksaan ante/post-mortem | Drh resmi, lengkap | Tidak ada pemeriksaan |
| R5 | Sanitasi alat & area | Sterilisasi rutin, GMP | Tidak ada prosedur sanitasi |
| R6 | Pemisahan halal/non-halal | Dedicated 100% halal | Tidak ada pemisahan |
| R7 | Dokumentasi penyembelihan | Digital per ekor + foto | Tidak ada pencatatan |
| R8 | Pengawasan halal internal | Tim aktif, audit bulanan | Tidak ada pengawasan |
| R9 | Audit & corrective action | Eksternal tahunan + CAPA | Temuan diabaikan |
| R10 | Traceability batch | Full digital farm-to-carcass | Tidak ada traceability |

---

## CP5–CP10 (Ringkasan)

Semua CP5-CP10 mengikuti pola TFN yang sama. Detail lengkap ada di:
- `src/lib/data/cp-options-1-5.ts` (CP1-CP5)
- `src/lib/data/cp-options-6-10.ts` (CP6-CP10)

| CP | Nama | Jumlah Kriteria |
|----|------|----------------|
| CP5 | Post-Slaughter Handling | 5 (PS1–PS5) |
| CP6 | Processing / Pengolahan | 7 (P1–P7) |
| CP7 | Cold Storage / Warehouse | 7 (CS1–CS7) |
| CP8 | Distribusi / Logistik | 7 (D1–D7) |
| CP9 | Retail / Pasar | 7 (RT1–RT7) |
| CP10 | Konsumen & Complaint | 5 (C1–C5) |

**Total: 65 kriteria × 5 opsi = 325 opsi dropdown**

---

## Contoh Perhitungan Risk Score per Batch

### Skenario: Batch "CATTLE-001"

Misalkan user memilih opsi berikut untuk CP1 (Farm):

| Kriteria | Opsi Dipilih | Risk Value | Bobot (dari Fuzzy AHP) | Weighted Risk |
|----------|-------------|------------|------------------------|---------------|
| F1 | f1_2 (Patuh) | 0.23 | 0.190 | 0.0437 |
| F2 | f2_1 (Sangat Patuh) | 0.07 | 0.190 | 0.0133 |
| F3 | f3_3 (Cukup) | 0.43 | 0.119 | 0.0512 |
| F4 | f4_1 (Sangat Patuh) | 0.07 | 0.119 | 0.0083 |
| F5 | f5_2 (Patuh) | 0.23 | 0.119 | 0.0274 |
| F6 | f6_3 (Cukup) | 0.43 | 0.143 | 0.0615 |
| F7 | f7_1 (Sangat Patuh) | 0.07 | 0.119 | 0.0083 |

**Local Risk Score CP1** = Σ(Weighted Risk) = **0.2137**
**Risk Level CP1** = Low (< 0.25)

Kemudian:
**Global Weighted Risk CP1** = Global Weight CP1 × Local Risk = 0.089 × 0.2137 = **0.0190**

Proses ini diulang untuk CP2–CP10, lalu:
**Total Batch Risk** = Σ(Global Weighted Risk semua CP)

---

## Formula Ringkas

```
Risk_option = defuzzify(TFN) = (l + m + u) / 3

LocalRisk_CP = Σ (weight_criteria × risk_selected_option)

GlobalWeightedRisk_CP = globalWeight_CP × LocalRisk_CP

TotalBatchRisk = Σ GlobalWeightedRisk_CP (untuk semua 10 CP)

RiskLevel = 
  if TotalBatchRisk >= 0.76 → "Critical"
  if TotalBatchRisk >= 0.51 → "High"  
  if TotalBatchRisk >= 0.26 → "Moderate"
  else → "Low"
```
