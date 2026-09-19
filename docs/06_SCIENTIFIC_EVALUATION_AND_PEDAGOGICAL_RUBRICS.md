# METODOLOGI EVALUASI ILMIAH & RUBRIK PEDAGOGIS PENELITIAN
## Proyek: CCNA NetSim Pro - Cisco Network Simulator & Auto-Grader
### Panduan Penggunaan Dokumen untuk Penulisan Artikel Ilmiah (Jurnal/Konferensi)

---

## 1. Rancangan Eksperimen Ilmiah (Experimental Research Design)

Untuk mempublikasikan efektivitas simulator ini dalam jurnal bereputasi (misal: *IEEE Transactions on Learning Technologies*, *Computers & Education*, atau *Journal of Educational Technology Systems*), disarankan menggunakan desain penelitian kuasi-eksperimen: **Nonequivalent Pre-test/Post-test Control Group Design**:

$$\begin{array}{lccc}
\text{Kelompok Eksperimen (E)}: & O_1 & X_1 & O_2 \\
\text{Kelompok Kontrol (K)}: & O_3 & X_2 & O_4
\end{array}$$

Di mana:
- $O_1, O_3$: *Pre-test* penguasaan konsep jaringan dan konfigurasi Cisco CCNA 200-301.
- $X_1$: Perlakuan praktikum menggunakan **CCNA NetSim Pro** (dengan fitur interaktif, inspektur PDU OSI, dan instant Auto-Grader).
- $X_2$: Perlakuan pembelajaran konvensional (menggunakan simulator pasif tanpa auto-grader atau teks instruksional statis).
- $O_2, O_4$: *Post-test* performa praktikum dan pemecahan masalah (*troubleshooting exam*).

### 1.1 Formulasi Statistik Uji Hipotesis & Normalized Gain ($g$)
Untuk mengukur efektivitas peningkatan belajar, digunakan metrik *Hake's Normalized Gain Score* ($g$):

$$\langle g \rangle = \frac{\%S_{post} - \%S_{pre}}{100 - \%S_{pre}}$$

Kriteria interpretasi $g$:
- $\langle g \rangle \ge 0.70$ : Kategori Efektivitas **Tinggi (High)**
- $0.30 \le \langle g \rangle < 0.70$ : Kategori Efektivitas **Sedang (Medium)**
- $\langle g \rangle < 0.30$ : Kategori Efektivitas **Rendah (Low)**

Uji signifikansi perbedaan dianalisis melalui uji statistik parametrik *Independent Samples $t$-test* atau *Analysis of Covariance (ANCOVA)*:
$$t = \frac{\bar{X}_1 - \bar{X}_2}{\sqrt{\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}}}$$

---

## 2. Instrumen Evaluasi Usabilitas: System Usability Scale (SUS)

Instrumen baku SUS (*Brooke, 1996*) menggunakan skala Likert 5-titik (1 = Sangat Tidak Setuju, 5 = Sangat Setuju) untuk 10 pernyataan:

1. Saya berpikir bahwa saya ingin sering menggunakan sistem CCNA NetSim Pro ini.
2. Saya merasa sistem ini terlalu rumit, padahal seharusnya bisa lebih sederhana.
3. Saya merasa sistem ini sangat mudah untuk digunakan.
4. Saya merasa membutuhkan bantuan dari orang teknis untuk dapat menggunakan sistem ini.
5. Saya merasa fitur-fitur pada simulator ini terintegrasi dengan sangat baik.
6. Saya merasa ada terlalu banyak inkonsistensi pada simulator ini.
7. Saya merasa orang lain akan dapat mempelajari simulator ini dengan sangat cepat.
8. Saya merasa simulator ini sangat membingungkan saat digunakan.
9. Saya merasa sangat percaya diri saat menggunakan simulator ini untuk berlatih CCNA.
10. Saya harus belajar banyak hal terlebih dahulu sebelum saya dapat mengoperasikan simulator ini.

