# FORMULASI MATEMATIKA & SPESIFIKASI ALGORITMA SISTEM
## Proyek: CCNA NetSim Pro - Cisco Network Simulator & Auto-Grader

Dokumen ini menyajikan model matematis formal dan spesifikasi algoritma yang digunakan dalam simulasi jaringan L2/L3, parser CLI Cisco IOS, serta mesin evaluasi lab otomatis untuk keperluan sitasi dan validasi ilmiah.

---

## 1. Pemodelan Matematis Pengalamatan & Subnetting IPv4

### 1.1 Representasi Vektor Bit Biner
Alamat IPv4 direpresentasikan sebagai bilangan bulat tidak bertanda 32-bit:
$$\text{IP} \in \mathbb{U}_{32} = [0, 2^{32}-1]$$

Konversi dari notasi desimal bertitik (*dotted decimal notation*) $D = (d_1, d_2, d_3, d_4)$ di mana $d_i \in [0, 255]$ ke representasi integer 32-bit dihitung melalui pergeseran bit (*bitwise shift*):
$$\text{IP}_{int} = (d_1 \ll 24) \lor (d_2 \ll 16) \lor (d_3 \ll 8) \lor d_4$$

### 1.2 Formulasi Subnet Mask & Network ID
Diberikan panjang prefix CIDR $p \in [0, 32]$, *Subnet Mask* $M(p)$ didefinisikan sebagai:
$$M(p) = \begin{cases} 
0 & \text{jika } p = 0 \\
(\sim 0) \ll (32 - p) & \text{jika } 1 \le p \le 32 
\end{cases}$$

Alamat Jaringan (*Network Address*) $N$ dan Alamat Broadcast $B$ dihitung secara bitwise:
$$N = \text{IP}_{int} \land M(p)$$
$$B = N \lor (\sim M(p))$$

Jumlah host yang dapat dialokasikan (*usable host capacity*) $H(p)$:
$$H(p) = \begin{cases}
2^{32-p} - 2 & \text{jika } p \le 30 \\
2 & \text{jika } p = 31 \text{ (RFC 3021 point-to-point)} \\
1 & \text{jika } p = 32 \text{ (Host route)}
\end{cases}$$

### 1.3 Formulasi Wildcard Mask untuk Access Control List (ACL)
Dalam Cisco IOS, Access Control List dan OSPF network statements menggunakan *Wildcard Mask* $W(p)$:
$$W(p) = \sim M(p) = 255.255.255.255 - M(p)$$
Pengujian kecocokan paket terhadap aturan ACL dengan pola $(N_{acl}, W_{acl})$ pada IP paket $P$:
$$\text{Match}(P, N_{acl}, W_{acl}) \iff (P \land \sim W_{acl}) == (N_{acl} \land \sim W_{acl})$$

---

## 2. Algoritma Evaluasi Rute (Longest Prefix Match)

Ketika router menerima paket dengan tujuan alamat IP $D$, router mencari rute terbaik (*best route*) dari tabel routing $\mathcal{R}$ yang terdiri dari himpunan entri rute $r_i = (N_i, M_i, \text{AD}_i, \text{Metric}_i, \text{NextHop}_i)$:

$$\mathcal{C}(D) = \{ r_i \in \mathcal{R} \mid (D \land M_i) = N_i \}$$

Rute terpilih $r^*$ ditentukan berdasarkan aturan leksikografis standar Cisco:
1. **Longest Prefix Match (Prefix Length $p$ terbesar)**:
   $$\mathcal{C}_{max} = \arg\max_{r_i \in \mathcal{C}(D)} \text{popcount}(M_i)$$
2. **Lowest Administrative Distance (AD)** jika prefix length sama:
   $$\mathcal{C}_{AD} = \arg\min_{r_i \in \mathcal{C}_{max}} \text{AD}_i$$
3. **Lowest Metric** jika AD sama:
   $$r^* = \arg\min_{r_i \in \mathcal{C}_{AD}} \text{Metric}_i$$

