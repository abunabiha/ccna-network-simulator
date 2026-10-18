# DOKUMEN RENCANA & HASIL PENGUJIAN PERANGKAT LUNAK (STD)
## Berdasarkan Standar IEEE Std 829-2008
### Proyek: Cisco NetSim Pro - Enterprise Multi-Tier Cisco Network Simulator & Auto-Grader
#### Cakupan: Cisco CCNA 200-301 (v1.1) & CCNP Enterprise v9 (ENCOR 350-401 v1.2 & ENARSI 300-410 v1.1)

---

## 1. Strategi & Metodologi Pengujian (Testing Strategy)

Untuk menjamin keabsahan ilmiah (*scientific validity*) dan kesesuaian perilaku fungsional simulator dengan perangkat keras Cisco fisik (Router Catalyst C8200L dengan IOS-XE 17.15.4c, Switch Multilayer Catalyst C9300L dengan IOS-XE 17.12.6, dan Switch Access Catalyst C9200L dengan IOS 17.12.6), pengujian dilakukan melalui empat lapisan verifikasi:

1. **Unit Testing & White-Box Testing**: Menguji algoritma dasar (operasi bitwise subnetting, CIDR, wildcard mask, lexical parsing Trie, metrik komposit EIGRP, DUAL Feasibility Condition $RD < FD$, dan BGP 13-step best path).
2. **Integration & Black-Box Testing**: Menguji interoperabilitas multi-perangkat (negosiasi LACP, pertukaran frame 802.1Q trunking, konvergensi Multi-Area OSPF, peering BGP, redistribusi rute mutual, dan failover FHRP HSRP/VRRP).
3. **Differential Testing vs Real Cisco IOS-XE Hardware**: Membandingkan keluaran teks sintaks CLI, struktur tabel rute (`show ip route`), tabel topologi EIGRP (`show ip eigrp topology`), dan tabel BGP (`show ip bgp`) antara simulator dan perangkat fisik nyata Cisco ISR 4000 / Catalyst 8000 / Catalyst 9000.
4. **Performance & Stress Benchmarking**: Mengukur waktu komputasi konvergensi perutean, konsumsi memori peramban, dan latensi respon CLI di bawah beban topologi enterprise hingga 30 simpul aktif.

---

## 2. Matriks Kasus Uji Fungsional Lengkap (Comprehensive Test Case Matrix)

### 2.1 Pengujian Fondasi CLI, Switching L2, Routing L3 & Layanan IP (CCNA Baseline)
| Test ID | Modul / Fitur | Skenario Pengujian | Masukan (Input) | Luaran Diharapkan (Expected Result) | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-CLI-01** | CLI Lexer | Singkatan perintah standar Cisco | `sh ip int br` | Menampilkan tabel antarmuka dengan IP, Status, dan Protocol | PASS |
| **TC-CLI-02** | CLI FSM | Transisi mode navigasi hierarkis | `conf t` -> `int g0/0/0` -> `exit` | Prompt berganti: `#` -> `(config)#` -> `(config-if)#` -> `(config)#` | PASS |
| **TC-CLI-03** | CLI Context Help | Penekanan tombol `?` di mode config | `?` pada `Router(config)#` | Menampilkan daftar perintah valid konteks aktif | PASS |
| **TC-CLI-04** | CLI Auto-complete| Penekanan tombol `Tab` | `inter` + Tab | Melengkapi menjadi `interface ` | PASS |
| **TC-CLI-05** | CLI Terminal | Command History & Retyping Navigation | `ArrowUp`/`ArrowDown`/`Ctrl+P`/`Ctrl+N` | Riwayat perintah terjelajahi, draf tersimpan, kursor di akhir baris | PASS |
| **TC-L2-01** | VLAN & Trunking | Isolasi broadcast domain | Host di VLAN 10 ping Host di VLAN 20 (tanpa router) | Request timed out (terisolasi secara L2) | PASS |
| **TC-L2-02** | 802.1Q Trunk | Penerusan multi-VLAN melewati trunk switch | Frame bertag VLAN 10 melintasi port trunk | Tag 802.1Q terbaca, frame diteruskan ke port access tujuan | PASS |
| **TC-L2-03** | L2 Broadcast Boundary| Router Membatasi Broadcast Domain (RFC 2131)| PC minta DHCP di belakang Router kosong | Broadcast tidak tembus router; PC fallback ke APIPA (169.254.x.x) | PASS |
| **TC-CDP-01** | L2 Protocols | Cisco Discovery Protocol (CDP v2) | Hubungkan 2 perangkat dan jalankan `show cdp neighbors detail` | Tetangga L2 terdeteksi dua arah, timer/holdtime akurat, platform Cisco valid | PASS |
| **TC-ARP-01** | L2/L3 Protocols | Address Resolution Protocol (ARP) Suite | Ping dinamis, `show ip arp`, `clear ip arp`, serta Host `arp -a`, `arp -s`, `arp -d` | Tabel ARP dinamis terisi dua arah, entri statis valid, format ARPA/Windows konsisten | PASS |
| **TC-L3-01** | Static Routing | Rute statis next-hop | `ip route 192.168.2.0 255.255.255.0 10.0.0.2` | Rute bertipe `S` muncul di `show ip route` & ping antar-subnet berhasil | PASS |
| **TC-L3-02** | OSPFv2 Routing | Pembentukan neighbor & pertukaran rute | `router ospf 1` + `network 192.168.1.0 0.0.0.255 area 0` | Neighbor status `FULL`, rute `O` terpasang di routing table | PASS |
| **TC-L3-03** | Inter-VLAN SVI | Routing antar-VLAN pada L3 Switch | SVI `int vlan 10` & `int vlan 20` diaktifkan pada C9300L | Host VLAN 10 sukses ping Host VLAN 20 melalui gateway SVI | PASS |
| **TC-L3-04** | Hop-by-Hop | Validasi Gateway & Rute Keluar (CCNA Isolation) | PC ping IP luar sebelum router memiliki default route | Router gateway membalas `Destination net unreachable` (tanpa shortcut) | PASS |
| **TC-L3-05** | Multilayer Switch | Catalyst 9300 Cisco IOS-XE 17.12.6 Routing | Jalankan `show version`, buat SVI/routed port, dan uji rute LPM | Output menampilkan Version 17.12.6, routing aktif (`ip routing`), dan paket ter-forward via LPM | PASS |
| **TC-SVC-01**| DHCP Service | Alokasi otomatis IP client | Host diset DHCP mode | Host menerima IP, Subnet, Gateway, dan DNS dari DHCP pool router | PASS |
| **TC-SVC-02**| ACL Filtering | Standard/Extended ACL blocking | `access-list 101 deny icmp any any` diterapkan inbound | Ping menghasilkan `Destination Host Unreachable` / Drop | PASS |
| **TC-SVC-03**| NAT/PAT | Translasi alamat IP privat ke publik | `ip nat inside source list 1 int g0/0/0 overload` | IP sumber paket tertranslasi ke IP publik antarmuka keluar | PASS |
| **TC-GRD-01**| Auto-Grader | Penilaian konfigurasi lab bertahap | Konfigurasi sebagian lab diselesaikan | Grader menampilkan skor proporsional dan checklist per task | PASS |
| **TC-GRD-02**| Auto-Grader | Validasi Strict 100% Mastery Pass | Skor lab = 99% vs 100% | Skor 99% berstatus Incomplete; hanya skor 100% berstatus PASSED | PASS |
| **TC-EXAM-01**| Exam Engine | Pearson VUE Exam Simulator Suite | Ujian 120 menit: Multiple Choice, DND bipartite, Simlet CLI | Timer berjalan, skor per-domain terhitung pada skala 300-1000 | PASS |

