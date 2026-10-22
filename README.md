# Cisco NetSim Pro - Multi-Tier Cisco Network Simulator & Auto-Grader
> **Media Simulasi Jaringan Interaktif & Sistem Penilaian Otomatis Berorientasi Standar Kompetensi Cisco CCNA 200-301 (v1.1) & CCNP Enterprise v9 (ENCOR 350-401 v1.2 & ENARSI 300-410 v1.1)**

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan.svg)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](Dockerfile)
[![CI/CD Pipeline](https://github.com/abunabiha/ccna-network-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/abunabiha/ccna-network-simulator/actions)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Ringkasan Eksekutif

**Cisco NetSim Pro** adalah aplikasi simulator jaringan enterprise deterministik berbasis web murni (*zero-install client*) yang dirancang setara dengan **Boson NetSim**, **Cisco Packet Tracer**, dan **Cisco Modeling Labs (CML)**. Sistem ini dibangun khusus untuk memenuhi penguasaan penuh (100% *Strict Mastery Learning*) kompetensi praktis pada dua jenjang sertifikasi industri Cisco terdepan:
1. **Cisco Certified Network Associate (CCNA 200-301 v1.1)** — Fondasi switching L2, routing IPv4/IPv6, dan layanan IP.
2. **Cisco Certified Network Professional (CCNP Enterprise v9)**:
   - **CCNP Enterprise: Core Networking (ENCOR 350-401 v1.2)** — Switching enterprise (CAM/TCAM, CEF), High Availability (FHRP HSRP/VRRP), OSPFv2/v3, EIGRP, BGP dasar, QoS, dan virtualisasi GRE.
   - **CCNP Enterprise: Advanced Routing and Services (ENARSI 300-410 v1.1)** — EIGRP Named Mode & DUAL Wide Metrics, OSPF Multi-Area Stub/NSSA/Virtual Links, Redistribusi Rute Timbal-Balik (Route-Maps & Prefix-Lists), Path Control PBR & IP SLA, Enterprise BGP 13-Step Best Path & Route Reflectors, serta isolasi VRF-Lite.

---

## 🖧 Baseline Perangkat Keras Simulator CCNP Enterprise v9

Mengacu langsung pada kurikulum resmi *Cisco Networking Academy CCNP Enterprise v9 Equipment List*, sistem simulator menyediakan profil perangkat keras dan versi sistem operasi berikut:

| Kategori Perangkat | Model Hardware Cisco | Versi Sistem Operasi | Konfigurasi Port & Modul Antarmuka |
| :--- | :--- | :--- | :--- |
| **Enterprise Edge Router** | **Cisco Catalyst C8200L-1N-4T** | **Cisco IOS XE Version 17.15.4c** atau lebih tinggi | 4x Onboard GigabitEthernet (`GE0/0/0` - `GE0/0/3`) + Modul Serial **NIM-2T** (`Serial0/1/0`, `Serial0/1/1`) dengan kabel sinkron V.35 DCE/DTE. |
| **Multilayer Core Switch** | **Cisco Catalyst C9300L-24T-4G-A** | **Cisco IOS XE Version 17.12.6** atau lebih tinggi | 24x Data GigabitEthernet (`GE1/0/1` - `GE1/0/24`) + 4x 1G SFP Uplinks (`GE1/1/1` - `GE1/1/4`), SVI, routed ports (`no switchport`). |
| **Enterprise Access Switch** | **Cisco Catalyst C9200L-24T-4G-E** | **Cisco IOS XE / IOS 17.12.6** atau lebih tinggi | 24x Data GigabitEthernet + 4x 1G SFP Uplinks, 802.1Q trunking, Rapid-PVST+, MSTP, LACP port-channel. |
| **Enterprise Endpoints** | **Dual-Stack Workstation / PC** | Windows / Linux Stack | Dual-Stack IPv4/IPv6, Static & DHCP client, Visual Network Dialog, Command Prompt (`ping`, `traceroute`, `arp -a`, `netstat`). |
| **Infrastructure Servers** | **Enterprise Network Server** | Multi-Service Linux Daemon | Server DHCP, Server DNS, Server Syslog, Server NTP, dan Server Autentikasi AAA (TACACS+/RADIUS). |

---

## 🌟 Fitur Unggulan Sistem

### 💻 1. Cisco IOS & IOS-XE CLI Engine dengan Fidelitas Tinggi
- **Hierarki Mode Penuh**: Mendukung mode User Exec (`>`), Privileged Exec (`#`), Global Config (`(config)#`), Interface Config (`(config-if)#`), Sub-interface 802.1Q (`(config-subif)#`), VLAN (`(config-vlan)#`), Router OSPF, Router EIGRP Classic & Named Mode (`(config-router-af)#`), Router BGP, Route-Map, IP SLA, dan VRF Definition.
- **Navigasi Histori Perintah & Ketik Ulang**:
  - Tombol panah atas/bawah (`ArrowUp` / `ArrowDown`) dan shortcut Emacs (`Ctrl+P` / `Ctrl+N`) untuk menelusuri riwayat perintah.
  - *Draft Preservation* yang menyimpan draf pengetikan saat menjelajah riwayat.
  - *Auto-Cursor End-of-Line* untuk kenyamanan penyuntingan cepat atau pengetikan ulang (*retyping*).
- **Contextual Help & Tab Completion**: Tombol `?` interaktif dan `Tab` auto-completion.

### 🌐 2. Protokol Penemuan Tetangga & Resolusi Alamat
- **Cisco Discovery Protocol (CDP v2)**: Simulasi protokol penemuan tetangga Layer 2 standar industri Cisco secara real-time (`show cdp neighbors [detail]`, `cdp timer/holdtime`, `cdp run/enable`).
- **Address Resolution Protocol (ARP) Suite di Semua Node**:
  - Resolusi dua arah (*bidirectional dynamic learning*) saat ping ICMP.
  - Perintah Cisco IOS: `show ip arp`, `show arp`, `clear ip arp`, entri statis `arp <ip> <mac> arpa`, tombol cepat `sh ip arp`.
  - Perintah Host Windows: `arp -a`, `arp -s`, `arp -d`, `arp /?`, tombol cepat `arp -a`.

### ⚡ 3. Protokol Enterprise CCNP (ENCOR & ENARSI)
- **High Availability (FHRP)**: HSRPv1, HSRPv2 (virtual MAC `0000.0c9f.fXXX`), VRRPv2/v3 dengan preemption, priority election, dan interface tracking.
- **Dynamic EtherChannel & Spanning Tree**: Agregasi link LACP (802.3ad) dan PAgP, Rapid-PVST+, dan Multiple Spanning Tree Protocol (MSTP 802.1s).
- **Advanced EIGRP Engine**: EIGRP Classic Mode & Named Mode, DUAL Feasibility Condition ($RD < FD$), Feasible Successor, Wide Metrics 64-bit, EIGRP Stubs, dan Unequal-Cost Load Balancing (Variance).
- **Advanced Multi-Area OSPF**: LSA Tipe 1–5 & 7, Special Area Types (Stub, Totally Stubby, NSSA, Totally NSSA), rute summarization, dan OSPF Virtual Links.
- **Mutual Route Redistribution**: Pertukaran rute timbal-balik multi-protokol (OSPF $\leftrightarrow$ EIGRP $\leftrightarrow$ BGP) dengan kontrol filter Route-Maps, IP Prefix-Lists, dan Route Tagging ($\tau$) untuk memutus siklus loop.
- **Path Control & IP SLA**: Policy-Based Routing (PBR) dengan `set ip next-hop` yang terintegrasi langsung dengan pelacakan *object tracking* ICMP-Echo IP SLA.
- **Enterprise BGP-4 & MP-BGP**: Peering IBGP dan EBGP, pohon keputusan 13-atribut jalur terbaik (*13-Step Best Path Algorithm*), manipulasi Weight, Local Preference, AS-Path Prepending, MED, dan BGP Route Reflectors.
- **Network Virtualization (VRF-Lite)**: Isolasi tabel perutean dan tabel ARP multi-tenant per antarmuka pada Router C8200L dan Switch C9300L dengan subnet IP yang tumpang tindih (*overlapping*).

### 🎯 4. Evaluasi Pedagogis & Ujian Pearson VUE
- **Automated Lab Grader**: Mengaudit konfigurasi aktif (*AST inspection*), status protokol operasional, dan matriks ping konektivitas data plane dengan aturan kelulusan ketat 100% (*Strict Mastery Criteria*) pada seluruh 41 lab terpandu (10 CCNA + 31 CCNP Enterprise).
- **OSI 7-Layer PDU Inspector**: Mode simulasi langkah-demi-langkah (Play, Step Forward) untuk melihat de-enkapsulasi frame L2 MAC, paket IP L3, dan segmen L4 (*In-Layers vs Out-Layers*).
- **Pearson VUE Multi-Certification Exam Simulator Engine**: Simulator ujian sertifikasi resmi dengan antarmuka otentik Pearson VUE, timer adaptif, score report berskala Cisco 300–1000 (passing score 825), analisis performa per domain, review screen, dan pembahasan resmi (*official rationales*):
  1. **200-301 CCNA v1.1** (23 Soal, 6 Domain, 120 Menit) — Network Fundamentals, Network Access, IP Connectivity, IP Services, Security Fundamentals, Automation & Programmability.
  2. **350-401 ENCOR v1.2** (21 Soal, 6 Domain, 120 Menit) — Architecture, Virtualization, Infrastructure, Network Assurance, Security, Automation.
  3. **300-410 ENARSI v1.1** (19 Soal, 4 Domain, 90 Menit) — Layer 3 Technologies, VPN Technologies, Infrastructure Security, Infrastructure Services.
- **Tipe Soal Pearson VUE Otentik**: Multiple Choice Single Answer, Multiple Choice Multiple Answer, Drag-and-Drop Matching (bipartite graph), dan Live Interactive Cisco IOS CLI Simlet labs.

---

## 📚 Katalog Lab Terpandu (41 Lab Resmi CCNA & CCNP Enterprise)

### 🟢 Jalur CCNA 200-301 (10 Lab Fondasi)
1. **Lab 01**: Dasar Konfigurasi Router & Switch Cisco IOS (Hostname, Banner, Passwords, SSH, Interface IP)
2. **Lab 02**: VLAN & 802.1Q Trunking pada Access & Distribution Switches
3. **Lab 03**: Inter-VLAN Routing (Router-on-a-Stick subinterfaces & L3 Switch SVI)
4. **Lab 04**: Static & Default Routing (IPv4 & IPv6 Floating Static Routes)
5. **Lab 05**: Single-Area OSPFv2 (Router-ID, Network statements, Passive-interface)
6. **Lab 06**: Standard & Extended IPv4 Access Control Lists (ACL)
7. **Lab 07**: Network Address Translation (Static NAT, Dynamic NAT, PAT / NAT Overload)
8. **Lab 08**: DHCP Server & Relay Agent pada Cisco IOS
9. **Lab 09**: Network Device Management (NTP, Syslog, SNMP, CDP/LLDP)
10. **Lab 10**: CCNA Comprehensive Capstone Challenge

### 🔴 Jalur CCNP Enterprise v9 (31 Lab Lanjutan Berdasarkan Standar Instruktur)
- **Modul 1: OSPF (4 Lab)**
  - `lab-ccnp-ospf-01-single-area`: Implement Single-Area OSPFv2 (Point-to-Point, Broadcast DR/BDR, Priority, Cost, MD5 Auth)
  - `lab-ccnp-ospf-02-multiarea`: Configure Multi-Area OSPFv2 (ABR, Stub, Totally Stub, NSSA, Totally NSSA, Route Summarization)
  - `lab-ccnp-ospf-03-multiarea-ospfv3`: Multi-Area OSPFv3 with Address Families (Unified IPv4 & IPv6 routing processes)
  - `lab-ccnp-ospf-04-troubleshoot-ospfv3`: Troubleshoot OSPFv3 (Mismatched timers, MTU mismatch, passive interface, area ID issues)

- **Modul 2: EIGRP (5 Lab)**
  - `lab-ccnp-eigrp-01-ipv4`: Implement EIGRP for IPv4 (Classic & Named Mode, Router-ID, Unequal-Cost Load Balancing Variance)
  - `lab-ccnp-eigrp-02-advanced`: Advanced EIGRP Features (Key Chain MD5/SHA authentication, Stub routing, Route Summarization)
  - `lab-ccnp-eigrp-03-ipv6`: Implement EIGRP for IPv6 (Dual-stack routing, Link-local next-hop verification)
  - `lab-ccnp-eigrp-04-troubleshoot-ipv4`: Troubleshoot EIGRP for IPv4 (K-values, AS number mismatch, split-horizon, passive interface)
  - `lab-ccnp-eigrp-05-troubleshoot-ipv6`: Troubleshoot EIGRP for IPv6 (IPv6 unicast-routing, interface enable, shutdown states)

- **Modul 3: BGP (6 Lab)**
  - `lab-ccnp-bgp-01-ebgp-ibgp`: Implement BGP with EBGP & IBGP (Loopback update-source, ebgp-multihop, next-hop-self)
  - `lab-ccnp-bgp-02-multihoming`: BGP Multi-Homing & Path Selection (Weight, Local Preference, AS-Path Prepending, MED)
  - `lab-ccnp-bgp-03-mp-bgp`: MP-BGP with IPv4 & IPv6 Address Families (Dual-Stack BGP peering & community tags)
  - `lab-ccnp-bgp-04-route-reflectors`: BGP Route Reflectors (Non-client / Client reflection, Cluster-ID, Loop prevention)
  - `lab-ccnp-bgp-05-troubleshoot-bgp`: Troubleshoot BGP Neighbor Adjacencies (TCP 179 ACLs, Update-source, AS-number mismatches)
  - `lab-ccnp-bgp-06-troubleshoot-mpbgp`: Troubleshoot MP-BGP (Address-family activation, next-hop-self IPv6, routing blackholes)

- **Modul 4: Routing Manipulation & Path Control (3 Lab)**
  - `lab-ccnp-redist-01-mutual`: Mutual Route Redistribution between OSPF and EIGRP (Default metrics, Seed metrics, Route-Maps)
  - `lab-ccnp-redist-02-tagging`: Route Tagging & Loop Prevention (Tag allocation $\tau$, Deny tagged routes, Prefix-Lists)
  - `lab-ccnp-redist-03-pbr-ipsla`: Policy-Based Routing (PBR) with IP SLA Tracking (Next-hop redirection with ICMP probe failover)

- **Modul 5: VPN & DMVPN Technologies (5 Lab)**
  - `lab-ccnp-vpn-01-vrf-lite`: VRF-Lite & Multi-Tenant Routing (Overlapping subnets, isolated routing tables & ARP per interface)
  - `lab-ccnp-vpn-02-dmvpn-phase1`: Dynamic Multipoint VPN (DMVPN) Phase 1 (mGRE Hub, p2p Spoke, NHRP mapping)
  - `lab-ccnp-vpn-03-dmvpn-phase2`: DMVPN Phase 2 (mGRE on Spokes, Dynamic Spoke-to-Spoke tunnels via NHRP resolution)
  - `lab-ccnp-vpn-04-dmvpn-phase3`: DMVPN Phase 3 (NHRP Redirect on Hub, NHRP Shortcut on Spokes, hierarchical CEF install)
  - `lab-ccnp-vpn-05-secure-dmvpn`: Secure DMVPN with IPsec (IKEv2 / ISAKMP, Transform-Set, IPsec profile, Tunnel protection)

- **Modul 6: Infrastructure Security & Services (4 Lab)**
  - `lab-ccnp-sec-01-dhcpv6`: Implement DHCPv6 (SLAAC, Stateless DHCPv6 with other-config-flag, Stateful DHCPv6 with managed-config-flag)
  - `lab-ccnp-sec-02-troubleshoot-ipv4-acls`: Troubleshoot IPv4 ACLs (Extended named ACLs, Time-Range scheduling, VTY access-class)
  - `lab-ccnp-sec-03-troubleshoot-ipv6-acls`: Troubleshoot IPv6 ACLs (Traffic-filter, ICMPv6 ND Router Solicitations/Advertisements rules)
  - `lab-ccnp-sec-04-troubleshoot-urpf`: Troubleshoot Unicast Reverse Path Forwarding (uRPF Strict Mode vs Loose Mode with allow-default)

- **Capstone Challenges (4 Lab)**
  - `lab-ccnp-capstone-01`: Enterprise Core WAN Integration Capstone
  - `lab-ccnp-capstone-02`: Advanced Routing Redistribution & Policy Enforcement Capstone
  - `lab-ccnp-capstone-03`: Multi-Tenant VRF & Secure DMVPN Overlay Capstone
  - `lab-ccnp-capstone-04`: Grand Master CCNP Enterprise Certification Challenge

---

## 🚀 Cara Menjalankan Aplikasi

### 🐳 1. Menjalankan via Docker di Lokal (Direkomendasikan)
Aplikasi telah dikemas dalam container Docker multi-stage (Node.js 20 Alpine untuk build + Nginx 1.27 Alpine production web server) yang sangat ringan, aman, dan cepat:

```bash
# Bangun dan jalankan container di latar belakang (background)
docker compose up -d

# Periksa status container & healthcheck
docker compose ps

# Akses aplikasi di browser
http://localhost:8080/

# Melihat log container
docker compose logs -f

# Menghentikan container
docker compose down
```

### 💻 2. Menjalankan di Lingkungan Pengembangan Lokal (Node.js)
```bash
# Instal dependensi
npm install

# Jalankan Vite Development Server
npm run dev
# Buka di: http://localhost:3000

# Jalankan seluruh rangkaian pengujian otomatis (Engine, Render, Stress, PC Config)
npm test

# Build aset produksi
npm run build
```

---

## ⚙️ Otomasi CI/CD (GitHub Actions)
Repository ini dilengkapi dengan pipeline CI/CD otomatis di `.github/workflows/ci.yml`:
1. **Job 1 (Typecheck, Test & Build)**: Menjalankan `tsc --noEmit`, kompilasi bundle Vite, dan rangkaian pengujian automated lab grading, subnetting math, routing table LPM, serta topology stress tests.
2. **Job 2 (Docker Build & Smoke Test)**: Membangun image Docker multi-stage menggunakan Docker Buildx, menjalankan container pada runner GitHub, dan memverifikasi endpoint `/healthz` serta HTTP 200 via `curl`.

---

## 🔬 Suite Dokumentasi SDLC & Disertasi Doktor (Folder `docs/`)

Setiap tahapan rekayasa perangkat lunak telah didokumentasikan secara formal sesuai standar internasional (IEEE Std & DSRM) untuk mendukung penulisan disertasi doktor dan artikel ilmiah jurnal bereputasi (IEEE / Scopus Q1):

1. [`docs/01_SDLC_METHODOLOGY_AND_FRAMEWORK.md`](./docs/01_SDLC_METHODOLOGY_AND_FRAMEWORK.md)
   - Pendekatan *Design Science Research Methodology (DSRM)* Peffers et al.
   - Landasan pedagogis: *Kolb's Experiential Learning* & *Sweller's Cognitive Load Theory*.
   - Standar perangkat keras CCNP v9: Router C8200L (IOS XE 17.15.4c), Switch C9300L/C9200L (IOS XE 17.12.6).
2. [`docs/02_REQUIREMENTS_SPECIFICATION_SRS.md`](./docs/02_REQUIREMENTS_SPECIFICATION_SRS.md)
   - Dokumen Spesifikasi Kebutuhan Perangkat Lunak berbasis **IEEE Std 830-1998 / ISO/IEC/IEEE 29148**.
   - Matriks kebutuhan fungsional fondasi CCNA (FR-01 s.d. FR-24) dan kebutuhan enterprise CCNP v9 (FR-25 s.d. FR-36).
3. [`docs/03_SYSTEM_ARCHITECTURE_AND_DESIGN_SDD.md`](./docs/03_SYSTEM_ARCHITECTURE_AND_DESIGN_SDD.md)
   - Dokumen Desain Sistem berbasis **IEEE Std 1016-2009**.
   - Arsitektur berlapis, Dekomposisi Control Plane Engines (EIGRP, BGP, OSPF, Redistribution, FHRP, PBR, VRF), CEF Data Plane MTRIE, UML Class Diagram, FSM CLI IOS-XE, dan Sequence Diagram alur PDU enterprise.
4. [`docs/04_ALGORITHMS_AND_MATHEMATICAL_FORMULATIONS.md`](./docs/04_ALGORITHMS_AND_MATHEMATICAL_FORMULATIONS.md)
   - Formulasi matematis metrik komposit EIGRP (Classic & Wide Metrics 64-bit), DUAL Feasibility Condition ($RD < FD$), pohon keputusan seleksi rute terbaik BGP (13 langkah deterministik), OSPF Multi-Area Dijkstra SPF, analisis graf pemutusan siklus redistribusi rute via Route Tagging ($\tau$), dan formulasi virtual MAC FHRP.
5. [`docs/05_VERIFICATION_VALIDATION_AND_TESTING_STD.md`](./docs/05_VERIFICATION_VALIDATION_AND_TESTING_STD.md)
   - Dokumen Rencana & Hasil Pengujian Perangkat Lunak berbasis **IEEE Std 829-2008**.
   - Matriks kasus uji komprehensif CCNA dan CCNP (TC-CLI, TC-L2, TC-L3, TC-ENCOR-FHRP, TC-ENCOR-LACP, TC-ENCOR-MSTP, TC-ENARSI-EIGRP, TC-ENARSI-OSPF, TC-ENARSI-REDIST, TC-ENARSI-BGP, TC-ENARSI-VRF, TC-ENARSI-PBR, TC-ENARSI-COPP), serta benchmark kinerja.
6. [`docs/06_SCIENTIFIC_EVALUATION_AND_PEDAGOGICAL_RUBRICS.md`](./docs/06_SCIENTIFIC_EVALUATION_AND_PEDAGOGICAL_RUBRICS.md)
   - Desain riset kuasi-eksperimen (*Nonequivalent Pre-test/Post-test Control Group Design*).
   - Formulasi metrik efektivitas belajar *Hake's Normalized Gain Score* ($\langle g \rangle$) dan ANCOVA.
   - Kuesioner baku *System Usability Scale (SUS)* 10 butir pernyataan dan rubrik Taksonomi Bloom Tingkat Tinggi (C1–C6) untuk disertasi doktor.

---

## 🛠️ Hak Cipta & Lisensi
Dikembangkan sebagai instrumen pembelajaran dan riset akademik teknologi pendidikan komputer jaringan. Lisensi di bawah MIT License.
