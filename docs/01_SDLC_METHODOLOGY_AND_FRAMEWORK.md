# DOKUMEN METODOLOGI PENELITIAN & SIKLUS HIDUP PENGEMBANGAN SISTEM (SDLC)
## Pengembangan Media Simulasi Jaringan Interaktif Berorientasi Standar Kompetensi Cisco CCNA 200-301 (v1.1)

---

### Informasi Dokumen
- **Judul Proyek**: CCNA NetSim Pro (Cisco Network Simulator & Auto-Grader)
- **Kategori**: Educational Technology / Computer Science / Network Engineering
- **Pendekatan Metodologi**: *Design Science Research Methodology (DSRM)* dikombinasikan dengan *Agile Evolutionary Prototyping* dan Model Pedagogis *ADDIE* (Analysis, Design, Development, Implementation, Evaluation)
- **Tujuan Dokumen**: Dokumen pendukung metodologis untuk penulisan artikel ilmiah (Jurnal Internasional Bereputasi / Prosiding Konferensi IEEE/Scopus).

---

## 1. Latar Belakang & Landasan Filosofis Penelitian

Dalam pendidikan teknik komputer dan jaringan (Computer Network Engineering), penguasaan keterampilan praktis konfigurasi perangkat Cisco IOS (*Internetwork Operating System*) merupakan kompetensi krusial yang dipersyaratkan oleh industri global, khususnya melalui sertifikasi **Cisco Certified Network Associate (CCNA 200-301)**. Namun, institusi pendidikan dan praktisi kerap menghadapi hambatan nyata:
1. **Keterbatasan Akses Hardware Riil**: Biaya pengadaan router dan switch fisik (*high capital expenditure*) yang mahal serta degradasi fisik port (*hardware wear and tear*).
2. **Keterbatasan Emulator Berat (GNS3 / EVE-NG)**: Membutuhkan komputer berspesifikasi tinggi (RAM >16GB, CPU virtualisasi bertingkat KVM/QEMU) serta image binari Cisco IOS berpemilik (*proprietary/copyrighted*).
3. **Keterbatasan Simulator Tertutup**: Simulator komersial seperti Boson NetSim berbayar mahal per lisensi pengguna dan tidak terintegrasi secara modular dengan lingkungan pembelajaran terbuka.

Penelitian rekayasa ini membangun artefak perangkat lunak **"CCNA NetSim Pro"**, simulator jaringan deterministik berbasis web yang mengemulasikan Cisco IOS CLI, protokol L2/L3, visualisasi inspeksi PDU 7-Layer OSI, dan mesin penilaian otomatis (*Auto-Grading Engine*).

---

## 2. Kerangka Kerja Metodologi: Design Science Research (DSRM)

Pengembangan simulator ini mengadopsi model DSRM (*Peffers et al., 2007*), yang terstruktur dalam 6 tahapan ilmiah:

```mermaid
flowchart LR
    P1[1. Problem Identification] --> P2[2. Define Objectives]
    P2 --> P3[3. Design & Development]
    P3 --> P4[4. Demonstration]
    P4 --> P5[5. Evaluation]
    P5 --> P6[6. Communication]
```

### 2.1 Tahap 1: Problem Identification and Motivation
- Mengidentifikasi kesenjangan (*gap*) antara kebutuhan penguasaan silabus Cisco CCNA 200-301 v1.1 dengan ketersediaan alat bantu lab yang ringan, akurat, dan memiliki *instant feedback* auto-grading.

### 2.2 Tahap 2: Define Objectives of a Solution
- Menetapkan sasaran rekayasa:
  - Mengembangkan parser Cisco IOS CLI yang mendukung hierarki mode eksekusi, autokompleksi `Tab`, bantuan kontekstual `?`, dan singkatan perintah.
  - Membangun kernel simulasi jaringan L2 (VLAN, 802.1Q trunking, STP) dan L3 (Subnetting, Static Route, OSPFv2, DHCP, NAT, ACL).
  - Menyediakan visualisasi PDU OSI 7-Layer per hop untuk menurunkan beban kognitif (*cognitive load*) mahasiswa.
  - Mengintegrasikan modul penilaian otomatis (*Automated Lab Grading*) dengan granularitas evaluasi status perangkat dan ketercapaian konektivitas.