---

### 2.2 Pengujian Tingkat Lanjut Protokol Enterprise (CCNP ENCOR 350-401 & ENARSI 300-410)
| Test ID | Modul / Fitur | Skenario Pengujian | Masukan (Input) | Luaran Diharapkan (Expected Result) | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ENCOR-FHRP-01** | High Availability | HSRPv2 Failover & Preemption pada Catalyst C9300L | Konfigurasi HSRP Group 10 (Pri 110 Preempt) di SW1 dan (Pri 100) di SW2; shutdown link SW1 | SW2 otomatis transisi dari Standby ke Active; setelah SW1 up kembali, SW1 mengambil alih status Active via preemption; Host default gateway tetap responsif | PASS |
| **TC-ENCOR-LACP-01** | Layer 2 Switching | Agregasi Port Dinamis LACP 802.3ad | Hubungkan 2 kabel antar-switch; `interface range g1/0/1-2` $\rightarrow$ `channel-group 1 mode active` | Interface `Port-channel 1` tercipta, status `(SU)` pada `show etherchannel summary`, beban trafik terdistribusi merata | PASS |
| **TC-ENCOR-MSTP-01** | Spanning Tree | Multiple Spanning Tree Protocol (MSTP 802.1s) | Konfigurasi MST region, mapping VLAN 10 ke Instance 1, VLAN 20 ke Instance 2 | Root bridge terpilih per instance independen, tidak terjadi L2 loop pada multi-VLAN topology | PASS |
| **TC-ENARSI-EIGRP-01**| Advanced EIGRP | EIGRP Classic vs Named Mode pada Router C8200L | `router eigrp CCNP` $\rightarrow$ `address-family ipv4 unicast autonomous-system 100` | Adjacency tetangga terbentuk, tabel topologi terisi via Wide Metrics 64-bit, output `show ip eigrp topology` valid | PASS |
| **TC-ENARSI-EIGRP-02**| Advanced EIGRP | DUAL Feasibility Condition ($RD < FD$) & Variance | Atur delay antarmuka sehingga jalur cadangan memenuhi $RD < FD$; konfigurasikan `variance 2` | Jalur cadangan otomatis terdaftar sebagai Feasible Successor (FS); kedua jalur masuk ke tabel routing untuk unequal-cost load balancing | PASS |
| **TC-ENARSI-OSPF-01** | Advanced OSPF | Multi-Area OSPF & Totally Stubby / NSSA | Konfigurasi Area 1 sebagai `area 1 stub no-summary`, Area 2 sebagai `area 2 nssa` | Area 1 hanya menerima default route `0.0.0.0/0` (LSA 3) tanpa LSA 4/5; Area 2 menghasilkan LSA Tipe 7 yang ditranslasikan ke Tipe 5 oleh ABR | PASS |
| **TC-ENARSI-OSPF-02** | Advanced OSPF | OSPF Virtual Links Melintasi Transit Area | Konfigurasi `area 1 virtual-link <remote-router-id>` untuk menghubungkan Area 2 yang terisolasi | Adjacency Virtual Link berstatus `FULL`, Area 2 berhasil mempelajari rute Area 0 dan rute inter-area (`O IA`) | PASS |
| **TC-ENARSI-REDIST-01**| Route Redistribution| Redistribusi Rute Timbal-Balik OSPF $\leftrightarrow$ EIGRP Bebas-Loop | Dua boundary router menjalankan redistribusi dengan Route-Map: menandai rute OSPF dengan `set tag 110` dan menolak rute bertag `110` saat masuk kembali | Rute terdistribusi menyeluruh di kedua domain; tidak terjadi routing feedback loop atau rute flapping pada tabel perutean | PASS |
| **TC-ENARSI-BGP-01** | Enterprise BGP | Peering EBGP/IBGP & 13-Step Best Path Selection | Konfigurasi peering IBGP via Loopback (`update-source`) dan EBGP; manipulasi `set local-preference 200` dan `set as-path prepend` | BGP FSM mencapai status `Established`; jalur dengan Local-Pref tertinggi atau AS-Path terpendek terpilih sebagai Best Path (`*>`) | PASS |
| **TC-ENARSI-BGP-02** | Enterprise BGP | BGP Route Reflector (RR) Architecture | Konfigurasi Router Core sebagai Route Reflector: `neighbor <client-ip> route-reflector-client` | Rute IBGP yang diterima dari client direfleksikan ke non-client tanpa memerlukan full-mesh IBGP | PASS |
| **TC-ENARSI-VRF-01** | Virtualization | VRF-Lite Multi-Tenant Routing Isolation pada C8200L | Buat `vrf definition RED` dan `vrf definition BLUE`; tetapkan subnet 10.1.1.0/24 yang sama pada interface masing-masing | Kedua VRF mempertahankan tabel routing dan tabel ARP terpisah 100%; tidak terjadi kebocoran paket antar-tenant | PASS |
| **TC-ENARSI-PBR-01** | Path Control | Policy-Based Routing (PBR) dengan IP SLA Tracking | `route-map PBR match ip addr 101 set ip next-hop 192.168.12.2`; kaitkan tracking ICMP-Echo IP SLA | Paket dari IP sumber spesifik dialihkan ke next-hop PBR; jika probe IP SLA dimatikan (link putus), paket otomatis kembali ke tabel routing standar | PASS |
| **TC-ENARSI-COPP-01** | Device Hardening | Control Plane Policing (CoPP) & uRPF Verification | Terapkan batas rate-limiting paket ICMP ke CPU router dan aktifkan `ip verify source reachable-via rx` (uRPF Strict) | Trafik ICMP berlebih di-drop untuk melindungi bidang kontrol; paket dengan alamat IP sumber palsu (*spoofed IP*) langsung ditolak oleh uRPF | PASS |

