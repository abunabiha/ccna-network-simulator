# SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK (SRS)
## Berdasarkan Standar IEEE Std 830-1998 / ISO/IEC/IEEE 29148
### Proyek: CCNA NetSim Pro - Cisco Network Simulator & Auto-Grader

---

## 1. Pendahuluan

### 1.1 Tujuan
Dokumen Spesifikasi Kebutuhan Perangkat Lunak (*Software Requirements Specification* - SRS) ini mendefinisikan kebutuhan fungsional, non-fungsional, dan batasan operasional untuk sistem **CCNA NetSim Pro**. Dokumen ini dirancang sebagai acuan formal bagi perancangan sistem, pengujian validitas instrumen pembelajaran, dan rujukan primer dalam penulisan artikel ilmiah bidang rekayasa perangkat lunak pendidikan.

### 1.2 Cakupan Produk
CCNA NetSim Pro adalah lingkungan simulasi jaringan deterministik berbasis web yang meniru perilaku perangkat jaringan Cisco (Router ISR, Catalyst Switch L2/L3, End Hosts) dengan antarmuka command line interface (CLI) Cisco IOS yang autentik, visualisasi paket per lapisan model OSI, dan sistem asesmen otomatis berbasis aturan konfigurasi.

---

## 2. Pemetaan Terhadap Blueprint Kurikulum Cisco CCNA 200-301 (v1.1)

Sistem dirancang untuk mencakup seluruh 6 (enam) pilar domain resmi ujian sertifikasi CCNA:

| Domain | Bobot Ujian | Topik Spesifik yang Disimulasikan | Modul Sistem Terkait |
| :--- | :---: | :--- | :--- |
| **1. Network Fundamentals** | 20% | Peran router/switch, pengkabelan (copper, fiber), IPv4 subnetting (FLSM, VLSM), IPv6 addressing, verifikasi IP endpoint. | Canvas Designer, Subnet Engine, Host Model |
| **2. Network Access** | 20% | VLAN (normal, voice, native), 802.1Q trunking, Access ports, Spanning Tree Protocol (STP), EtherChannel (LACP), Port Security. | Switch L2/L3 Engine, STP Solver, Trunk Evaluator |
| **3. IP Connectivity** | 25% | Komponen tabel routing, Static Routing (Next-Hop, Exit-Interface, Floating Static), Default Route (`0.0.0.0/0`), OSPFv2 Single/Multi-Area (Router-ID, cost, passive interface). | Routing Engine, OSPF FSM, SPF Shortest Path |
| **4. IP Services** | 10% | DHCP Server & Relay (`ip helper-address`), DNS resolution, NAT/PAT (Static, Overload), Standard & Extended IPv4 ACLs. | Network Services Manager, ACL Matching Engine, NAT Table |
| **5. Security Fundamentals** | 15% | Password encryption, console/VTY security, enable secret, banner MOTD, Port Security (sticky MAC, violation modes), SSH v2. | Device Security Manager, AAA/VTY Validator |
| **6. Automation & Programmability** | 10% | REST API concepts, representasi data JSON, simulasi controller-based architecture (Cisco DNA/Catalyst Center API endpoints). | Automation Sandbox, JSON Inspector |

---

## 3. Kebutuhan Pengguna (User Characteristics)
1. **Siswa / Calon Kandidat CCNA**: Membutuhkan lingkungan praktikum yang mudah digunakan, tidak memerlukan lisensi berbayar, memberikan umpan balik instan saat salah konfigurasi.
2. **Instruktur / Dosen Jaringan Komputer**: Membutuhkan sistem yang dapat memverifikasi pekerjaan mahasiswa secara otomatis tanpa harus memeriksa baris konfigurasi secara manual satu per satu.
3. **Peneliti / Pengembang**: Membutuhkan sistem modular berbasis open-web standards dengan dokumentasi rancangan formal untuk keperluan eksperimen pedagogis.

---

## 4. Kebutuhan Fungsional (Functional Requirements)