Nilai Administrative Distance bawaan Cisco:
- Connected: 0
- Static Route: 1
- OSPF: 110
- RIP: 120

---

## 3. Algoritma Perhitungan Jalur Terpendek OSPFv2 (Dijkstra SPF)

Untuk domain routing OSPF, topologi dimodelkan sebagai graf berarah terbobot $G = (V, E, w)$, di mana:
- $V$ adalah himpunan router dan subnet jaringan.
- $E$ adalah himpunan link antar router/antarmuka.
- $w(u, v)$ adalah cost metrik OSPF antarmuka:
  $$w(u, v) = \left\lfloor \frac{\text{Reference Bandwidth}}{\text{Interface Bandwidth}} \right\rfloor = \left\lfloor \frac{10^8 \text{ bps}}{\text{Bandwidth}(u,v)} \right\rfloor$$

```
Algoritma Dijkstra-OSPF(G, root):
1. Inisialisasi dist[v] = ∞ untuk setiap v ∈ V, dist[root] = 0
2. Inisialisasi next_hop[v] = NIL untuk setiap v ∈ V
3. PriorityQueue Q = V
4. While Q tidak kosong:
5.    u = Extract-Min(Q)
6.    For each neighbor v dari u:
7.       alt = dist[u] + w(u, v)
8.       If alt < dist[v]:
9.          dist[v] = alt
10.         If u == root:
11.            next_hop[v] = v
12.         Else:
13.            next_hop[v] = next_hop[u]
14.         Decrease-Key(Q, v, alt)
15. Return dist, next_hop
```

---

## 4. Algoritma Parser & Lexer Cisco IOS CLI (Trie-Based Matcher)

Untuk mendukung singkatan perintah (misal `sh ip ro` dipetakan ke `show ip route`), sistem menggunakan struktur data *Prefix Tree (Trie)* atau *Greedy Unique Prefix Resolution*.

Diberikan input token $t$ dan himpunan kata kunci valid dalam mode aktif $K = \{k_1, k_2, \dots, k_m\}$:
$$\text{Candidates}(t, K) = \{ k \in K \mid k \text{ diawali oleh } t \}$$

Hasil resolusi token:
$$\text{Resolve}(t, K) = \begin{cases}
k & \text{jika } |\text{Candidates}(t, K)| = 1 \text{ (Singkatan Valid)} \\
\text{Ambiguous} & \text{jika } |\text{Candidates}(t, K)| > 1 \text{ (\% Ambiguous command)} \\
\text{Invalid} & \text{jika } |\text{Candidates}(t, K)| = 0 \text{ (\% Invalid input detected)}
\end{cases}$$

---

## 5. Algoritma Evaluasi & Penilaian Otomatis (Lab Auto-Grader)

Sistem evaluasi lab memodelkan setiap skenario laboratorium sebagai himpunan berbobot dari kriteria verifikasi $C = \{c_1, c_2, \dots, c_n\}$ dengan bobot $w_i \in \mathbb{R}^+$ di mana $\sum_{i=1}^n w_i = 100\%$.

Setiap kriteria $c_i$ memiliki fungsi predikat biner evaluasi:
$$f_i: \text{SystemState} \to \{0, 1\}$$

Fungsi predikat diklasifikasikan ke dalam 3 jenis evaluasi:
1. **Config Syntax Matching ($f_{cfg}$)**: Memeriksa keberadaan parameter konfigurasi pada AST running-config (misal: IP host, subnet mask, OSPF network mask).
2. **Operational State Matching ($f_{ops}$)**: Memeriksa status operasional objek sistem (misal: status line protocol interface bernilai `UP`, port security berstatus `SecureUp`).
3. **End-to-End Functional Ping Test ($f_{ping}$)**: Memverifikasi aliran paket data aktual antara host asal dan host tujuan melintasi seluruh hop perantara.

