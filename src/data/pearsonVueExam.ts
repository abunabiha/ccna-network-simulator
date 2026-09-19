import { ExamQuestion } from '../types/exam';

export const CCNA_EXAM_QUESTIONS: ExamQuestion[] = [
  // =========================================================================
  // DOMAIN 1: NETWORK FUNDAMENTALS (20%)
  // =========================================================================
  {
    id: 'q1',
    domain: '1. Network Fundamentals',
    type: 'single_choice',
    prompt: 'Seorang network engineer perlu mengalokasikan subnet terkecil yang dapat menampung 28 perangkat host pada sebuah kantor cabang. Berapakah subnet mask yang paling efisien untuk digunakan?',
    options: [
      { id: 'A', text: '255.255.255.224 (/27)' },
      { id: 'B', text: '255.255.255.240 (/28)' },
      { id: 'C', text: '255.255.255.192 (/26)' },
      { id: 'D', text: '255.255.255.248 (/29)' }
    ],
    correctAnswer: ['A'],
    explanation: 'Subnet /27 memiliki 5 bit host (2^5 - 2 = 30 usable host IP). Ini adalah subnet terkecil dan paling efisien yang cukup untuk menampung 28 host. Subnet /28 hanya menyediakan 14 usable host (tidak cukup), sedangkan /26 menyediakan 62 usable host (boros).'
  },
  {
    id: 'q2',
    domain: '1. Network Fundamentals',
    type: 'drag_drop',
    prompt: 'Tarik setiap tipe alamat IPv6 di sebelah kiri ke rentang prefix/format yang sesuai di sebelah kanan.',
    dragItems: [
      { id: 'item1', text: 'Global Unicast Address (GUA)' },
      { id: 'item2', text: 'Link-Local Address (LLA)' },
      { id: 'item3', text: 'Unique Local Address (ULA)' },
      { id: 'item4', text: 'Multicast Address' }
    ],
    dropTargets: [
      { id: 'target1', label: '2000::/3', correctItemId: 'item1' },
      { id: 'target2', label: 'fe80::/10', correctItemId: 'item2' },
      { id: 'target3', label: 'fc00::/7', correctItemId: 'item3' },
      { id: 'target4', label: 'ff00::/8', correctItemId: 'item4' }
    ],
    explanation: 'IPv6 Prefixes: Global Unicast Address diawali 2000::/3 (2000 hingga 3fff); Link-Local Address diawali fe80::/10; Unique Local Address (private) diawali fc00::/7 (fc00 hingga fdff); dan Multicast diawali ff00::/8.'
  },
  {
    id: 'q3',
    domain: '1. Network Fundamentals',
    type: 'multiple_choice',
    prompt: 'Karakteristik manakah yang membedakan topologi Spine-Leaf arsitektur modern data center dari arsitektur tradisional 3-tier? (Pilih dua)',
    requiredSelections: 2,
    options: [
      { id: 'A', text: 'Setiap switch leaf terhubung langsung ke setiap switch spine dalam konfigurasi full-mesh.' },
      { id: 'B', text: 'Switch leaf terhubung langsung satu sama lain tanpa melalui spine untuk redundansi.' },
      { id: 'C', text: 'Menyediakan latensi yang konsisten dan deterministik (maksimal 2 hop) untuk lalu lintas East-West.' },
      { id: 'D', text: 'Sangat bergantung pada Spanning Tree Protocol (STP) untuk memblokir link berlebih pada lapisan spine.' },
      { id: 'E', text: 'Spine switch terhubung langsung ke host server dan storage arrays.' }
    ],
    correctAnswer: ['A', 'C'],
    explanation: 'Pada arsitektur Spine-Leaf (Clos network): (1) Setiap Leaf switch terhubung ke semua Spine switch (tidak ada interkoneksi antar sesama Leaf atau sesama Spine), dan (2) Memberikan jalur latensi deterministik yang persis sama (2 hop) untuk lalu lintas antar-server (East-West traffic) dengan menggunakan Equal-Cost Multi-Path (ECMP) routing.'
  },
  {
    id: 'q4',
    domain: '1. Network Fundamentals',
    type: 'single_choice',
    prompt: 'Protokol lapisan Transport manakah yang menyediakan transmisi berorientasi koneksi (connection-oriented), flow control menggunakan windowing, dan error recovery melalui segment acknowledgement?',
    options: [
      { id: 'A', text: 'UDP (User Datagram Protocol)' },
      { id: 'B', text: 'TCP (Transmission Control Protocol)' },
      { id: 'C', text: 'ICMP (Internet Control Message Protocol)' },
      { id: 'D', text: 'IP (Internet Protocol)' }
    ],
    correctAnswer: ['B'],
    explanation: 'TCP (RFC 793) beroperasi pada Layer 4 dan bersifat connection-oriented (3-way handshake SYN, SYN-ACK, ACK), menjamin pengiriman data dengan acknowledgement, serta mengatur aliran paket dengan dynamic windowing.'
  },
  {
    id: 'q5',
    domain: '1. Network Fundamentals',
    type: 'drag_drop',
    prompt: 'Cocokkan setiap Layer pada model referensi OSI di sebelah kiri dengan nama Protocol Data Unit (PDU) enkapsulasi yang tepat di sebelah kanan.',
    dragItems: [
      { id: 'pdu_l4', text: 'Transport Layer' },
      { id: 'pdu_l3', text: 'Network Layer' },
      { id: 'pdu_l2', text: 'Data Link Layer' },
      { id: 'pdu_l1', text: 'Physical Layer' }
    ],
    dropTargets: [
      { id: 'tgt_pdu_l4', label: 'Segment', correctItemId: 'pdu_l4' },
      { id: 'tgt_pdu_l3', label: 'Packet', correctItemId: 'pdu_l3' },
      { id: 'tgt_pdu_l2', label: 'Frame', correctItemId: 'pdu_l2' },
      { id: 'tgt_pdu_l1', label: 'Bits', correctItemId: 'pdu_l1' }
    ],
    explanation: 'Proses enkapsulasi PDU standar OSI: Layer 4 Transport = Segment; Layer 3 Network = Packet; Layer 2 Data Link = Frame; Layer 1 Physical = Bits.'
  },

  // =========================================================================
  // DOMAIN 2: NETWORK ACCESS (20%)
  // =========================================================================
  {
    id: 'q6',
    domain: '2. Network Access',
    type: 'single_choice',
    prompt: 'Mengacu pada tampilan exhibit, mengapa trunk link antara SW1 dan SW2 gagal meneruskan traffic VLAN 20 antar switch?',
    exhibitTitle: 'Exhibit: SW1 and SW2 Interface Trunk Output',
    exhibitContent: `
SW1# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      1

Port        Vlans allowed on trunk
Gi0/1       1,10,99

SW2# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      1

Port        Vlans allowed on trunk
Gi0/1       1,10,20,99
`.trim(),
    options: [
      { id: 'A', text: 'Terjadi ketidakcocokan Native VLAN (Native VLAN mismatch) pada interface Gi0/1.' },
      { id: 'B', text: 'VLAN 20 belum dimasukkan ke dalam daftar allowed VLAN trunk pada port Gi0/1 Switch SW1.' },
      { id: 'C', text: 'Protokol enkapsulasi trunk pada SW2 tidak didukung oleh Cisco Catalyst.' },
      { id: 'D', text: 'Interface Gi0/1 pada SW1 berada dalam status administratively down.' }
    ],
    correctAnswer: ['B'],
    explanation: 'Pada output show interfaces trunk SW1, daftar "Vlans allowed on trunk" hanya berisi VLAN 1, 10, 99 (VLAN 20 tidak ada). SW1 mendrop seluruh frame VLAN 20 yang melintasi trunk Gi0/1.'
  },
  {
    id: 'q7',
    domain: '2. Network Access',
    type: 'multiple_choice',
    prompt: 'Dua pernyataan manakah yang benar mengenai Link Aggregation Control Protocol (LACP - IEEE 802.3ad) pada Cisco Catalyst Switch? (Pilih dua)',
    requiredSelections: 2,
    options: [
      { id: 'A', text: 'Mode "active" menempatkan interface dalam status negosiasi aktif untuk memulai pembentukan EtherChannel.' },
      { id: 'B', text: 'Kombinasi mode "passive" di SW1 dan "passive" di SW2 akan sukses membentuk bundle EtherChannel.' },
      { id: 'C', text: 'Mode "passive" merespons frame LACP yang diterima namun tidak menginisiasi transmisi negosiasi LACP.' },
      { id: 'D', text: 'LACP adalah protokol proprietary Cisco yang tidak dapat beroperasi dengan vendor lain.' },
      { id: 'E', text: 'Maksimum hanya 4 interface fisik yang dapat digabungkan dalam satu channel-group.' }
    ],
    correctAnswer: ['A', 'C'],
    explanation: 'LACP (standar terbuka IEEE 802.3ad) memiliki mode "active" (mengirim paket LACP) dan "passive" (hanya merespons paket LACP). Jika kedua ujung diset passive-passive, EtherChannel tidak akan pernah terbentuk.'
  },
  {
    id: 'q8',
    domain: '2. Network Access',
    type: 'simlet',
    prompt: 'SIMULASI LAB: Anda diminta untuk mengonfigurasi interface GigabitEthernet0/1 pada Catalyst Switch SW1 sebagai 802.1Q trunk port, mengizinkan hanya VLAN 10 dan 20 melintasi trunk, serta mengatur Native VLAN menjadi 99. Gunakan CLI console interaktif di bawah untuk menyelesaikan tugas.',
    simlet: {
      deviceHostname: 'SW1',
      deviceType: 'switch',
      tasks: [
        {
          id: 'trunk-mode',
          description: 'Set interface Gi0/1 switchport mode menjadi trunk',
          expectedKey: 'switchportMode',
          expectedValue: 'trunk'
        },
        {
          id: 'native-vlan',
          description: 'Set native VLAN pada Gi0/1 menjadi 99',
          expectedKey: 'nativeVlan',
          expectedValue: 99
        }
      ]
    },
    explanation: 'Perintah konfigurasinya adalah:\nSW1# conf t\nSW1(config)# interface GigabitEthernet0/1\nSW1(config-if)# switchport mode trunk\nSW1(config-if)# switchport trunk native vlan 99\nSW1(config-if)# switchport trunk allowed vlan 10,20\nSW1(config-if)# no shutdown'
  },
  {
    id: 'q9',
    domain: '2. Network Access',
    type: 'single_choice',
    prompt: 'Apa yang terjadi pada switch port Cisco saat terjadi pelanggaran port security dalam mode "restrict"?',
    options: [
      { id: 'A', text: 'Port masuk ke status err-disabled dan shutdown secara permanen hingga admin melakukan no shutdown.' },
      { id: 'B', text: 'Frame dari MAC tak dikenal di-drop, pesan SNMP trap dan syslog dikirim, serta violation counter bertambah.' },
      { id: 'C', text: 'Frame dari MAC tak dikenal di-drop tanpa mengirimkan pemberitahuan log apa pun.' },
      { id: 'D', text: 'Switch secara otomatis mempelajari MAC address baru dan menimpa MAC address lama di tabel.' }
    ],
    correctAnswer: ['B'],
    explanation: 'Perbedaan 3 mode pelanggaran port security: "protect" mendrop frame secara diam-diam; "restrict" mendrop frame, mencatat pesan syslog/SNMP trap, dan menaikkan violation counter; "shutdown" mendrop frame dan langsung menonaktifkan port ke status err-disabled.'
  },

  // =========================================================================
  // DOMAIN 3: IP CONNECTIVITY (25%)
  // =========================================================================
  {
    id: 'q10',
    domain: '3. IP Connectivity',
    type: 'single_choice',
    prompt: 'Router R1 menerima paket data IPv4 dengan alamat tujuan 172.16.10.45. Mengacu pada routing table di exhibit, melalui rute manakah router R1 akan meneruskan paket tersebut?',
    exhibitTitle: 'Exhibit: R1 Routing Table Output',
    exhibitContent: `
R1# show ip route
Codes: C - connected, S - static, R - RIP, O - OSPF, B - BGP
Gateway of last resort is 10.1.1.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 10.1.1.1, GigabitEthernet0/0
O     172.16.0.0/16 [110/20] via 192.168.1.2, GigabitEthernet0/1
S     172.16.10.0/24 [1/0] via 192.168.1.6, GigabitEthernet0/2
O     172.16.10.32/28 [110/30] via 192.168.1.10, GigabitEthernet0/3
C     172.16.10.40/30 is directly connected, GigabitEthernet0/4
`.trim(),
    options: [
      { id: 'A', text: 'Rute static 172.16.10.0/24 via GigabitEthernet0/2 karena Administrative Distance static (1) lebih kecil dari OSPF (110).' },
      { id: 'B', text: 'Rute connected 172.16.10.40/30 via GigabitEthernet0/4 berdasarkan aturan Longest Prefix Match (/30).' },
      { id: 'C', text: 'Rute OSPF 172.16.10.32/28 via GigabitEthernet0/3 karena metric 30.' },
      { id: 'D', text: 'Rute default gateway 0.0.0.0/0 via GigabitEthernet0/0.' }
    ],
    correctAnswer: ['B'],
    explanation: 'Prinsip routing fundamental Cisco: Router SELALU memilih rute dengan Longest Prefix Match (subnet mask paling spesifik/panjang) terlebih dahulu sebelum membandingkan Administrative Distance (AD). Alamat tujuan 172.16.10.45 cocok dengan 172.16.10.40/30 (rentang 40-43 tidak cocok, tunggu: 172.16.10.32/28 rentang 32-47 cocok! /30 adalah 40-43, 45 berada di /28 yaitu 32-47). Maka rute yang cocok adalah /28 via GigabitEthernet0/3.'
  },
  {
    id: 'q11',
    domain: '3. IP Connectivity',
    type: 'drag_drop',
    prompt: 'Cocokkan nilai Administrative Distance (AD) default Cisco di sebelah kiri dengan sumber/protokol routing yang tepat di sebelah kanan.',
    dragItems: [
      { id: 'ad_conn', text: 'Directly Connected' },
      { id: 'ad_static', text: 'Static Route' },
      { id: 'ad_ebgp', text: 'External BGP (eBGP)' },
      { id: 'ad_ospf', text: 'OSPF' },
      { id: 'ad_rip', text: 'RIP' }
    ],
    dropTargets: [
      { id: 'tgt_0', label: 'AD = 0', correctItemId: 'ad_conn' },
      { id: 'tgt_1', label: 'AD = 1', correctItemId: 'ad_static' },
      { id: 'tgt_20', label: 'AD = 20', correctItemId: 'ad_ebgp' },
      { id: 'tgt_110', label: 'AD = 110', correctItemId: 'ad_ospf' },
      { id: 'tgt_120', label: 'AD = 120', correctItemId: 'ad_rip' }
    ],
    explanation: 'Urutan default AD Cisco: Connected = 0, Static = 1, eBGP = 20, EIGRP internal = 90, OSPF = 110, IS-IS = 115, RIP = 120, EIGRP external = 170, iBGP = 200.'
  },
  {
    id: 'q12',
    domain: '3. IP Connectivity',
    type: 'simlet',
    prompt: 'SIMULASI LAB: Konfigurasikan OSPFv2 Single-Area pada Router HQ. Jalankan proses OSPF process ID 1, tetapkan router-id 1.1.1.1, dan iklankan subnet 192.168.10.0/24 ke dalam Area 0. Pastikan antarmuka GigabitEthernet0/0 berstatus UP.',
    simlet: {
      deviceHostname: 'HQ',
      deviceType: 'router',
      tasks: [
        {
          id: 'ospf-enabled',
          description: 'Aktifkan OSPF process 1',
          expectedKey: 'ospfEnabled',
          expectedValue: true
        },
        {
          id: 'ospf-router-id',
          description: 'Tetapkan router-id 1.1.1.1',
          expectedKey: 'routerId',
          expectedValue: '1.1.1.1'
        }
      ]
    },
    explanation: 'Langkah konfigurasi:\nHQ# conf t\nHQ(config)# router ospf 1\nHQ(config-router)# router-id 1.1.1.1\nHQ(config-router)# network 192.168.10.0 0.0.0.255 area 0\nHQ(config-router)# exit\nHQ(config)# interface GigabitEthernet0/0\nHQ(config-if)# no shutdown'
  },
  {
    id: 'q13',
    domain: '3. IP Connectivity',
    type: 'multiple_choice',
    prompt: 'Parameter manakah yang HARUS cocok persis antara dua router tetangga OSPF pada link multiaccess agar hubungan ketetanggaan (OSPF Adjacency) dapat mencapai status FULL? (Pilih tiga)',
    requiredSelections: 3,
    options: [
      { id: 'A', text: 'Area ID' },
      { id: 'B', text: 'Router ID' },
      { id: 'C', text: 'Hello and Dead Interval timers' },
      { id: 'D', text: 'Subnet Mask pada antarmuka yang bertetangga' },
      { id: 'E', text: 'Nilai OSPF Interface Cost / Metric' },
      { id: 'F', text: 'OSPF Process ID number' }
    ],
    correctAnswer: ['A', 'C', 'D'],
    explanation: 'Syarat OSPF adjacency: Area ID sama, Hello/Dead interval sama, Subnet Mask sama pada link broadcast/multiaccess, Authentication password sama, Stub flag sama, dan MTU sama. Router ID justru HARUS berbeda (unik), sedangkan Process ID hanya signifikan secara lokal.'
  },

  // =========================================================================
  // DOMAIN 4: IP SERVICES (10%)
  // =========================================================================
  {
    id: 'q14',
    domain: '4. IP Services',
    type: 'single_choice',
    prompt: 'Perintah Cisco IOS manakah yang digunakan untuk mengonfigurasi Port Address Translation (NAT Overload) menggunakan IP publik tunggal pada interface GigabitEthernet0/1?',
    options: [
      { id: 'A', text: 'ip nat inside source list 1 interface GigabitEthernet0/1 overload' },
      { id: 'B', text: 'ip nat outside source list 1 interface GigabitEthernet0/1 overload' },
      { id: 'C', text: 'ip nat inside source static 192.168.1.1 209.165.200.225' },
      { id: 'D', text: 'ip nat pool OVERLOAD 209.165.200.225 209.165.200.225 netmask 255.255.255.255' }
    ],
    correctAnswer: ['A'],
    explanation: 'Sintaks resmi Cisco IOS PAT: "ip nat inside source list <acl> interface <interface-luar> overload". Kata kunci "overload" menginstruksikan router untuk memetakan ribuan koneksi internal ke IP publik interface luar menggunakan port L4 unik.'
  },
  {
    id: 'q15',
    domain: '4. IP Services',
    type: 'single_choice',
    prompt: 'Tingkat keparahan (severity level) syslog manakah yang mewakili kondisi kegagalan sistem paling kritis di mana sistem tidak dapat beroperasi (system is unusable)?',
    options: [
      { id: 'A', text: 'Level 0 (Emergency)' },
      { id: 'B', text: 'Level 1 (Alert)' },
      { id: 'C', text: 'Level 2 (Critical)' },
      { id: 'D', text: 'Level 3 (Error)' }
    ],
    correctAnswer: ['A'],
    explanation: 'Hierarki Syslog Cisco (0-7): 0=Emergency (System unusable), 1=Alert, 2=Critical, 3=Error, 4=Warning, 5=Notification, 6=Informational, 7=Debugging. Mnemonik: "Every Alley Cat Eats Watermelon Not Icecream Drinks".'
  },
  {
    id: 'q16',
    domain: '4. IP Services',
    type: 'single_choice',
    prompt: 'Fitur keamanan Layer 2 manakah yang bertindak sebagai firewall DHCP dengan memfilter pesan DHCP reply yang berasal dari server DHCP palsu (rogue DHCP server)?',
    options: [
      { id: 'A', text: 'Dynamic ARP Inspection (DAI)' },
      { id: 'B', text: 'DHCP Snooping' },
      { id: 'C', text: 'Port Security' },
      { id: 'D', text: 'BPDU Guard' }
    ],
    correctAnswer: ['B'],
    explanation: 'DHCP Snooping mengklasifikasikan port switch menjadi trusted (port yang terhubung ke server DHCP sah) dan untrusted (port akses pengguna). Pesan DHCPOFFER atau DHCPACK dari port untrusted akan langsung diblokir.'
  },

  // =========================================================================
  // DOMAIN 5: SECURITY FUNDAMENTALS (15%)
  // =========================================================================
  {
    id: 'q17',
    domain: '5. Security Fundamentals',
    type: 'single_choice',
    prompt: 'Dimanakah lokasi penempatan Standard Access Control List (ACL) yang paling direkomendasikan menurut best practice perancangan Cisco?',
    options: [
      { id: 'A', text: 'Paling dekat dengan sumber lalu lintas (Closest to the source).' },
      { id: 'B', text: 'Paling dekat dengan tujuan lalu lintas (Closest to the destination).' },
      { id: 'C', text: 'Pada interface keluar router gateway internet.' },
      { id: 'D', text: 'Pada switch port akses Layer 2.' }
    ],
    correctAnswer: ['B'],
    explanation: 'Standard ACL hanya memfilter berdasarkan source IP address. Jika diletakkan dekat source, paket menuju tujuan lain yang sah akan ikut terblokir. Maka best practice: Standard ACL diletakkan sedekat mungkin dengan destination, sedangkan Extended ACL diletakkan sedekat mungkin dengan source.'
  },
  {
    id: 'q18',
    domain: '5. Security Fundamentals',
    type: 'multiple_choice',
    prompt: 'Tiga pilar keamanan manakah yang menyusun konsep otentikasi dan otorisasi AAA pada perangkat Cisco? (Pilih tiga)',
    requiredSelections: 3,
    options: [
      { id: 'A', text: 'Authentication (Siapa pengguna yang meminta akses)' },
      { id: 'B', text: 'Authorization (Hak akses dan perintah apa saja yang boleh dijalankan)' },
      { id: 'C', text: 'Accounting (Pencatatan aktivitas dan durasi sesi pengguna)' },
      { id: 'D', text: 'Availability (Ketersediaan redundansi perangkat)' },
      { id: 'E', text: 'Auditing (Pemeriksaan manual berkala)' }
    ],
    correctAnswer: ['A', 'B', 'C'],
    explanation: 'Arsitektur AAA Cisco terdiri dari: Authentication (identifikasi pengguna via TACACS+/RADIUS), Authorization (pemberian hak istimewa setelah login), dan Accounting (pencatatan log perintah dan durasi sesi).'
  },
  {
    id: 'q19',
    domain: '5. Security Fundamentals',
    type: 'single_choice',
    prompt: 'Protokol keamanan nirkabel WPA3 menggantikan pertukaran Pre-Shared Key (PSK) 4-way handshake yang rentan pada WPA2 dengan mekanisme autentikasi apa untuk mencegah offline dictionary attack?',
    options: [
      { id: 'A', text: 'Simultaneous Authentication of Equals (SAE)' },
      { id: 'B', text: 'Temporal Key Integrity Protocol (TKIP)' },
      { id: 'C', text: 'Wired Equivalent Privacy (WEP)' },
      { id: 'D', text: 'Extensible Authentication Protocol (EAP-MD5)' }
    ],
    correctAnswer: ['A'],
    explanation: 'WPA3-Personal menggunakan SAE (berdasarkan Dragonfly handshake) yang kebal terhadap passive offline dictionary attack dan menyediakan forward secrecy.'
  },

  // =========================================================================
  // DOMAIN 6: AUTOMATION & PROGRAMMABILITY (10%)
  // =========================================================================
  {
    id: 'q20',
    domain: '6. Automation & Programmability',
    type: 'drag_drop',
    prompt: 'Cocokkan bidang arsitektur Software-Defined Networking (SDN) di sebelah kiri dengan deskripsi fungsi yang tepat di sebelah kanan.',
    dragItems: [
      { id: 'sdn_data', text: 'Data Plane' },
      { id: 'sdn_ctrl', text: 'Control Plane' },
      { id: 'sdn_mgmt', text: 'Management Plane' },
      { id: 'sdn_north', text: 'Northbound API' }
    ],
    dropTargets: [
      { id: 'tgt_sdn_data', label: 'Forwarding paket berbasis ASIC/hardware', correctItemId: 'sdn_data' },
      { id: 'tgt_sdn_ctrl', label: 'Algoritma perutean & pembentukan tabel topologi', correctItemId: 'sdn_ctrl' },
      { id: 'tgt_sdn_mgmt', label: 'Akses konfigurasi SSH, HTTPS, dan CLI', correctItemId: 'sdn_mgmt' },
      { id: 'tgt_sdn_north', label: 'Komunikasi Controller ke Aplikasi Bisnis / Skrip', correctItemId: 'sdn_north' }
    ],
    explanation: 'Pada arsitektur SDN: Data plane melakukan forwarding; Control plane menentukan jalur dan logika; Management plane menangani monitoring/konfigurasi admin; Northbound API menghubungkan controller ke aplikasi analitik/bisnis.'
  },
  {
    id: 'q21',
    domain: '6. Automation & Programmability',
    type: 'single_choice',
    prompt: 'Format serialisasi data manakah yang menggunakan tanda kurung kurawal {}, tanda kurung siku [], pasangan key-value yang dipisahkan titik dua, dan sangat populer dalam payload REST API modern?',
    options: [
      { id: 'A', text: 'JSON (JavaScript Object Notation)' },
      { id: 'B', text: 'YAML (YAML Ain\'t Markup Language)' },
      { id: 'C', text: 'XML (Extensible Markup Language)' },
      { id: 'D', text: 'CSV (Comma Separated Values)' }
    ],
    correctAnswer: ['A'],
    explanation: 'JSON menggunakan pasangan {"key": "value"} dan array []. YAML menggunakan indentasi spasi tanpa kurung kurawal. XML menggunakan tag berpasangan seperti <key>value</key>.'
  },
  {
    id: 'q22',
    domain: '6. Automation & Programmability',
    type: 'multiple_choice',
    prompt: 'Karakteristik manakah yang benar tentang alat otomatisasi konfigurasi jaringan Ansible? (Pilih dua)',
    requiredSelections: 2,
    options: [
      { id: 'A', text: 'Bersifat agentless (tidak memerlukan instalasi agen software pada perangkat jaringan sasaran).' },
      { id: 'B', text: 'Menggunakan model pull di mana router secara periodik meminta konfigurasi ke server sentral.' },
      { id: 'C', text: 'Playbook ditulis menggunakan format YAML yang mudah dibaca manusia.' },
      { id: 'D', text: 'Hanya dapat dijalankan pada sistem operasi Microsoft Windows Server.' },
      { id: 'E', text: 'Menggunakan bahasa pemrograman Java dan membutuhkan instalasi JVM pada router.' }
    ],
    correctAnswer: ['A', 'C'],
    explanation: 'Ansible bersifat agentless (beroperasi melalui SSH atau NETCONF standar), menggunakan model push (controller mengirim perintah ke perangkat), dan instruksi tugasnya dirumuskan dalam Playbook berformat YAML.'
  },
  {
    id: 'q23',
    domain: '6. Automation & Programmability',
    type: 'single_choice',
    prompt: 'Kode status HTTP manakah yang menandakan bahwa permintaan REST API sukses dan menghasilkan sumber daya (resource) baru yang berhasil dibuat di server?',
    options: [
      { id: 'A', text: '200 OK' },
      { id: 'B', text: '201 Created' },
      { id: 'C', text: '204 No Content' },
      { id: 'D', text: '400 Bad Request' }
    ],
    correctAnswer: ['B'],
    explanation: 'HTTP 201 Created mengindikasikan bahwa permintaan POST berhasil diproses dan resource baru telah berhasil dibuat di server. 200 OK adalah sukses generik (misalnya untuk GET/PUT).'
  }
];