| Kode FR | Nama Fitur | Deskripsi Kebutuhan Fungsional |
| :--- | :--- | :--- |
| **FR-01** | Visual Canvas Topology | Sistem menyediakan kanvas interaktif berbasis drag-and-drop untuk menempatkan Router, Switch L2/L3, PC, dan Server dengan koordinat fleksibel. |
| **FR-02** | Cable & Port Interconnection | Sistem mendukung penghubungan kabel antar port perangkat dengan penanganan tipe antarmuka (GigabitEthernet, FastEthernet, Serial) dan status operasional (Up/Down). |
| **FR-03** | Cisco IOS Multi-Mode CLI | Sistem mengimplementasikan parser CLI dengan hierarki: User Exec (`>`), Privileged Exec (`#`), Global Config (`(config)#`), Interface Config (`(config-if)#`), VLAN Config (`(config-vlan)#`), Router Config (`(config-router)#`), dan Line Config (`(config-line)#`). |
| **FR-04** | Contextual Help & Tab Completion | Sistem mendukung penekanan tombol `?` untuk menampilkan daftar perintah yang valid sesuai konteks mode aktif, serta tombol `Tab` untuk melengkapi kata kunci perintah yang parsial. |
| **FR-05** | Abbreviated Command Support | Sistem dapat mengeksekusi singkatan perintah standar Cisco IOS (misal: `sh ip int br`, `conf t`, `no shut`, `wr mem`, `int g0/0`). |
| **FR-06** | Running-Config Generation | Sistem secara dinamis menghasilkan teks `show running-config` yang akurat dan konsisten mencerminkan seluruh state konfigurasi aktif. |
| **FR-07** | Layer 2 Switching Simulation | Sistem mensimulasikan pembelajaran tabel MAC (*MAC learning*), segmentasi broadcast domain per VLAN, dan penerusan frame 802.1Q trunking. |
| **FR-08** | Inter-VLAN Routing Simulation | Sistem mendukung Router-on-a-Stick melalui sub-interfaces (`encapsulation dot1Q <vlan>`) dan Switch Virtual Interface (SVI) pada L3 Switch. |
| **FR-09** | Layer 3 Routing & OSPF | Sistem menghitung tabel routing dengan pemfilteran *longest prefix match* dan menjalankan kalkulasi rute OSPFv2 berbasis metrik cost. |
| **FR-10** | IP Services Simulation | Sistem mensimulasikan layanan DHCP Server/Relay, NAT/PAT address translation, dan evaluasi paket terhadap Standard/Extended Access Control Lists (ACL). |
| **FR-11** | Dual Mode: Real-time & Simulation | Sistem menyediakan mode Real-time untuk eksekusi cepat dan mode Simulation untuk inspeksi perjalanan PDU langkah-demi-langkah. |
| **FR-12** | OSI 7-Layer PDU Inspector | Sistem menyediakan visualisasi header frame L2, paket L3, dan segmen L4 dengan penjelasan lapisan masuk (*In-Layers*) dan lapisan keluar (*Out-Layers*). |
| **FR-13** | CCNA Lab Curriculum Modules | Sistem menyertakan sekurang-kurangnya 10 modul lab kurikulum CCNA dengan topologi terintegrasi, skenario objektif, dan petunjuk penyelesaian. |
| **FR-14** | Automated Lab Grading Engine | Sistem menyediakan tombol "Check Lab" yang mengevaluasi kepatuhan konfigurasi perangkat dan ketercapaian konektivitas ping, menghasilkan skor persentase (0-100%) dan kartu laporan diagnostik. |
| **FR-15** | Topology Persistence & Export | Sistem mendukung penyimpanan topologi dan konfigurasi ke format JSON serta impor topologi eksternal. |
| **FR-16** | Strict Mastery Grading Rule | Sistem menetapkan aturan kelulusan ketat di mana praktikan dinyatakan LULUS (PASS) hanya jika skor akhir evaluasi mencapai tepat 100% (sempurna), mencerminkan standar penguasaan penuh kompetensi CCNA. |
| **FR-17** | Visual Host IP & Gateway GUI | Sistem menyediakan dialog grafis pada perangkat Host/PC untuk konfigurasi alamat IPv4, Subnet Mask, Default Gateway, DNS Server, serta mode pengalamatan Static vs DHCP secara visual tanpa harus melalui CLI. |
| **FR-18** | Free Sandbox Mode (Zero-State Canvas) | Sistem menyediakan mode kanvas kosong murni tanpa perangkat awal, disertai panduan visual penempatan node untuk perancangan topologi bebas dari nol. |
| **FR-19** | Live Physical Device & Host Connector | Sistem menyediakan jembatan penghubung real-time ke perangkat fisik pengguna melalui Host Network Interface Card (NIC Bridging), direct SSH/Telnet/REST API hardware link, dan real-time ICMP ping latency probe. |
| **FR-20** | Authentic Pearson VUE CCNA Exam Engine | Sistem mengintegrasikan simulator ujian sertifikasi Cisco CCNA 200-301 dengan antarmuka dan model soal resmi Pearson VUE: Multiple Choice (Single/Multiple Answer), Drag-and-Drop item-to-target matching, dan Simlet performance-based interactive Cisco IOS CLI labs, dilengkapi timer 120 menit, exhibit diagram viewer, dan laporan skor per-domain. |
| **FR-21** | Command History Navigation & Seamless Retyping | Sistem mendukung navigasi riwayat perintah terminal menggunakan tombol panah atas/bawah (`ArrowUp`/`ArrowDown`) dan shortcut Emacs (`Ctrl+P`/`Ctrl+N`), penyimpanan draft teks aktif pengguna sebelum browsing history, penempatan kursor otomatis di akhir baris untuk pengetikan ulang (*retyping*), serta pencatatan riwayat pada Cisco IOS terminal, Host/PC terminal, dan Pearson VUE simlet console. |
| **FR-22** | Cisco Discovery Protocol (CDP) L2 Engine | Sistem menyediakan simulasi penuh protokol penemuan tetangga Layer 2 Cisco (CDP v2), mencakup perintah global (`cdp run`, `cdp timer`, `cdp holdtime`), perintah antarmuka (`cdp enable`), perintah verifikasi operasional (`show cdp`, `show cdp neighbors [detail]`, `show cdp entry`, `show cdp interface`), refleksi ke running-config, dan deteksi tetangga dua arah antar-link fisik. |
| **FR-23** | Layer 3 Switch: Cisco IOS-XE 17.12.6+ Multilayer Architecture | Sistem menyediakan model perangkat Multilayer Switch Cisco Catalyst 9300-24T dengan image sistem autentik Cisco IOS-XE Version 17.12.6, mendukung Inter-VLAN Routing via Switched Virtual Interfaces (SVI), routed ports (`no switchport`), aktivasi routing IP (`ip routing`), dan algoritma Longest Prefix Match (LPM) routing table lookup. |

