# User Guideline & System Architecture
**Sistem Informasi Manajemen Halal Supply Chain (KMS & DSS)**

Dokumen ini memuat panduan pengguna (User Guideline) sekaligus arsitektur sistem dari **Integrated Halal Supply Chain**, mencakup Diagram Navigasi, Entity Relationship Diagram (ERD), Sequence Diagram, dan Activity Diagram. Format ini diadaptasi dari struktur dokumen pedoman pengguna terstandar.

---

## 1. Diagram Navigasi (Navigation Diagram)

Diagram ini menggambarkan alur menu dari sisi antarmuka pengguna berdasarkan Hak Akses (Role).

```mermaid
mindmap
  root((Halal Supply Chain))
    Auth
      Login
      Register
    Admin Dashboard
      Master Data
      Rekap Aktual
      Rekap Risiko
      Knowledge Base (RAG)
      Batch Management
    Responden Pakar (Pakar K1/K2)
      Kuesioner Pembobotan
        Penilaian CP Level 1
        Penilaian Sub-Kriteria CP1-CP9
    Responden Lapangan (CP1 - CP9)
      Kuesioner Aktual
      Kuesioner Risiko
    Tools
      Halal AI Chatbot
```

---

## 2. Activity Diagram

### A. Activity Diagram: Pengisian Kuesioner & Perhitungan Bobot (Pakar)
Proses ini mirip dengan tahapan _Generate Bobot Fuzzy AHP_ oleh Pakar.

```mermaid
flowchart TD
    A[Mulai] --> B[Login sebagai Pakar]
    B --> C{Pilih Menu}
    C -->|Kuesioner Pembobotan| D[Isi Profil / Biodata Pakar]
    D --> E[Simpan Profil]
    E --> F[Isi Matriks Perbandingan Berpasangan]
    F --> G[Submit Kuesioner]
    G --> H[Sistem Menghitung Fuzzy AHP]
    H --> I[Update Bobot Global & Lokal di Database]
    I --> J[Selesai]
```

### B. Activity Diagram: Input Data Traceability & Aktual (Responden Lapangan)

```mermaid
flowchart TD
    A[Mulai] --> B[Login sebagai Responden (CP1-CP9)]
    B --> C[Buka Menu Kuesioner Aktual / Risiko]
    C --> D[Pilih ID Batch / Entitas]
    D --> E[Isi Formulir Kondisi Aktual Lapangan]
    E --> F[Upload Dokumen Pendukung (PDF/TXT/Excel)]
    F --> G[Simpan / Submit Data]
    G --> H[Sistem Mengkalkulasi Skor Risiko (DSS)]
    H --> I[Status Batch Terupdate (Low/Moderate/High/Critical)]
    I --> J[Selesai]
```

---

## 3. Sequence Diagram

Sequence Diagram berikut menunjukkan interaksi antara Pengguna, Antarmuka (Frontend), API Backend, dan Database (termasuk modul RAG Chatbot).

```mermaid
sequenceDiagram
    autonumber
    actor User as Responden / Admin
    participant UI as Next.js Frontend
    participant API as Next.js API Routes
    participant DB as PostgreSQL (Prisma)
    participant AI as RAG & Chatbot Engine

    User->>UI: Melakukan Login
    UI->>API: Autentikasi (NextAuth)
    API->>DB: Validasi Kredensial
    DB-->>API: Status Valid
    API-->>UI: Session Token

    User->>UI: Membuka Menu Kuesioner (Upload Bukti)
    UI->>API: Submit JSON & File Bukti
    API->>DB: Simpan `QuestionnaireResponse`
    DB-->>API: Success Insert
    API-->>UI: Notifikasi Berhasil Dideploy

    User->>UI: Buka Chatbot "Apa risiko batch 123?"
    UI->>API: POST /api/chat { query }
    API->>DB: Query HalalBatch & CP Records
    DB-->>API: Data Skor Aktual Batch 123
    API->>AI: generate() menggunakan Data Batch & RAG
    AI-->>API: Hasil Rekomendasi
    API-->>UI: Stream Output Chatbot
    UI-->>User: Tampilkan Jawaban AI
```

---

## 4. Entity Relationship Diagram (ERD)

ERD di bawah ini disederhanakan dari skema Prisma untuk menyoroti relasi inti antara Batch, Titik Kritis (CP), dan Kuesioner.

```mermaid
erDiagram
    USER ||--o{ HALAL_CERTIFICATE : memiliki
    USER ||--o{ INCIDENT_LOG : melaporkan
    USER {
        string id PK
        string name
        string email
        string role
        string orgId
    }

    HALAL_BATCH ||--o{ CRITICAL_POINT_RECORD : memiliki_hasil_evaluasi
    HALAL_BATCH }o--|| CATTLE : berasal_dari
    HALAL_BATCH }o--|| SLAUGHTERHOUSE : diproses_di
    HALAL_BATCH {
        string id PK
        string cattleId FK
        string slaughterhouseId FK
        float totalRiskScore
        string riskLevel
    }

    CRITICAL_POINT ||--o{ CRITICAL_POINT_RECORD : diukur_oleh
    CRITICAL_POINT ||--o{ CRITERIA_WEIGHT : memiliki_subkriteria
    CRITICAL_POINT {
        string id PK "CP1, CP2..."
        string name
        float globalWeight
        string riskLevel
    }

    CRITERIA_WEIGHT {
        string id PK
        string criticalPointId FK
        string criteriaCode
        float weight
        string fuzzyScale
    }

    CRITICAL_POINT_RECORD {
        string id PK
        string halalBatchId FK
        string criticalPointId FK
        string complianceStatus
        float riskValue
    }

    QUESTIONNAIRE_RESPONSE {
        string id PK
        string questionnaireType
        string cpId
        string respondentName
        json answers
        string status
    }
```

---
## Ringkasan Fitur
Sesuai format dari dokumen panduan aplikasi pengukur *behavior*, sistem **Halal Supply Chain** ini mengadopsi:
- **Hak Akses Admin:** Kontrol penuh atas Master Data, Rekapitulasi, dan manajemen Knowledge Base RAG.
- **Hak Akses Responden Pakar (Responden I):** Menggunakan Fuzzy AHP untuk membangkitkan (generate) matriks bobot kepentingan per Titik Kritis (CP).
- **Hak Akses Responden Lapangan (Responden II):** Mengumpulkan data dukung, file, excel/dokumen yang memicu kalkulasi Traceability pada DSS Halal.
