# CCNA NetSim Pro - Cisco Network Simulator & Auto-Grader
> **Lingkungan Simulasi Jaringan Interaktif & Sistem Penilaian Otomatis Berorientasi Standar Kompetensi Ujian Cisco CCNA 200-301 (v1.1)**

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Ringkasan Eksekutif

**CCNA NetSim Pro** adalah aplikasi simulator jaringan komputer berkinerja tinggi yang dirancang setara dengan **Boson NetSim** dan **Cisco Packet Tracer**. Sistem ini dibangun khusus untuk memenuhi kebutuhan penguasaan 100% kompetensi teknis yang diujikan dalam sertifikasi **Cisco Certified Network Associate (CCNA 200-301 versi kurikulum terbaru v1.1)**.

Aplikasi ini berbasis web murni (*zero-install client*), deterministik, responsif, dan dilengkapi dengan:
1. **Cisco IOS CLI Engine**: Emulasi autentik sintaks perintah Cisco IOS (User Exec, Privileged Exec, Global Config, Interface, Sub-interface 802.1Q, VLAN, OSPF, dan Line modes).
2. **Interactive Topology Canvas**: Kanvas drag-and-drop untuk menempatkan Router Cisco ISR, Catalyst Switch L2/L3, PC, dan Server dengan visualisasi kabel (Straight, Crossover) dan status link (Up/Down).
3. **Automated Lab Grader**: Mesin penilaian otomatis berbasis aturan (*Rule-Based Assessment*) yang memeriksa sintaks konfigurasi, status operasional antarmuka, dan konektivitas data-plane dengan skor 0-100% serta feedback diagnostik mendalam.
4. **OSI 7-Layer PDU Inspector**: Mode simulasi aliran paket langkah-demi-langkah (Play, Step Forward) untuk melihat de-enkapsulasi frame L2, paket IP L3, dan segmen L4 (*In-Layers vs Out-Layers*).
5. **Dokumentasi Lengkap SDLC (IEEE Std)**: Berkas dokumen formal tahap demi tahap (SRS, SDD, STD, Formulasi Matematika, Metodologi Penelitian DSRM, Usability SUS) yang siap digunakan sebagai naskah pendukung publikasi artikel ilmiah (Jurnal/Konferensi Internasional).

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
- **Node.js**: Versi 18 ke atas (direkomendasikan v20 / v22)
- **NPM**: Versi 9 ke atas

### 2. Menjalankan di Lingkungan Pengembangan (Development Server)
```bash
# Masuk ke direktori proyek
cd "Network Simulator"

# Jalankan Vite Development Server
npm run dev
```
Buka peramban di alamat: `http://localhost:3000`

### 3. Membangun untuk Produksi (Production Build)
```bash
npm run build
npm run preview
```

---

## 📚 Kurikulum Laboratorium CCNA 200-301 (v1.1)

Aplikasi telah dilengkapi dengan laboratorium terstruktur yang mencakup 6 pilar domain resmi ujian CCNA:

| ID Lab | Judul Laboratorium | Domain Blueprint CCNA | Tingkat Kesulitan |
| :--- | :--- | :--- | :---: |
| **Lab 01** | Initial Device Configuration & Hardening | 5. Security Fundamentals | Beginner |
| **Lab 02** | VLAN Configuration & 802.1Q Trunking | 2. Network Access | Intermediate |
| **Lab 03** | Inter-VLAN Routing (Router-on-a-Stick) | 3. IP Connectivity | Intermediate |
| **Lab 04** | IPv4 Static & Default Routing | 3. IP Connectivity | Beginner |
| **Lab 05** | Single-Area OSPFv2 Implementation & Tuning | 3. IP Connectivity | Intermediate |
| **Lab 06** | Standard & Extended Access Control Lists (ACL) | 4. IP Services | Advanced |
| **Lab 07** | NAT & PAT (Port Address Translation / Overload) | 4. IP Services | Intermediate |
| **Lab 08** | Switch Port Security & Violation Mitigation | 5. Security Fundamentals | Intermediate |

---

## 🔬 Dokumen Pendukung Artikel Ilmiah (Folder `docs/`)

Setiap tahapan rekayasa perangkat lunak telah didokumentasikan secara formal sesuai standar internasional untuk mendukung penulisan tesis/disertasi dan publikasi ilmiah:

1. [`docs/01_SDLC_METHODOLOGY_AND_FRAMEWORK.md`](./docs/01_SDLC_METHODOLOGY_AND_FRAMEWORK.md)
   - Pendekatan *Design Science Research Methodology (DSRM)* Peffers et al.
   - Landasan pedagogis: *Kolb's Experiential Learning* & *Sweller's Cognitive Load Theory*.
2. [`docs/02_REQUIREMENTS_SPECIFICATION_SRS.md`](./docs/02_REQUIREMENTS_SPECIFICATION_SRS.md)
   - Dokumen Spesifikasi Kebutuhan Perangkat Lunak berbasis **IEEE Std 830-1998 / ISO/IEC/IEEE 29148**.
   - Matriks keterlacakan kebutuhan fungsional (FR-01 s.d. FR-15) dan non-fungsional.
3. [`docs/03_SYSTEM_ARCHITECTURE_AND_DESIGN_SDD.md`](./docs/03_SYSTEM_ARCHITECTURE_AND_DESIGN_SDD.md)
   - Dokumen Desain Sistem berbasis **IEEE Std 1016-2009**.
   - Arsitektur 4-Layer, UML Class Diagram, Finite State Machine (FSM) CLI, dan Sequence Diagram alur PDU.
4. [`docs/04_ALGORITHMS_AND_MATHEMATICAL_FORMULATIONS.md`](./docs/04_ALGORITHMS_AND_MATHEMATICAL_FORMULATIONS.md)
   - Formulasi matematis pengalamatan biner IPv4, CIDR, dan Wildcard mask bitwise.
   - Algoritma Longest Prefix Match, Dijkstra Shortest Path First OSPF, dan fungsi objektif Auto-Grader.
5. [`docs/05_VERIFICATION_VALIDATION_AND_TESTING_STD.md`](./docs/05_VERIFICATION_VALIDATION_AND_TESTING_STD.md)
   - Dokumen Pengujian Perangkat Lunak berbasis **IEEE Std 829-2008**.
   - Matriks 14 kasus uji (Black-Box & White-Box) dan hasil benchmark performa.
6. [`docs/06_SCIENTIFIC_EVALUATION_AND_PEDAGOGICAL_RUBRICS.md`](./docs/06_SCIENTIFIC_EVALUATION_AND_PEDAGOGICAL_RUBRICS.md)
   - Desain riset kuasi-eksperimen (*Pre-test/Post-test Control Group Design*).
   - Formulasi metrik efektivitas *Hake's Normalized Gain Score* ($\langle g \rangle$).
   - Kuesioner baku *System Usability Scale (SUS)* 10 butir pernyataan dan rubrik Taksonomi Bloom.

---

## 🛠️ Hak Cipta & Lisensi
Dikembangkan sebagai instrumen pembelajaran dan riset akademik teknologi pendidikan komputer jaringan. Lisensi di bawah MIT License.