### 2.3 Tahap 3: Design and Development
- Meliputi perancangan arsitektur sistem berbasis *Component-Based State Architecture*, pemodelan matematika protokol jaringan, dan implementasi kode sumber modular (TypeScript, React, Zustand, Canvas/SVG).

### 2.4 Tahap 4: Demonstration
- Melakukan eksekusi studi kasus pada 11 skenario laboratorium representatif yang mencakup seluruh domain blueprint CCNA.

### 2.5 Tahap 5: Evaluation
- Menguji ketepatan fungsional (*functional correctness*), kinerja eksekusi (*algorithmic latency*), dan validasi pedagogis melalui instrumen *System Usability Scale (SUS)* serta rubrik evaluasi kompetensi.

### 2.6 Tahap 6: Communication
- Penulisan naskah artikel ilmiah yang memaparkan arsitektur, algoritma, temuan empiris, dan kontribusi pedagogis.

---

## 3. Landasan Teori Pedagogis

Pengembangan perangkat lunak ini tidak hanya berorientasi pada aspek rekayasa perangkat lunak (*software engineering*), melainkan juga berakar pada teori pembelajaran:

1. **Kolb's Experiential Learning Theory (ELT)**:
   - *Concrete Experience*: Interaksi langsung dengan topologi dan CLI Cisco.
   - *Reflective Observation*: Mengamati alur paket pada inspektur PDU OSI 7-Layer.
   - *Abstract Conceptualization*: Menghubungkan respon CLI (`show ip route`, `show mac address-table`) dengan konsep teoretis.
   - *Active Experimentation*: Menyelesaikan tantangan troubleshooting pada modul lab.

2. **Cognitive Load Theory (Sweller, 1988)**:
   - Mengurangi *extraneous cognitive load* (kesulitan akibat instalasi VM/software rumit) melalui platform berbasis web tanpa konfigurasi awal (*zero configuration*).
   - Mengoptimalkan *germane cognitive load* melalui umpan balik instan (*automated formative feedback*) dari modul Auto-Grader.

---

## 4. Matriks Siklus Hidup Pengembangan (SDLC Matrix)

| Fase SDLC | Standar / Kerangka Acuan | Dokumen Artefak | Luaran Ilmiah |
| :--- | :--- | :--- | :--- |
| **1. Analisis Kebutuhan** | IEEE 830-1998 / ISO/IEC 29148 | `02_REQUIREMENTS_SPECIFICATION_SRS.md` | Matriks Kompetensi CCNA 200-301 & Spesifikasi Kebutuhan Fungsional/Non-fungsional |
| **2. Perancangan Sistem** | IEEE 1016-2009 (SDD) | `03_SYSTEM_ARCHITECTURE_AND_DESIGN_SDD.md` | Diagram Arsitektur, UML Class/Sequence, FSM Parser, PDU Flow Model |
| **3. Algoritma & Konstruksi** | Formulasi Matematika & Teori Graf | `04_ALGORITHMS_AND_MATHEMATICAL_FORMULATIONS.md` | Algoritma Dijkstra SPF, Trie Prefix Matcher, Lexical Tokenizer, Grader Heuristic |
| **4. Verifikasi & Pengujian** | IEEE 829-2008 (STD) | `05_VERIFICATION_VALIDATION_AND_TESTING_STD.md` | Test Case Matrix, White-Box & Black-Box Testing, Benchmark Kinerja |
| **5. Evaluasi Ilmiah & Dampak** | SUS (Brooke, 1996) & Quasi-Experiment | `06_SCIENTIFIC_EVALUATION_AND_PEDAGOGICAL_RUBRICS.md` | Instrumen Pengukuran Efektivitas Belajar & Skala Usabilitas Sistem |