Skor Akhir Mahasiswa $S$ dihitung melalui penjumlahan terbobot:
$$S = \sum_{i=1}^n w_i \cdot f_i(\text{SystemState})$$
Sesuai prinsip pedagogis *Strict Mastery Learning Criteria*, taraf kelulusan lab didefinisikan:
$$\text{Status} = \begin{cases}
\text{PASS (LULUS)} & \text{jika } S = 100\% \\
\text{INCOMPLETE / NOT PASSED} & \text{jika } S < 100\%
\end{cases}$$
Beserta daftar feedback diagnostik $\{ \text{Diagnostic}_i \mid f_i = 0 \}$ untuk memandu proses refleksi belajar.

---

## 6. Formulasi Pencocokan Graf Bipartit Soal Drag-and-Drop Pearson VUE

Soal Drag-and-Drop dimodelkan sebagai pemetaan relasi graf bipartit $G = (U, V, E)$ antara himpunan konsep sumber (*Draggable Items*) $U = \{u_1, u_2, \dots, u_m\}$ dan himpunan target klasifikasi (*Target Drop Zones*) $V = \{v_1, v_2, \dots, v_k\}$.

Diberikan relasi pasangan kunci jawaban sah $E^* \subset U \times V$, dan himpunan pasangan yang ditempatkan oleh peserta ujian $E_{cand} \subset U \times V$:

1. **Precision ($P$) & Recall ($R$) Pencocokan**:
   $$P = \frac{|E_{cand} \cap E^*|}{|E_{cand}|}, \quad R = \frac{|E_{cand} \cap E^*|}{|E^*|}$$

2. **Evaluasi Diskrit Biner ($f_{dnd}$)**:
   $$f_{dnd}(E_{cand}, E^*) = \begin{cases} 
   1 & \text{jika } E_{cand} = E^* \quad (\text{seluruh slot cocok sempurna}) \\
   0 & \text{jika } E_{cand} \ne E^* 
   \end{cases}$$

---

## 7. Model Evaluasi Simlet & Skala Skor Standar Pearson VUE (300–1000)

Pada ujian sertifikasi resmi Cisco CCNA 200-301 di platform Pearson VUE, skor mentah (*raw score*) ditransformasikan ke skala terstandardisasi interval $[300, 1000]$.

### 7.1 Evaluasi Soal Simlet (Performance-Based Interactive CLI)
Untuk setiap butir soal Simlet berbobot $W_{sim}$, peserta diberikan $K$ tugas konfigurasi mikro $\{t_1, t_2, \dots, t_K\}$. Setiap tugas diaudit langsung terhadap state virtual device:
$$g(t_k) \in \{0, 1\}, \quad \text{Skor Simlet} = \frac{1}{K} \sum_{k=1}^K g(t_k)$$

### 7.2 Transformasi Skor Terstandardisasi Pearson VUE
Diberikan total $N$ butir soal ujian dengan bobot domain $w_d$ untuk domain $d \in \{1, \dots, 6\}$ di mana $\sum_{d=1}^6 w_d = 1.0$:

1. **Rasio Skor Mentah Terbobot ($\Theta$)**:
   $$\Theta = \sum_{d=1}^6 w_d \cdot \left( \frac{\sum_{q \in Q_d} \text{Score}(q)}{|Q_d|} \right), \quad \Theta \in [0, 1]$$

2. **Transformasi Skor Skala Pearson VUE ($S_{VUE}$)**:
   $$S_{VUE} = 300 + \lfloor 700 \times \Theta \rfloor$$

3. **Status Kelulusan Ujian**:
   - Standar Pearson VUE Klasik: Lulus jika $S_{VUE} \ge 825$ ($\Theta \ge 0.75$).
   - Standar Penguasaan Penuh (*Full Mastery Criteria*): Lulus jika $\Theta = 1.0$ ($S_{VUE} = 1000$).

---

## 8. Pemodelan Matematis Batas Broadcast Domain Layer 2 & Penelusuran Rute Hop-by-Hop (RFC 2131, RFC 3927 & CCNA L2/L3 Isolation)