---

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

### 5.1 Kinerja (Performance)
- **NFR-P1 (Latency)**: Waktu pemrosesan eksekusi perintah pada terminal CLI harus kurang dari 50 milidetik (*sub-50ms latency*).
- **NFR-P2 (Simulation Step)**: Waktu kalkulasi rute L3 dan propagasi paket dalam topologi berukuran s.d. 20 node tidak melebihi 100 milidetik.
- **NFR-P3 (Initial Load Time)**: Waktu pemuatan awal aplikasi berbasis web di bawah 2.0 detik pada koneksi internet standar.

### 5.2 Keandalan & Determinisme (Reliability & Determinism)
- **NFR-R1 (Deterministic State)**: Eksekusi urutan konfigurasi yang identik harus menghasilkan state jaringan dan tabel routing yang selalu konsisten 100% (*zero nondeterministic anomaly*).

### 5.3 Usabilitas (Usability)
- **NFR-U1 (Learnability)**: Antarmuka harus mengikuti konvensi visual standar perangkat lunak simulator industri (Cisco Packet Tracer / Boson NetSim).
- **NFR-U2 (System Usability Scale)**: Ditargetkan mencapai skor SUS minimal > 80 (kategori *Excellent* / *Grade A*).

### 5.4 Kompatibilitas & Portabilitas (Compatibility & Portability)
- **NFR-C1 (Platform Independence)**: Dapat berjalan pada seluruh peramban modern (*cross-browser*: Chrome, Safari, Firefox, Edge) pada sistem operasi macOS, Windows, dan Linux tanpa instalasi plugin tambahan.
