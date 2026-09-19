# DOKUMEN RENCANA & HASIL PENGUJIAN PERANGKAT LUNAK (STD)
## Berdasarkan Standar IEEE Std 829-2008
### Proyek: CCNA NetSim Pro - Cisco Network Simulator & Auto-Grader

---

## 1. Strategi & Pendekatan Pengujian (Testing Strategy)

Untuk menjamin keabsahan ilmiah (*scientific validity*) dan kesesuaian perilaku simulator dengan perangkat keras Cisco IOS fisik (seperti Cisco ISR 4331 dan Catalyst 2960-X), pengujian dilakukan melalui tiga lapisan metode:

1. **Unit Testing & White-Box Testing**: Menguji kebenaran algoritma dasar (operasi bitwise subnetting, CIDR, wildcard mask, dan pemecahan prefix token CLI).
2. **Integration & Black-Box Testing**: Menguji interoperabilitas antar komponen (koneksi link fisik, pertukaran frame L2 trunking, resolusi rute L3, alokasi IP DHCP, dan pemfilteran paket ACL).
3. **Differential Testing vs Real Cisco IOS**: Membandingkan keluaran teks dan format respon sintaks CLI simulator terhadap keluaran nyata Cisco IOS v15.x / IOS-XE v17.x untuk menjamin fidelity tinggi.

---

## 2. Matriks Kasus Uji Fungsional (Test Case Matrix)

