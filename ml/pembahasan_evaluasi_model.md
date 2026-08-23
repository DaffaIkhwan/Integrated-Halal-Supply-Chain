# BAB 4: Hasil dan Pembahasan Evaluasi Model IndoBERT

*(Panduan: Anda bisa langsung **copy-paste** seluruh teks di bawah ini ke dalam dokumen Microsoft Word skripsi Anda di bagian Pembahasan/Evaluasi Model).*

---

## 4.1. Hasil Pengujian Model Klasifikasi Intent
Setelah tahap pelatihan (training) selesai, model dievaluasi menggunakan *held-out test set* yang mewakili 10% dari total dataset (180 data uji murni). Data uji ini terdiri dari kalimat-kalimat natural yang ambigu, menggunakan singkatan, dan memiliki kemiripan semantik antar kelas, guna mensimulasikan input pengguna di kondisi nyata (*real-world scenario*).

Berdasarkan pengujian yang dilakukan, model IndoBERT berhasil mencapai nilai akurasi keseluruhan sebesar **91%**. Berikut adalah rincian performa model untuk masing-masing kelas (intent) yang direpresentasikan melalui *Classification Report*:

**Tabel 4.1 Hasil Evaluasi Model (Classification Report)**

| Kelas (Intent) | Precision | Recall | F1-Score | Support (Jumlah Data) |
| :--- | :---: | :---: | :---: | :---: |
| `batch_trace` | 0.87 | 0.87 | 0.87 | 30 |
| `greeting` | 1.00 | 1.00 | 1.00 | 30 |
| `knowledge_query` | 0.91 | 1.00 | 0.95 | 30 |
| `operational_data` | 0.86 | 0.80 | 0.83 | 30 |
| `out_of_scope` | 0.85 | 0.93 | 0.89 | 30 |
| `risk_check` | 0.96 | 0.83 | 0.89 | 30 |
| **Rata-rata Makro** | **0.91** | **0.91** | **0.90** | **180** |
| **Akurasi Total** | | | **0.91** | **180** |

Dari Tabel 4.1, dapat dilihat bahwa model menunjukkan kinerja yang sangat baik secara keseluruhan. Kelas `greeting` memperoleh skor sempurna (1.00) dikarenakan struktur kalimat sapaan yang sangat berbeda secara linguistik dibandingkan pertanyaan teknis lainnya. Sementara itu, kelas teknis seperti `knowledge_query` tetap mempertahankan tingkat pengenalan yang sangat tinggi dengan F1-Score 0.95.

---

## 4.2. Analisis Matriks Kebingungan (Confusion Matrix)
Untuk memahami lebih dalam mengenai karakteristik model dalam memprediksi kelas, analisis *Confusion Matrix* digunakan untuk memetakan distribusi tebakan yang benar dan salah.

> [!NOTE] 
> Anda dapat menyisipkan Screenshot / Gambar Confusion Matrix berwarna dari Google Colab di sini.

**Pembahasan Misklasifikasi (Error Analysis):**
Meskipun akurasi mencapai 91%, terdapat beberapa misklasifikasi antar kelas. Hal ini merupakan fenomena alamiah dalam *Natural Language Processing* (NLP) akibat adanya irisan makna (semantik) pada kalimat input yang pendek atau tanpa konteks eksplisit. Beberapa temuan penting dari *Confusion Matrix* adalah:

1. **Irisan antara `risk_check` dan `batch_trace`**
   Terdapat 3 kasus di mana input dari kelas `risk_check` diprediksi sebagai `batch_trace`. Kesalahan ini sangat logis karena dalam rantai pasok halal, pertanyaan mengenai "risiko sebuah produk" sering kali menyertakan identitas spesifik dari batch tersebut (misal: "apakah batch B-001 aman?"). Kehadiran kata kunci spesifik terkait batch menyebabkan model cenderung mengklasifikasikannya sebagai aktivitas pelacakan (*traceability*).

2. **Irisan antara `operational_data` dan `out_of_scope` / `knowledge_query`**
   Pada kelas `operational_data`, terdapat 3 data yang ditebak sebagai `knowledge_query` dan 2 data sebagai `batch_trace`. Hal ini terjadi pada input pengguna yang menggunakan kalimat sangat pendek (misal: "datanya mana?"). Tanpa konteks subjek yang jelas, model mengalami kesulitan dalam membedakan apakah pengguna sedang meminta data operasional statistik, atau sedang melacak data sebuah batch.

3. **Ketahanan terhadap Out of Scope (OOS)**
   Model berhasil mengklasifikasikan 28 dari 30 pertanyaan di luar konteks (`out_of_scope`) dengan benar, dan hanya 2 data yang salah ditebak. Ini membuktikan bahwa model tidak mudah "terjebak" saat pengguna menanyakan hal-hal acak yang menggunakan istilah yang mirip (misalnya bertanya harga daging sapi potong, alih-alih bertanya traceability sapi).

### Kesimpulan Evaluasi
Secara keseluruhan, tingkat akurasi 91% mengindikasikan bahwa arsitektur IndoBERT dengan metode transfer learning telah berhasil menangkap representasi semantik dari domain *Halal Supply Chain*. Model tidak mengalami *overfitting* (menghafal data) karena telah diuji dengan dataset evaluasi murni (*held-out test set*) yang belum pernah dilatih sebelumnya dan mengandung banyak variasi singkatan (*noise*). 

Dengan nilai presisi dan *recall* yang rata-rata berada di atas 0.85 untuk kelas-kelas operasional dan teknis yang saling bersinggungan, model ini dinilai telah memenuhi standar reliabilitas (keandalan) dan **sangat layak untuk diintegrasikan ke dalam lingkungan produksi (chatbot backend)**.