### 2.1 Formulasi Perhitungan Skor SUS
Untuk responden ke-$k$, dengan skor item bernomor ganjil $R_{odd}$ dan skor item bernomor genap $R_{even}$:
$$\text{Score}_{odd} = \sum (x_i - 1), \quad i \in \{1, 3, 5, 7, 9\}$$
$$\text{Score}_{even} = \sum (5 - x_i), \quad i \in \{2, 4, 6, 8, 10\}$$
$$\text{SUS Score} = 2.5 \times (\text{Score}_{odd} + \text{Score}_{even})$$

Skala Kualitatif Bangor et al. (2009):
- Skor $> 80.3$ : **Grade A (Excellent / Exceptional Usability)**
- Skor $68.0 - 80.3$ : **Grade B (Good)**
- Skor $51.0 - 67.9$ : **Grade C (OK / Marginal)**
- Skor $< 51.0$ : **Grade F (Poor)**

---

## 3. Rubrik Penilaian Kompetensi Ahli CCNA (CCNA Mastery Rubric)

Pemetaan rubrik berbasis Taksonomi Bloom yang terintegrasi pada modul Auto-Grader:

| Domain CCNA 200-301 | Tingkat Kognitif Bloom | Indikator Kompetensi Terukur | Kriteria Auto-Grader |
| :--- | :---: | :--- | :--- |
| **Network Fundamentals** | C2 (Comprehension), C3 (Application) | Mampu merancang skema pengalamatan IPv4/IPv6 dan menghitung VLSM. | Keberadaan IP yang valid pada interface dan tidak terjadi overlap subnet. |
| **Network Access** | C3 (Application), C4 (Analysis) | Mampu mengkonfigurasi VLAN, 802.1Q trunking, dan menganalisis status STP. | Parameter trunk mode, allow-list VLAN, dan ketiadaan loop L2. |
| **IP Connectivity** | C4 (Analysis), C5 (Synthesis) | Mampu mengonfigurasi rute statis, OSPFv2 single/multi-area, dan default route. | Entri tabel rute terbentuk dengan AD dan next-hop yang tepat. |
| **IP Services** | C3 (Application) | Mampu mengonfigurasi DHCP Server, NAT Overload (PAT), dan ACL. | Host menerima IP dari pool; alur paket tertranslasi & terfilter sesuai ACL. |
| **Security Fundamentals** | C3 (Application), C4 (Analysis) | Mampu menerapkan pengamanan port (Port Security) dan enkripsi credential. | Port security sticky MAC aktif, violation shutdown terpasang, enable secret terenkripsi. |
| **Troubleshooting Skills**| C5 (Evaluation), C6 (Creation) | Mampu mendiagnosis dan memperbaiki kesalahan konfigurasi (*mismatched settings*). | Skor perbaikan lab mencapai $100\%$ dan seluruh tes ping matriks berstatus *SUCCESS*. |

### 3.1 Rubrik Evaluasi Ujian Sertifikasi Pearson VUE (CCNA 200-301)
Simulator membedakan tiga taksonomi pengujian autentik Pearson VUE:

1. **Multiple Choice (Knowledge Recall & Scenario Analysis - C1/C2/C3)**:
   - Evaluasi biner diskrit terhadap pemilihan opsi yang benar (single-select) atau himpunan tepat seluruh opsi yang diminta (*e.g., "Choose two" / "Choose three"* tanpa penalti parsial).
2. **Drag-and-Drop (Conceptual Association & Protocol Synthesis - C3/C4)**:
   - Menguji kemampuan klasifikasi konsep (misal: IPv6 Prefix classification, Administrative Distance hierarchy, OSI PDU decapsulation, SDN Architecture Planes).
   - Relasi graf bipartit $E_{cand} = E^*$ diverifikasi secara ketat untuk mendapatkan nilai penuh.
3. **Simlet Performance Lab (Hands-on CLI Implementation - C4/C5/C6)**:
   - Menilai eksekusi sintaks Cisco IOS nyata pada terminal emulator virtual (misal: konfigurasi OSPFv2, Router-on-a-Stick, 802.1Q Trunking).
   - Setiap sub-task diverifikasi langsung dari runtime internal perangkat simulator secara otomatis.
4. **Mastery Certification Criteria**:
   - Kandidat diberikan rapor hasil ujian Pearson VUE dengan visualisasi capaian 6 domain kurikulum serta status kelulusan penguasaan mutlak 100%.