Untuk menjamin kepatuhan simulator terhadap prinsip fisik Cisco CCNA, topologi jaringan dimodelkan sebagai graf multi-layer berbobot $G = (V, E_{L2}, E_{L3})$:

### 8.1 Pemisahan Domain Broadcast Layer 2 ($E_{L2}$)
Diberikan himpunan simpul perangkat $V = V_{\text{Host}} \cup V_{\text{Switch}} \cup V_{\text{Router}} \cup V_{\text{Cloud}}$.
Sisi Layer 2 $E_{L2}$ hanya menghubungkan port switch dan port host/router lokal dalam VLAN yang sama. Antarmuka router $r \in V_{\text{Router}}$ membatasi penyebaran frame broadcast secara deterministik (Router drops L2 broadcast):

$$\text{BroadcastDomain}(u) = \{ v \in V \mid \exists \text{ path } u \rightsquigarrow v \text{ via } E_{L2} \setminus \text{InternalRouterCrossing} \}$$

1. **Alokasi DHCP (RFC 2131)**:
   Paket $\text{DHCPDISCOVER}$ dikirimkan dengan tujuan MAC `FF:FF:FF:FF:FF:FF` dan IP `255.255.255.255`. Permohonan sewa IP hanya berhasil jika terdapat entitas server DHCP $s \in \text{BroadcastDomain}(u)$ dengan subnet pool yang sesuai:
   $$\text{DHCP\_Lease}(u) = \begin{cases}
   (IP_{pool}, M_{pool}, GW, DNS) & \text{jika } \exists s \in \text{BroadcastDomain}(u) \land \text{PoolMatch}(s, u) \\
   \text{APIPA } (169.254.x.y, 255.255.0.0, 0.0.0.0) & \text{jika } \text{BroadcastDomain}(u) \cap S_{\text{DHCP}} = \emptyset
   \end{cases}$$

2. **Isolasi Alamat APIPA (RFC 3927)**:
   Jika tidak ada server DHCP aktif di segmen broadcast lokal (misal PC terhubung ke port router kosong tanpa DHCP pool), host mengonfigurasi alamat lokal-link APIPA $169.254.x.y/16$ dengan gateway `0.0.0.0`, mencegah kebocoran IP dari bridge jaringan eksternal.

### 8.2 Forwarding Hop-by-Hop & Resolusi Rekursif Next-Hop ($E_{L3}$)
Untuk paket IP dengan sumber $S$ dan tujuan $D$:
1. **Pemeriksaan Subnet Lokal**:
   $$\text{IsLocal}(S, D) \iff (S \land M_S) = (D \land M_S)$$
   Jika $\text{IsLocal}$ bernilai benar, resolusi diselesaikan secara lokal via ARP.
2. **Evaluasi Default Gateway**:
   Jika $\neg \text{IsLocal}(S, D)$, paket wajib diarahkan ke $\text{DefaultGateway}(S) = GW$. Jika $(S \land M_S) \ne (GW \land M_S)$, paket di-drop dengan status `Destination Host Unreachable`.
3. **Resolusi Rekursif Tabel Routing pada Gateway**:
   Router gateway mencari entri rute terbaik $r^* = \text{LongestPrefixMatch}(D)$.
   - Jika rute $r^*$ tidak ditemukan $\to$ Router mengirimkan ICMP Type 3 Code 0 (`Destination Net Unreachable`).
   - Jika rute $r^*$ memiliki $\text{NextHop}$ tanpa antarmuka keluar eksplisit, dilakukan resolusi rekursif:
     $$\text{ExitInterface}(r^*) = \arg_{ifc \in \text{Interfaces}(GW)} \{(ifc.IP \land ifc.Mask) = (r^*.\text{NextHop} \land ifc.Mask)\}$$
   - Paket diteruskan ke segmen antarmuka keluar hanya jika $\text{Status}(ifc) = \text{UP}$ dan $\neg ifc.\text{isShutdown}$.