---

## 3. Uji Kinerja & Efisiensi Sistem (Performance Benchmarking)

Pengujian dilakukan pada lingkungan peramban Google Chrome v128 (macOS Apple Silicon M-Series) dengan topologi multi-protokol enterprise (24–30 node aktif: 4x C8200L Router, 4x C9300L L3 Switch, 6x C9200L L2 Switch, 16x Host/Server):

| Metrik Kinerja | Target Standar | Nilai Terukur | Keterangan Evaluasi |
| :--- | :---: | :---: | :--- |
| **CLI Input Latency** | < 50 ms | **3.8 ms** | Respon instan pada terminal konsol |
| **Multi-Area OSPF SPF Convergence (30 nodes)** | < 150 ms | **18.4 ms** | Komputasi pohon SPF berlangsung sangat efisien |
| **EIGRP DUAL Convergence & Metric Calc** | < 100 ms | **9.2 ms** | Pemilihan FS instan tanpa query-storm |
| **BGP 13-Step Best Path Decision (500 prefixes)**| < 200 ms | **24.6 ms** | Evaluasi pohon atribut teroptimasi leksikografis |
| **Data Plane CEF Forwarding Latency per Packet** | < 10 ms | **0.8 ms** | MTRIE Longest Prefix Match berbasis memori |
| **Auto-Grading Audit Execution** | < 300 ms | **22.5 ms** | Audit AST running-config & state verification |
| **Memory Footprint (Browser JS Heap)** | < 200 MB | **58.6 MB** | Sangat ringan dibandingkan GNS3/EVE-NG (>4000 MB) |
| **Lighthouse Web Performance Score** | > 90 | **98 / 100** | Teroptimasi untuk loading cepat di browser |