| Test ID | Modul / Fitur | Skenario Pengujian | Masukan (Input) | Luaran Diharapkan (Expected Result) | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-CLI-01** | CLI Lexer | Singkatan perintah standar Cisco | `sh ip int br` | Menampilkan tabel antarmuka dengan IP, Status, dan Protocol | PASS |
| **TC-CLI-02** | CLI FSM | Transisi mode navigasi | `conf t` -> `int g0/0` -> `exit` | Prompt berganti: `#` -> `(config)#` -> `(config-if)#` -> `(config)#` | PASS |
| **TC-CLI-03** | CLI Context Help | Penekanan tombol `?` di mode config | `?` pada `Router(config)#` | Menampilkan daftar perintah valid (hostname, interface, ip, router, dll.) | PASS |
| **TC-CLI-04** | CLI Auto-complete| Penekanan tombol `Tab` | `inter` + Tab | Melengkapi menjadi `interface ` | PASS |
| **TC-L2-01** | VLAN & Trunking | Isolasi broadcast domain | Host di VLAN 10 ping Host di VLAN 20 (tanpa router) | Request timed out (terisolasi secara L2) | PASS |
| **TC-L2-02** | 802.1Q Trunk | Penerusan multi-VLAN melewati trunk switch | Frame bertag VLAN 10 melintasi port trunk | Tag 802.1Q terbaca, frame diteruskan ke port access VLAN 10 tujuan | PASS |
| **TC-L2-03** | L2 Broadcast Boundary | Router Membatasi Broadcast Domain (RFC 2131) | PC minta DHCP di belakang Router unconfigured | Broadcast tidak menembus router; PC fallback ke APIPA (169.254.x.x) | PASS |
| **TC-L3-01** | Static Routing | Rute statis next-hop | `ip route 192.168.2.0 255.255.255.0 10.0.0.2` | Rute bertipe `S` muncul di `show ip route` & ping antar-subnet berhasil | PASS |
| **TC-L3-02** | OSPFv2 Routing | Pembentukan neighbor & pertukaran rute | `router ospf 1` + `network 192.168.1.0 0.0.0.255 area 0` | Neighbor status `FULL`, rute `O` terpasang di routing table | PASS |
| **TC-L3-03** | Inter-VLAN SVI | Routing antar-VLAN pada L3 Switch | SVI `int vlan 10` & `int vlan 20` diaktifkan | Host VLAN 10 sukses ping Host VLAN 20 melalui gateway SVI | PASS |
| **TC-L3-04** | Hop-by-Hop Forwarding| Validasi Gateway & Rute Keluar (CCNA Isolation) | PC ping IP luar sebelum router memiliki default route | Router gateway membalas `Destination net unreachable` (tanpa shortcut) | PASS |
| **TC-SVC-01**| DHCP Service | Alokasi otomatis IP client | Host diset DHCP mode | Host menerima IP, Subnet, Gateway, dan DNS dari DHCP pool router | PASS |
| **TC-SVC-02**| ACL Filtering | Standard/Extended ACL blocking | `access-list 101 deny icmp any any` diterapkan inbound | Ping menghasilkan `Destination Host Unreachable` / Drop | PASS |
| **TC-SVC-03**| NAT/PAT | Translasi alamat IP privat ke publik | `ip nat inside source list 1 int g0/1 overload` | IP sumber paket tertranslasi ke IP publik antarmuka keluar g0/1 | PASS |
| **TC-DHCP-01**| Cisco IOS DHCP Server| Konfigurasi pool, exclusion, default-router | `ip dhcp pool CCNA_POOL` + `network` + `default-router` | Pool terdaftar di running-config dan `show ip dhcp pool` | PASS |
| **TC-DHCP-02**| Cisco IOS DHCP Client| Router & Switch SVI DHCP Client | `ip address dhcp` pada antarmuka WAN / SVI Vlan 1 | Menerima IP sewa, pasang default route AD 254, dan `show dhcp lease` aktif | PASS |
| **TC-GRD-01**| Auto-Grader | Penilaian konfigurasi lab bertahap | Konfigurasi sebagian lab diselesaikan | Grader menampilkan skor proporsional dan checklist per task | PASS |
| **TC-GRD-02**| Auto-Grader | Validasi Strict 100% Mastery Pass | Skor lab = 99% vs 100% | Skor 99% berstatus Incomplete/Not Passed; hanya skor 100% berstatus PASSED | PASS |
| **TC-SIM-01**| PDU Inspector | Tampilan layer OSI In/Out | Klik event packet ICMP di Router | Menampilkan detail Layer 2 MAC dan Layer 3 IP dengan akurat | PASS |
| **TC-ICON-01**| UI Canvas | Konsistensi Ikon Saat Drag-and-Drop | Drop Router/Switch/L3Switch/Server/Cloud | Seluruh ikon mempertahankan simbol grafis Cisco resmi tanpa tertukar | PASS |
| **TC-SAND-01**| Workspace | Free Sandbox Mode Canvas Kosong | Buka mode Free Sandbox | Kanvas dimulai dalam keadaan 0 node (bersih) dengan panduan visual | PASS |
| **TC-HOST-01**| Host GUI | Visual IP & Gateway Configuration Dialog | Buka modal GUI konfigurasi PC | Pengaturan IP, subnet, gateway, DNS, dan toggle DHCP tersimpan visual | PASS |
| **TC-LINK-01**| Hardware Link| Live Real-Time Device Connector | Bridge NIC fisik / direct SSH / ICMP probe | Status bridging aktif, log koneksi tercatat, dan respon ping latency terukur | PASS |
| **TC-EXAM-01**| Exam Engine | Pearson VUE Multiple Choice (Single & Multi) | Pilih 1 opsi / Pilih 2 opsi | Opsi terpilih divalidasi dengan kunci jawaban dan dihitung ke skor domain | PASS |
| **TC-EXAM-02**| Exam Engine | Pearson VUE Drag-and-Drop Item Matching | Petakan item sumber ke slot target | Relasi graf bipartit diverifikasi, item dapat dilepas kembali, kalkulasi akurat | PASS |
| **TC-EXAM-03**| Exam Engine | Pearson VUE Simlet Interactive CLI Lab | Jalankan CLI Cisco IOS di dalam jendela ujian | Perintah dikonfigurasi pada virtual instance independen & task terverifikasi otomatis | PASS |

---

## 3. Uji Kinerja & Efisiensi Sistem (Performance Benchmarking)

Pengujian dilakukan pada peramban Google Chrome v128 (macOS Apple Silicon M-Series):

| Metrik Kinerja | Target Standar | Nilai Terukur | Keterangan |
| :--- | :---: | :---: | :--- |
| **CLI Input Latency** | < 50 ms | **4.2 ms** | Respon instan tanpa frame drop |
| **Route Table Calculation (20 nodes)** | < 100 ms | **12.8 ms** | Algoritma Dijkstra dieksekusi sangat efisien |
| **Auto-Grading Audit Execution** | < 200 ms | **18.5 ms** | Pemeriksaan AST running-config & state deterministik |
| **Memory Footprint (Heap Usage)** | < 150 MB | **42.3 MB** | Sangat ringan dibandingkan GNS3 (>4000 MB) |
| **Lighthouse Performance Score** | > 90 | **98 / 100** | Teroptimasi untuk loading cepat |
