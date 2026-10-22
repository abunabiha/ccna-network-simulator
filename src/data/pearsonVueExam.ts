import { ExamQuestion, ExamSuite } from '../types/exam';

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

// ============================================================================
// CCNP ENTERPRISE: CORE NETWORKING (350-401 ENCOR v1.2) EXAM QUESTIONS
// ============================================================================
export const ENCOR_EXAM_QUESTIONS: ExamQuestion[] = [
  // --- DOMAIN 1.0: ARCHITECTURE (15%) ---
  {
    id: 'encor-q1',
    domain: '1.0 Architecture',
    type: 'single_choice',
    prompt: 'Dalam desain hierarki Cisco Enterprise Campus tradisional (Core, Distribution, Access), fungsi manakah yang secara primer dijalankan pada Distribution Layer?',
    options: [
      { id: 'A', text: 'Menyediakan konektivitas fisik berkecepatan tinggi tanpa pemrosesan paket yang rumit (packet switching backbone).' },
      { id: 'B', text: 'Melakukan agregasi wiring-closet switch, perutean inter-VLAN, pembatasan domain broadcast, dan penerapan access control policy / QoS.' },
      { id: 'C', text: 'Menghubungkan perangkat pengguna akhir (end-user workstations, IP phones, access points) ke jaringan kabel.' },
      { id: 'D', text: 'Menghubungkan data center enterprise secara langsung ke cloud provider publik melalui VPN tunnel.' }
    ],
    correctAnswer: ['B'],
    explanation: 'Distribution layer bertanggung jawab untuk agregasi akses layer, perutean antarmuka VLAN, penegakan kebijakan keamanan (ACL), QoS boundary, dan isolasi broadcast domain. Core layer berfokus pada kecepatan switching backbone murni, sedangkan Access layer menghubungkan pengguna akhir.'
  },
  {
    id: 'encor-q2',
    domain: '1.0 Architecture',
    type: 'single_choice',
    prompt: 'Pada arsitektur Cisco SD-Access (Software-Defined Access), protokol manakah yang digunakan pada Control Plane fabric untuk memetakan lokasi endpoint (EID) ke node fabric (RLOC)?',
    options: [
      { id: 'A', text: 'VXLAN (Virtual Extensible LAN)' },
      { id: 'B', text: 'LISP (Locator/ID Separation Protocol)' },
      { id: 'C', text: 'Cisco TrustSec (CTS)' },
      { id: 'D', text: 'IS-IS (Intermediate System to Intermediate System)' }
    ],
    correctAnswer: ['B'],
    explanation: 'Cisco SD-Access menggunakan LISP sebagai protokol Control Plane (memetakan Endpoint ID ke Routing Locator), VXLAN sebagai enkapsulasi Data Plane (menambahkan VNI dan header SGT), dan Cisco TrustSec untuk Policy Plane (micro-segmentasi dengan Security Group Tags).'
  },
  {
    id: 'encor-q3',
    domain: '1.0 Architecture',
    type: 'multiple_choice',
    requiredSelections: 2,
    prompt: 'Komponen arsitektur Cisco Catalyst SD-WAN manakah yang bertindak sebagai Control Plane dan Orchestration Plane? (Pilih dua)',
    options: [
      { id: 'A', text: 'vSmart Controller (Control Plane)' },
      { id: 'B', text: 'vManage NMS (Management Plane)' },
      { id: 'C', text: 'vBond Orchestrator (Orchestration Plane)' },
      { id: 'D', text: 'vEdge / cEdge Router (Data Plane)' },
      { id: 'E', text: 'Cisco DNA Spaces (Location Cloud Service)' }
    ],
    correctAnswer: ['A', 'C'],
    explanation: 'vSmart bertindak sebagai Control Plane terpusat yang mendistribusikan kebijakan routing dan keamanan via Overlay Management Protocol (OMP). vBond bertindak sebagai Orchestrator yang mengautentikasi dan mengkoordinasikan bring-up zero-touch seluruh node SD-WAN.'
  },
  {
    id: 'encor-q4',
    domain: '1.0 Architecture',
    type: 'single_choice',
    prompt: 'Nilai DSCP manakah yang direkomendasikan Cisco untuk menandai lalu lintas suara interaktif (VoIP media stream) yang dialokasikan ke antrean prioritas Low Latency Queuing (LLQ)?',
    options: [
      { id: 'A', text: 'AF41 (DSCP 34)' },
      { id: 'B', text: 'CS3 (DSCP 24)' },
      { id: 'C', text: 'EF - Expedited Forwarding (DSCP 46)' },
      { id: 'D', text: 'Default Best Effort (DSCP 0)' }
    ],
    correctAnswer: ['C'],
    explanation: 'Expedited Forwarding (EF) dengan nilai DSCP 46 (IP Precedence 5) adalah standar IETF dan Cisco untuk audio suara interaktif. Paket dengan tanda EF dimasukkan ke priority queue (LLQ) untuk menjamin latensi (<150ms) dan jitter minimal.'
  },

  // --- DOMAIN 2.0: VIRTUALIZATION (10%) ---
  {
    id: 'encor-q5',
    domain: '2.0 Virtualization',
    type: 'single_choice',
    prompt: 'Perintah Cisco IOS-XE manakah yang digunakan untuk mengaktifkan dukungan multi-tenant VRF modern yang mendukung address-family IPv4 dan IPv6 secara bersamaan?',
    options: [
      { id: 'A', text: 'ip vrf <NAME>' },
      { id: 'B', text: 'vrf definition <NAME>' },
      { id: 'C', text: 'ip routing vrf <NAME>' },
      { id: 'D', text: 'virtual-router <NAME>' }
    ],
    correctAnswer: ['B'],
    explanation: 'Sintaks modern Cisco IOS-XE menggunakan "vrf definition <NAME>" dengan konfigurasi sub-mode "address-family ipv4" dan "address-family ipv6". Perintah "ip vrf <NAME>" adalah sintaks warisan (legacy) yang hanya mendukung IPv4.'
  },
  {
    id: 'encor-q6',
    domain: '2.0 Virtualization',
    type: 'drag_drop',
    prompt: 'Cocokkan istilah arsitektur LISP (Locator/ID Separation Protocol) di sebelah kiri dengan fungsi definisinya di sebelah kanan.',
    dragItems: [
      { id: 'item1', text: 'Endpoint Identifier (EID)' },
      { id: 'item2', text: 'Routing Locator (RLOC)' },
      { id: 'item3', text: 'Map-Server (MS)' },
      { id: 'item4', text: 'Ingress Tunnel Router (ITR)' }
    ],
    dropTargets: [
      { id: 'target1', label: 'Alamat IP host endpoint yang tidak berubah saat berpindah lokasi', correctItemId: 'item1' },
      { id: 'target2', label: 'Alamat IP antarmuka router penghubung ke jaringan underlay', correctItemId: 'item2' },
      { id: 'target3', label: 'Perangkat sentral yang menyimpan database pemetaan EID-ke-RLOC', correctItemId: 'item3' },
      { id: 'target4', label: 'Router yang mengenkapsulasi paket dari host asal menuju RLOC tujuan', correctItemId: 'item4' }
    ],
    explanation: 'LISP memisahkan identitas host (EID) dari lokasi jaringannya (RLOC). Map-Server menyimpan registrasi pemetaan tersebut, dan ITR bertugas menanyakan pemetaan serta mengenkapsulasi paket ke terowongan LISP.'
  },
  {
    id: 'encor-q7',
    domain: '2.0 Virtualization',
    type: 'single_choice',
    prompt: 'Protokol overlay VXLAN menambahkan header enkapsulasi UDP dengan port tujuan default berapakah, dan berapakah panjang bit identifier VNID-nya?',
    options: [
      { id: 'A', text: 'UDP Port 4789, VNID 24-bit (16.777.216 segmen)' },
      { id: 'B', text: 'UDP Port 8472, VNID 12-bit (4.096 segmen)' },
      { id: 'C', text: 'TCP Port 4789, VNID 16-bit (65.536 segmen)' },
      { id: 'D', text: 'IP Protocol 47, VNID 32-bit (4 miliar segmen)' }
    ],
    correctAnswer: ['A'],
    explanation: 'VXLAN distandarisasi dalam RFC 7348 menggunakan UDP port tujuan 4789 (IANA-assigned). VXLAN Network Identifier (VNID) memiliki panjang 24-bit, memperluas batasan 4.094 VLAN IEEE 802.1Q menjadi lebih dari 16 juta segmen terisolasi.'
  },

  // --- DOMAIN 3.0: INFRASTRUCTURE (30%) ---
  {
    id: 'encor-q8',
    domain: '3.0 Infrastructure',
    type: 'single_choice',
    prompt: 'Keunggulan utama Multiple Spanning Tree Protocol (MSTP / IEEE 802.1s) dibandingkan Per-VLAN Spanning Tree Plus (PVST+) pada jaringan enterprise dengan ratusan VLAN adalah:',
    options: [
      { id: 'A', text: 'Menghilangkan kebutuhan akan BPCI dan TCN message.' },
      { id: 'B', text: 'Memetakan banyak VLAN ke dalam beberapa instansi pohon spanning tree (MSTI) untuk menghemat memori dan siklus CPU switch.' },
      { id: 'C', text: 'Menonaktifkan pemblokiran port sehingga semua link dapat aktif meneruskan broadcast frame tanpa risiko loop.' },
      { id: 'D', text: 'Beroperasi secara native tanpa memerlukan penomoran VLAN trunking 802.1Q.' }
    ],
    correctAnswer: ['B'],
    explanation: 'PVST+ menjalankan satu instansi STP per VLAN (500 VLAN = 500 STP instance yang membebani CPU switch). MSTP memungkinkan administrator memetakan ratusan VLAN ke dalam segelintir instance (misalnya Instance 1 untuk VLAN genap, Instance 2 untuk VLAN ganjil).'
  },
  {
    id: 'encor-q9',
    domain: '3.0 Infrastructure',
    type: 'multiple_choice',
    requiredSelections: 2,
    prompt: 'Kombinasi mode port antarmuka manakah yang berhasil membentuk port-channel dinamis menggunakan Link Aggregation Control Protocol (LACP / IEEE 802.3ad)? (Pilih dua)',
    options: [
      { id: 'A', text: 'Switch 1: Active | Switch 2: Active' },
      { id: 'B', text: 'Switch 1: Active | Switch 2: Passive' },
      { id: 'C', text: 'Switch 1: Passive | Switch 2: Passive' },
      { id: 'D', text: 'Switch 1: Desirable | Switch 2: Auto' },
      { id: 'E', text: 'Switch 1: On | Switch 2: Active' }
    ],
    correctAnswer: ['A', 'B'],
    explanation: 'Pada LACP: Active-Active dan Active-Passive akan berhasil membentuk EtherChannel. Passive-Passive tidak akan membentuk kanal karena kedua sisi menunggu inisiasi. Mode Desirable/Auto adalah milik Cisco PAgP (bukan LACP).'
  },
  {
    id: 'encor-q10',
    domain: '3.0 Infrastructure',
    type: 'single_choice',
    prompt: 'Tipe area OSPF manakah yang memblokir LSA Tipe 4 dan Tipe 5 (external routes) dan menyuntikkan rute default otomatis (Type 3 Summary LSA) oleh ABR ke dalam area?',
    options: [
      { id: 'A', text: 'Stub Area' },
      { id: 'B', text: 'Totally Stubby Area' },
      { id: 'C', text: 'Not-So-Stubby Area (NSSA)' },
      { id: 'D', text: 'Backbone Area 0' }
    ],
    correctAnswer: ['A'],
    explanation: 'OSPF Stub Area memblokir Type 4 & 5 LSAs dan menerima default route dari ABR sebagai Type 3 LSA. Totally Stubby Area memblokir Type 3, 4, dan 5 LSAs (hanya rute default Type 3 yang disuntikkan).'
  },
  {
    id: 'encor-q11',
    domain: '3.0 Infrastructure',
    type: 'single_choice',
    prompt: 'Mekanisme loop prevention bawaan pada External BGP (eBGP) saat router menerima pembaruan rute adalah:',
    options: [
      { id: 'A', text: 'Router menolak rute jika Split Horizon mendeteksi subnet yang sama pada interface penerima.' },
      { id: 'B', text: 'Router menolak rute jika nomor Autonomous System (AS) lokalnya sendiri sudah tercantum di dalam atribut AS-Path.' },
      { id: 'C', text: 'Router memverifikasi bahwa hop count rute kurang dari 255 hop.' },
      { id: 'D', text: 'Router menjalankan algoritma Dijkstra SPF untuk memeriksa shortest path.' }
    ],
    correctAnswer: ['B'],
    explanation: 'Dalam eBGP, loop prevention dilakukan dengan memeriksa atribut AS-Path. Jika router mendeteksi nomor AS miliknya sendiri ada dalam deretan AS-Path pada update yang diterima, update tersebut langsung dibuang (drop).'
  },
  {
    id: 'encor-q12',
    domain: '3.0 Infrastructure',
    type: 'single_choice',
    prompt: 'Pada Hot Standby Router Protocol (HSRP), router manakah yang akan terpilih sebagai Active Router secara default jika semua router memiliki prioritas default yang sama (priority 100)?',
    options: [
      { id: 'A', text: 'Router dengan MAC address virtual tertinggi.' },
      { id: 'B', text: 'Router dengan alamat IP antarmuka fisik tertinggi.' },
      { id: 'C', text: 'Router dengan uptime operasional terlama.' },
      { id: 'D', text: 'Router dengan router-id OSPF terendah.' }
    ],
    correctAnswer: ['B'],
    explanation: 'Pemilihan Active Router pada HSRP didasarkan pada nilai prioritas tertinggi (default 100). Jika prioritas bernilai imbang (tie), router dengan alamat IP antarmuka fisik tertinggi yang dikonfigurasi pada grup HSRP akan menang.'
  },

  // --- DOMAIN 4.0: NETWORK ASSURANCE (10%) ---
  {
    id: 'encor-q13',
    domain: '4.0 Network Assurance',
    type: 'single_choice',
    prompt: 'Fitur port mirroring manakah yang memungkinkan lalu lintas jaringan di-mirror melintasi jaringan routed Layer 3 dengan mengenkapsulasi paket menggunakan Generic Routing Encapsulation (GRE protocol 47)?',
    options: [
      { id: 'A', text: 'Local SPAN' },
      { id: 'B', text: 'Remote SPAN (RSPAN)' },
      { id: 'C', text: 'Encapsulated Remote SPAN (ERSPAN)' },
      { id: 'D', text: 'VLAN-based SPAN (VSPAN)' }
    ],
    correctAnswer: ['C'],
    explanation: 'ERSPAN (Encapsulated Remote SPAN) menambahkan header GRE dan IP pada paket mirror, sehingga lalu lintas observasi dapat dirutekan melintasi seluruh jaringan Layer 3 menuju penganalisis lalu lintas (Wireshark/IDS) di lokasi manapun.'
  },
  {
    id: 'encor-q14',
    domain: '4.0 Network Assurance',
    type: 'single_choice',
    prompt: 'Dalam arsitektur Cisco IP SLA dan Object Tracking, apakah fungsi perintah "track 1 ip sla 10 reachability"?',
    options: [
      { id: 'A', text: 'Mengukur throughput antarmuka serial secara berkelanjutan.' },
      { id: 'B', text: 'Menghubungkan status objek pelacak 1 ke hasil probe ICMP echo operasi IP SLA 10 untuk memicu penarikan rute jika probe gagal.' },
      { id: 'C', text: 'Menghitung waktu round-trip DNS server setiap 60 detik.' },
      { id: 'D', text: 'Mereset antarmuka router secara otomatis saat packet loss mencapai 50%.' }
    ],
    correctAnswer: ['B'],
    explanation: 'Object Tracking menghubungkan kondisi operasional (seperti jangkauan IP SLA) dengan tindakan perutean (seperti static route tracking "ip route 0.0.0.0 0.0.0.0 209.165.200.226 track 1"), sehingga default route otomatis dihapus jika gateway ISP down.'
  },
  {
    id: 'encor-q15',
    domain: '4.0 Network Assurance',
    type: 'single_choice',
    prompt: 'Pada Flexible NetFlow (FNF), komponen konfigurasi manakah yang mendefinisikan kunci pencocokan (match keys) seperti source IP, dest IP, dan port, serta field yang dikumpulkan (collected fields) seperti byte dan packet count?',
    options: [
      { id: 'A', text: 'Flow Exporter' },
      { id: 'B', text: 'Flow Record' },
      { id: 'C', text: 'Flow Monitor' },
      { id: 'D', text: 'Flow Sampler' }
    ],
    correctAnswer: ['B'],
    explanation: 'Flow Record mendefinisikan apa yang dianalisis (match keys dan collect fields). Flow Exporter mendefinisikan kemana data dikirim (alamat collector dan port UDP). Flow Monitor mengaitkan Record dan Exporter, lalu diterapkan ke antarmuka.'
  },

  // --- DOMAIN 5.0: SECURITY (20%) ---
  {
    id: 'encor-q16',
    domain: '5.0 Security',
    type: 'multiple_choice',
    requiredSelections: 2,
    prompt: 'Manakah dua perbedaan utama antara protokol AAA TACACS+ dan RADIUS? (Pilih dua)',
    options: [
      { id: 'A', text: 'TACACS+ menggunakan protokol transport TCP port 49, sedangkan RADIUS menggunakan UDP port 1812/1813.' },
      { id: 'B', text: 'TACACS+ hanya mengenkripsi password dalam paket, sedangkan RADIUS mengenkripsi seluruh badan paket.' },
      { id: 'C', text: 'TACACS+ memisahkan fungsi Authentication, Authorization, dan Accounting secara modular, sedangkan RADIUS menggabungkan Authentication dan Authorization.' },
      { id: 'D', text: 'TACACS+ adalah standar terbuka IETF, sedangkan RADIUS adalah protokol proprietary Cisco.' },
      { id: 'E', text: 'TACACS+ tidak mendukung otorisasi perintah CLI per level.' }
    ],
    correctAnswer: ['A', 'C'],
    explanation: 'TACACS+ menggunakan TCP 49, memisahkan fungsi AAA secara modular (sehingga memungkinkan otorisasi perintah per level), dan mengenkripsi seluruh payload paket. RADIUS menggunakan UDP 1812/1813, menggabungkan Auth/Authz, dan hanya mengenkripsi field kata sandi.'
  },
  {
    id: 'encor-q17',
    domain: '5.0 Security',
    type: 'single_choice',
    prompt: 'Tujuan utama dari penerapan Control Plane Policing (CoPP) pada router enterprise Cisco adalah:',
    options: [
      { id: 'A', text: 'Membatasi bandwidth akses internet bagi pengguna di access layer.' },
      { id: 'B', text: 'Melindungi CPU Route Processor dari kelebihan beban (overload) dan serangan Denial-of-Service (DoS) dengan menerapkan rate-limiting pada lalu lintas menuju control plane.' },
      { id: 'C', text: 'Mengenkripsi seluruh frame switching Layer 2 dengan standar MACsec.' },
      { id: 'D', text: 'Memblokir paket ICMP echo-request dari LAN internal.' }
    ],
    correctAnswer: ['B'],
    explanation: 'CoPP memperlakukan Control Plane sebagai entitas terpisah dengan menerapkan Modular QoS CLI (MQC) pada antarmuka "control-plane". Ini membatasi laju (police) lalu lintas manajemen (SSH, SNMP), routing (OSPF, BGP), dan ICMP agar CPU router tidak lumpuh saat serangan banjir paket.'
  },
  {
    id: 'encor-q18',
    domain: '5.0 Security',
    type: 'single_choice',
    prompt: 'Fitur keamanan switch Layer 2 manakah yang memvalidasi paket ARP pada port untrusted dengan mencocokkan IP-ke-MAC terhadap database DHCP Snooping Binding untuk mencegah serangan ARP Spoofing / Man-in-the-Middle?',
    options: [
      { id: 'A', text: 'IP Source Guard (IPSG)' },
      { id: 'B', text: 'Dynamic ARP Inspection (DAI)' },
      { id: 'C', text: 'Port Security' },
      { id: 'D', text: 'BPDU Guard' }
    ],
    correctAnswer: ['B'],
    explanation: 'Dynamic ARP Inspection (DAI) memeriksa paket ARP pada antarmuka untrusted dan memverifikasi keabsahannya berdasarkan DHCP snooping binding table. Jika MAC dan IP tidak sesuai dengan entri lease yang sah, paket ARP di-drop untuk mencegah ARP poisoning.'
  },

  // --- DOMAIN 6.0: AUTOMATION (15%) ---
  {
    id: 'encor-q19',
    domain: '6.0 Automation',
    type: 'single_choice',
    prompt: 'Perbedaan fundamental antara protokol manajemen jaringan berbasis model NETCONF dan RESTCONF adalah:',
    options: [
      { id: 'A', text: 'NETCONF menggunakan SSH port 830 dengan payload XML murni; RESTCONF menggunakan HTTP/HTTPS port 80/443 dengan payload JSON atau XML yang dipetakan ke URI berbasis data model YANG.' },
      { id: 'B', text: 'NETCONF hanya mendukung pembacaan konfigurasi (read-only), sedangkan RESTCONF mendukung penulisan konfigurasi.' },
      { id: 'C', text: 'NETCONF menggunakan YAML, sedangkan RESTCONF menggunakan format SNMP MIB.' },
      { id: 'D', text: 'RESTCONF beroperasi melalui koneksi serial konsol RS-232.' }
    ],
    correctAnswer: ['A'],
    explanation: 'NETCONF (RFC 6241) berjalan di atas transport SSH (port 830) menggunakan operasi RPC berbasis XML. RESTCONF (RFC 8040) menyediakan alternatif antarmuka RESTful berbasis web (HTTPS port 443) dengan dukungan data model YANG menggunakan representasi JSON maupun XML.'
  },
  {
    id: 'encor-q20',
    domain: '6.0 Automation',
    type: 'single_choice',
    prompt: 'Dalam pemrograman script Python untuk otomatisasi jaringan, fungsi modul "json" manakah yang digunakan untuk mengonversi string JSON (misalnya respons teks dari REST API router) menjadi Python dictionary?',
    options: [
      { id: 'A', text: 'json.dumps()' },
      { id: 'B', text: 'json.loads()' },
      { id: 'C', text: 'json.export()' },
      { id: 'D', text: 'json.to_dict()' }
    ],
    correctAnswer: ['B'],
    explanation: 'Fungsi json.loads() (load string) mem-parsing string berformat JSON menjadi objek struktur data Python (dictionary/list). Sebaliknya, json.dumps() (dump string) melakukan serialisasi Python dictionary menjadi string JSON.'
  },
  {
    id: 'encor-q21',
    domain: '3.0 Infrastructure',
    type: 'simlet',
    prompt: 'SIMLET: Anda diminta untuk mengonfigurasi OSPFv2 Single Area pada Router R1. Aktifkan proses OSPF proses ID 1, umumkan network antarmuka LAN 10.0.1.0/24 ke Area 0, dan jadikan antarmuka GigabitEthernet0/0/0 sebagai passive-interface untuk mencegah pembentukan neighbor adjacency ke segmen host pengguna.',
    simlet: {
      deviceHostname: 'R1',
      deviceType: 'router',
      tasks: [
        { id: 't1', description: 'Konfigurasi proses OSPF 1 pada R1', expectedKey: 'ospf_configured', expectedValue: true },
        { id: 't2', description: 'Tambahkan network 10.0.1.0 0.0.0.255 area 0', expectedKey: 'ospf_network', expectedValue: { network: '10.0.1.0', area: 0 } },
        { id: 't3', description: 'Atur GigabitEthernet0/0/0 sebagai passive-interface', expectedKey: 'ospf_passive_interface', expectedValue: 'GigabitEthernet0/0/0' }
      ]
    },
    explanation: 'Langkah konfigurasi:\n1. R1(config)# router ospf 1\n2. R1(config-router)# network 10.0.1.0 0.0.0.255 area 0\n3. R1(config-router)# passive-interface GigabitEthernet0/0/0\nPerintah ini mengaktifkan OSPF pada antarmuka yang cocok dan menghentikan pengiriman OSPF Hello packets ke arah segmen LAN pengguna.'
  }
];

// ============================================================================
// CCNP ENTERPRISE: ADVANCED ROUTING & SERVICES (300-410 ENARSI v1.1) EXAM QUESTIONS
// ============================================================================
export const ENARSI_EXAM_QUESTIONS: ExamQuestion[] = [
  // --- DOMAIN 1.0: LAYER 3 TECHNOLOGIES (35%) ---
  {
    id: 'enarsi-q1',
    domain: '1.0 Layer 3 Technologies',
    type: 'single_choice',
    prompt: 'Dalam algoritma EIGRP DUAL (Diffusing Update Algorithm), kondisi Feasibility Condition (FC) terpenuhi jika dan hanya jika:',
    options: [
      { id: 'A', text: 'Reported Distance (RD) tetangga sama persis dengan Feasible Distance (FD) rute saat ini.' },
      { id: 'B', text: 'Reported Distance (RD) tetangga bernilai lebih kecil secara ketat daripada Feasible Distance (FD) rute saat ini (RD < FD).' },
      { id: 'C', text: 'Hop count rute tetangga lebih kecil dari 15 hop.' },
      { id: 'D', text: 'Total latency jalur tetangga bernilai 0 mikrodetik.' }
    ],
    correctAnswer: ['B'],
    explanation: 'Feasibility Condition (FC) EIGRP menyatakan bahwa kandidat jalur cadangan (Feasible Successor) dijamin bebas loop hanya jika Reported Distance (RD / Advertised Distance) dari tetangga tersebut lebih kecil secara mutlak daripada Feasible Distance (FD) dari Successor aktif saat ini (RD < FD).'
  },
  {
    id: 'enarsi-q2',
    domain: '1.0 Layer 3 Technologies',
    type: 'single_choice',
    prompt: 'Perintah hierarki manakah yang digunakan untuk mengonfigurasi EIGRP Named Mode dengan Autonomous System 64512 pada Cisco IOS-XE?',
    options: [
      { id: 'A', text: 'router eigrp 64512 -> named-mode' },
      { id: 'B', text: 'router eigrp ENTERPRISE -> address-family ipv4 unicast autonomous-system 64512' },
      { id: 'C', text: 'ip routing eigrp ENTERPRISE as 64512' },
      { id: 'D', text: 'router eigrp named 64512' }
    ],
    correctAnswer: ['B'],
    explanation: 'EIGRP Named Mode diinisiasi dengan nama instansi arbitrary (misal: "router eigrp ENTERPRISE"), diikuti sub-mode "address-family ipv4 unicast autonomous-system <AS_NUMBER>". Ini menyatukan konfigurasi routing IPv4, IPv6, dan interface af-interface dalam satu struktur modular.'
  },
  {
    id: 'enarsi-q3',
    domain: '1.0 Layer 3 Technologies',
    type: 'multiple_choice',
    requiredSelections: 2,
    prompt: 'Manakah dua pernyataan yang benar mengenai opsi EIGRP Stub routing pada router cabang (Spoke)? (Pilih dua)',
    options: [
      { id: 'A', text: 'Opsi "receive-only" mencegah router stub mengiklankan rute apapun ke tetangganya.' },
      { id: 'B', text: 'Router tetangga non-stub tidak akan pernah mengirimkan DUAL Query packets ke router stub.' },
      { id: 'C', text: 'Secara default, perintah "eigrp stub" mengaktifkan opsi "summary" dan "static".' },
      { id: 'D', text: 'Router stub bertindak sebagai transit gateway untuk menghubungkan cabang lain ke Core.' },
      { id: 'E', text: 'EIGRP Stub hanya dapat dikonfigurasi pada interface serial point-to-point.' }
    ],
    correctAnswer: ['A', 'B'],
    explanation: 'Router EIGRP Stub tidak pernah dijadikan transit. Tetangganya tidak akan mengirimkan Query packet ke router stub (mengeliminasi masalah Stuck-in-Active / SIA). Opsi "receive-only" mematikan semua advertensi rute (bahkan connected sekalipun).'
  },
  {
    id: 'enarsi-q4',
    domain: '1.0 Layer 3 Technologies',
    type: 'single_choice',
    prompt: 'Pada OSPF Not-So-Stubby Area (NSSA), LSA Tipe 7 yang di-generate oleh ASBR internal akan diterjemahkan menjadi LSA Tipe berapakah oleh ABR sebelum diumumkan ke Backbone Area 0?',
    options: [
      { id: 'A', text: 'LSA Type 1 (Router LSA)' },
      { id: 'B', text: 'LSA Type 3 (Summary LSA)' },
      { id: 'C', text: 'LSA Type 5 (AS External LSA)' },
      { id: 'D', text: 'LSA Type 4 (ASBR Summary LSA)' }
    ],
    correctAnswer: ['C'],
    explanation: 'NSSA mengizinkan redistribusi eksternal ke dalam area stub menggunakan Type 7 NSSA External LSA. Ketika LSA Type 7 ini mencapai ABR, ABR yang bertindak sebagai translator (memiliki P-bit aktif) akan mengonversinya menjadi LSA Type 5 (AS External LSA) untuk didistribusikan ke Area 0 dan seluruh area OSPF lainnya.'
  },
  {
    id: 'enarsi-q5',
    domain: '1.0 Layer 3 Technologies',
    type: 'single_choice',
    prompt: 'Persyaratan arsitektur manakah yang WAJIB dipenuhi saat membangun OSPF Virtual Link untuk menghubungkan area yang terisolasi ke Area 0?',
    options: [
      { id: 'A', text: 'Transit area harus merupakan Stub Area atau NSSA.' },
      { id: 'B', text: 'Transit area harus merupakan non-backbone standard area (bukan stub, totally stubby, atau NSSA).' },
      { id: 'C', text: 'Kedua endpoint router harus memiliki alamat IP dari subnet yang sama.' },
      { id: 'D', text: 'Virtual Link hanya dapat dikonfigurasi menggunakan kabel serial fisik langsung.' }
    ],
    correctAnswer: ['B'],
    explanation: 'OSPF Virtual Link membutuhkan transit area standar yang tidak boleh berupa Stub, Totally Stubby, atau NSSA karena router di dalam area stub tidak memelihara LSA Type 5 dan memerlukan Type 3 summary untuk menentukan jalur virtual.'
  },
  {
    id: 'enarsi-q6',
    domain: '1.0 Layer 3 Technologies',
    type: 'single_choice',
    prompt: 'Dalam algoritma penentuan jalur terbaik BGP (13-Step Best Path Algorithm), atribut manakah yang dievaluasi pertama kali oleh router Cisco IOS-XE?',
    options: [
      { id: 'A', text: 'AS-Path (terpendek)' },
      { id: 'B', text: 'Local Preference (tertinggi)' },
      { id: 'C', text: 'Weight (tertinggi, Cisco proprietary lokal)' },
      { id: 'D', text: 'MED - Multi-Exit Discriminator (terendah)' }
    ],
    correctAnswer: ['C'],
    explanation: 'Urutan pertama dalam algoritma Best Path BGP Cisco adalah WEIGHT (tertinggi menang, nilai 0-65535, lokal pada router dan tidak pernah diiklankan ke router lain). Jika Weight sama, langkah berikutnya adalah LOCAL_PREF (tertinggi menang).'
  },
  {
    id: 'enarsi-q7',
    domain: '1.0 Layer 3 Technologies',
    type: 'single_choice',
    prompt: 'Aturan refleksi pembaruan rute (route advertisement rule) pada BGP Route Reflector (RR) menyatakan bahwa:',
    options: [
      { id: 'A', text: 'Rute yang dipelajari dari non-client hanya akan direfleksikan ke RR Client (tidak ke non-client lain).' },
      { id: 'B', text: 'Rute yang dipelajari dari client tidak akan pernah diumumkan ke router non-client.' },
      { id: 'C', text: 'Route Reflector selalu mengubah next-hop menjadi alamat IP miliknya sendiri untuk semua rute.' },
      { id: 'D', text: 'Route Reflector menghapus atribut AS-Path dari semua rute yang direfleksikan.' }
    ],
    correctAnswer: ['A'],
    explanation: 'Aturan BGP Route Reflector: (1) Rute dari eBGP peer direfleksikan ke Client dan Non-Client; (2) Rute dari RR Client direfleksikan ke Client dan Non-Client; (3) Rute dari Non-Client HANYA direfleksikan ke Client (untuk mencegah loop antar sesama non-client yang diasumsikan sudah terhubung full-mesh).'
  },
  {
    id: 'enarsi-q8',
    domain: '1.0 Layer 3 Technologies',
    type: 'single_choice',
    prompt: 'Teknik terbaik untuk mencegah timbulnya routing loop dan sub-optimal routing pada topologi redistribusi rute timbal-balik multi-point (mutual redistribution) antara OSPF dan EIGRP adalah:',
    options: [
      { id: 'A', text: 'Menetapkan administrative distance OSPF dan EIGRP ke nilai yang persis sama.' },
      { id: 'B', text: 'Menggunakan Route-Map untuk menandai rute dengan Route Tagging saat diredistribusikan, dan memfilter rute yang memiliki tag tersebut pada arah sebaliknya.' },
      { id: 'C', text: 'Menonaktifkan Split Horizon pada seluruh antarmuka router redistribusi.' },
      { id: 'D', text: 'Menggunakan bandwidth statement 10 Gbps pada seluruh interface serial.' }
    ],
    correctAnswer: ['B'],
    explanation: 'Route Tagging adalah standar industri untuk memutus loop redistribusi timbal-balik. Saat rute EIGRP diredistribusikan ke OSPF, rute diberi tag (misal: "set tag 100"). Pada router redistribusi lain, rute dengan tag 100 difilter agar tidak diinjeksikan kembali ke EIGRP.'
  },
  {
    id: 'enarsi-q9',
    domain: '1.0 Layer 3 Technologies',
    type: 'single_choice',
    prompt: 'Perbedaan operasional antara perintah "ip policy route-map <NAME>" dan "ip local policy route-map <NAME>" pada Policy-Based Routing (PBR) adalah:',
    options: [
      { id: 'A', text: '"ip policy" diterapkan pada interface untuk lalu lintas transit yang masuk; "ip local policy" diterapkan secara global untuk paket yang di-generate sendiri oleh router (seperti ICMP ping atau SNMP).' },
      { id: 'B', text: '"ip policy" hanya mendukung IPv6, sedangkan "ip local policy" hanya mendukung IPv4.' },
      { id: 'C', text: '"ip policy" membutuhkan restart router, sedangkan "ip local policy" berlaku seketika.' },
      { id: 'D', text: '"ip local policy" hanya dapat digunakan pada interface loopback.' }
    ],
    correctAnswer: ['A'],
    explanation: 'Perintah "ip policy route-map" diterapkan per antarmuka (interface config mode) dan hanya memproses paket transit yang masuk melalui antarmuka tersebut. Paket yang diinisiasi oleh router itu sendiri (local control traffic / ping) dilewatkan secara normal kecuali jika diatur via "ip local policy route-map" di global config mode.'
  },

  // --- DOMAIN 2.0: VPN TECHNOLOGIES (20%) ---
  {
    id: 'enarsi-q10',
    domain: '2.0 VPN Technologies',
    type: 'single_choice',
    prompt: 'Pada arsitektur MPLS, apakah tujuan dari mekanisme Penultimate Hop Popping (PHP) yang menggunakan label khusus Implicit Null (Label 3)?',
    options: [
      { id: 'A', text: 'Mengenkripsi muatan data sebelum diteruskan ke pelanggan.' },
      { id: 'B', text: 'Melepas label MPLS terluar pada router hop sebelum terakhir (LSR penultimate), sehingga router Egress PE hanya perlu melakukan satu kali pencarian rute IP murni.' },
      { id: 'C', text: 'Menyimpan salinan paket di buffer memory untuk audit compliance.' },
      { id: 'D', text: 'Mencegah terjadinya MTU overflow pada link serial.' }
    ],
    correctAnswer: ['B'],
    explanation: 'Penultimate Hop Popping (PHP) meminta router tetangga sebelum hop terakhir (penultimate LSR) untuk mencopot label terluar (popping label 3). Dengan demikian, router tujuan akhir (Egress PE) terhindar dari overhead melakukan double lookup (lookup tabel MPLS LFIB lalu lookup tabel IP FIB).'
  },
  {
    id: 'enarsi-q11',
    domain: '2.0 VPN Technologies',
    type: 'single_choice',
    prompt: 'Pada teknologi VRF-Lite dan MPLS VPN, apakah perbedaan fungsi antara Route Distinguisher (RD) dan Route Target (RT)?',
    options: [
      { id: 'A', text: 'RD membuat prefix IP menjadi unik secara global (VPNv4); RT adalah atribut BGP Extended Community yang mengatur impor dan ekspor rute antar-tabel VRF.' },
      { id: 'B', text: 'RD mengatur QoS bandwidth; RT mengatur enkripsi AES-256.' },
      { id: 'C', text: 'RD digunakan oleh OSPF; RT digunakan secara eksklusif oleh RIP.' },
      { id: 'D', text: 'RD dan RT memiliki fungsi identik dan dapat dipertukarkan tanpa perbedaan sintaks.' }
    ],
    correctAnswer: ['A'],
    explanation: 'Route Distinguisher (RD, 64-bit) digabungkan dengan IPv4 (32-bit) untuk membentuk prefix unik 96-bit VPNv4, mencegah collision antar pelanggan dengan IP overlapping. Route Target (RT) adalah BGP Extended Community yang menentukan kebijakan VRF mana yang boleh mengimpor atau mengekspor rute tersebut.'
  },
  {
    id: 'enarsi-q12',
    domain: '2.0 VPN Technologies',
    type: 'drag_drop',
    prompt: 'Tarik fase evolusi DMVPN (Dynamic Multipoint VPN) di sebelah kiri ke karakteristik operasional utamanya di sebelah kanan.',
    dragItems: [
      { id: 'item1', text: 'DMVPN Phase 1' },
      { id: 'item2', text: 'DMVPN Phase 2' },
      { id: 'item3', text: 'DMVPN Phase 3' }
    ],
    dropTargets: [
      { id: 'target1', label: 'Hub mGRE, Spoke point-to-point GRE; seluruh lalu lintas spoke-ke-spoke harus transit melalui Hub', correctItemId: 'item1' },
      { id: 'target2', label: 'Hub dan Spoke mGRE; Spoke membentuk direct tunnel namun Hub tidak boleh merangkum rute (no summarization)', correctItemId: 'item2' },
      { id: 'target3', label: 'Menggunakan NHRP Redirect di Hub dan NHRP Shortcut di Spoke; mendukung hierarki rute summarization penuh dengan on-demand shortcut tunnel', correctItemId: 'item3' }
    ],
    explanation: 'Phase 1: Hub-and-Spoke mGRE/p2p. Phase 2: Spoke-to-spoke langsung namun tidak mendukung perangkuman rute karena Spoke memerlukan rute spesifik /32 next-hop. Phase 3: Menggunakan NHRP Redirect dan Shortcut sehingga Hub dapat mengiklankan rute ringkasan (default route) sementara Spoke tetap dapat membuka terowongan langsung on-demand.'
  },
  {
    id: 'enarsi-q13',
    domain: '2.0 VPN Technologies',
    type: 'single_choice',
    prompt: 'Mengapa konfigurasi transform-set IPsec untuk proteksi terowongan DMVPN GRE WAJIB menggunakan mode transport ("mode transport") dan bukan mode tunnel ("mode tunnel")?',
    options: [
      { id: 'A', text: 'Karena mode tunnel tidak mendukung enkripsi AES-256.' },
      { id: 'B', text: 'Karena header GRE sudah mengenkapsulasi paket asli; mode transport menghemat 20 byte overhead IP ekstra dengan tidak menambahkan IP header ganda.' },
      { id: 'C', text: 'Karena mode transport menonaktifkan protokol IKE Phase 1.' },
      { id: 'D', text: 'Karena mode tunnel memblokir lalu lintas multicast OSPF/EIGRP.' }
    ],
    correctAnswer: ['B'],
    explanation: 'Pada DMVPN, terowongan GRE sudah menyediakan enkapsulasi paket IP asal (inner IP). Jika IPsec diatur ke mode tunnel, paket akan memiliki 3 header IP (overhead berlebihan). Dengan "mode transport", header ESP langsung disisipkan di antara new outer IP dan GRE header, menghemat bandwidth dan mencegah fragmentasi MTU.'
  },

  // --- DOMAIN 3.0: INFRASTRUCTURE SECURITY (20%) ---
  {
    id: 'enarsi-q14',
    domain: '3.0 Infrastructure Security',
    type: 'single_choice',
    prompt: 'Administrator jaringan mengaktifkan Unicast Reverse Path Forwarding (uRPF) pada antarmuka router yang terhubung ke penyedia layanan multihomed dengan rute asimetris. Perintah uRPF manakah yang harus dipilih agar paket valid tidak terbuang (drop)?',
    options: [
      { id: 'A', text: 'ip verify unicast source reachable-via rx (Strict Mode)' },
      { id: 'B', text: 'ip verify unicast source reachable-via any (Loose Mode)' },
      { id: 'C', text: 'ip verify source discard' },
      { id: 'D', text: 'ip verify unicast reverse-path strict' }
    ],
    correctAnswer: ['B'],
    explanation: 'Strict Mode ("reachable-via rx") mensyaratkan alamat sumber paket harus dapat dijangkau kembali melalui antarmuka yang sama persis saat paket masuk. Pada jaringan asimetris (paket masuk lewat ISP 1, kembali lewat ISP 2), Strict Mode akan membuang paket sah. Loose Mode ("reachable-via any") hanya mensyaratkan alamat sumber ada dalam tabel FIB (tanpa mempedulikan antarmuka mana).'
  },
  {
    id: 'enarsi-q15',
    domain: '3.0 Infrastructure Security',
    type: 'single_choice',
    prompt: 'Saat mengonfigurasi IPv6 Access Control List (ACL) dengan aturan eksplisit "deny ipv6 any any" di akhir daftar, jenis paket apakah yang WAJIB diizinkan secara eksplisit terlebih dahulu agar mekanisme Neighbor Discovery (ND) dan autokonfigurasi SLAAC tidak lumpuh?',
    options: [
      { id: 'A', text: 'TCP port 80 dan port 443' },
      { id: 'B', text: 'ICMPv6 Router Advertisement (Type 134) dan Router Solicitation (Type 133)' },
      { id: 'C', text: 'UDP port 67 dan port 68' },
      { id: 'D', text: 'IGMP Report Type 1' }
    ],
    correctAnswer: ['B'],
    explanation: 'Pada IPv6, Neighbor Discovery Protocol (NDP) menggunakan paket ICMPv6. Router Advertisement (RA / type 134), Router Solicitation (RS / type 133), Neighbor Solicitation (NS / type 135), dan Neighbor Advertisement (NA / type 136) adalah syarat mutlak untuk resolusi MAC address dan alokasi alamat SLAAC. Jika ditutup oleh explicit deny any, host kehilangan komunikasi L2/L3.'
  },
  {
    id: 'enarsi-q16',
    domain: '3.0 Infrastructure Security',
    type: 'single_choice',
    prompt: 'Konfigurasi Time-Based ACL menggunakan time-range "OFFICE-HOURS" yang aktif setiap hari Senin sampai Jumat pukul 08:00 hingga 17:00 dirumuskan dengan sintaks Cisco IOS yang benar berikut:',
    options: [
      { id: 'A', text: 'time-range OFFICE-HOURS -> periodic weekdays 08:00 to 17:00' },
      { id: 'B', text: 'time-range OFFICE-HOURS -> absolute monday-friday 08:00 17:00' },
      { id: 'C', text: 'access-list time OFFICE-HOURS 08:00-17:00 Mon-Fri' },
      { id: 'D', text: 'schedule OFFICE-HOURS every day 08:00 to 17:00' }
    ],
    correctAnswer: ['A'],
    explanation: 'Cisco IOS mendefinisikan rentang waktu berulang dengan perintah "time-range <NAME>" diikuti "periodic weekdays <start_time> to <end_time>" (atau nama hari seperti monday, tuesday, dll.). Kemudian parameter "time-range <NAME>" dipanggil di ujung baris extended ACL.'
  },

  // --- DOMAIN 4.0: INFRASTRUCTURE SERVICES (25%) ---
  {
    id: 'enarsi-q17',
    domain: '4.0 Infrastructure Services',
    type: 'single_choice',
    prompt: 'Pada konfigurasi antarmuka router Cisco IOS untuk layanan IPv6 Stateless DHCPv6, flag Neighbor Discovery (ND) manakah yang harus diaktifkan agar host menggunakan SLAAC untuk alamat IP dan menggunakan DHCPv6 untuk informasi DNS/Domain Name?',
    options: [
      { id: 'A', text: 'ipv6 nd managed-config-flag (M-flag)' },
      { id: 'B', text: 'ipv6 nd other-config-flag (O-flag)' },
      { id: 'C', text: 'ipv6 nd autoconfig disable' },
      { id: 'D', text: 'ipv6 dhcp relay destination' }
    ],
    correctAnswer: ['B'],
    explanation: 'Stateless DHCPv6 menggunakan flag "ipv6 nd other-config-flag" (O-flag = 1, M-flag = 0). Ini memberitahu klien agar membuat alamat IPv6 sendiri melalui SLAAC, namun menghubungi server DHCPv6 untuk memperoleh parameter "other" (seperti DNS server dan domain search list). Sebaliknya, Stateful DHCPv6 menggunakan M-flag (Managed).'
  },
  {
    id: 'enarsi-q18',
    domain: '4.0 Infrastructure Services',
    type: 'single_choice',
    prompt: 'Urutan tingkat keparahan pesan logging Syslog standar Cisco IOS dari yang paling kritis (level 0) hingga level informasi terendah (level 7) adalah:',
    options: [
      { id: 'A', text: '0-Emergency, 1-Alert, 2-Critical, 3-Error, 4-Warning, 5-Notification, 6-Informational, 7-Debugging' },
      { id: 'B', text: '0-Debugging, 1-Informational, 2-Notice, 3-Warning, 4-Error, 5-Critical, 6-Alert, 7-Emergency' },
      { id: 'C', text: '0-Critical, 1-Emergency, 2-Error, 3-Alert, 4-Notice, 5-Warning, 6-Debug, 7-Info' },
      { id: 'D', text: '0-Fatal, 1-Severe, 2-High, 3-Medium, 4-Low, 5-Trace, 6-Verbose, 7-None' }
    ],
    correctAnswer: ['A'],
    explanation: 'Tingkat keparahan Cisco Syslog (0-7): 0=Emergency (sistem tidak dapat digunakan), 1=Alert (tindakan segera diperlukan), 2=Critical, 3=Error, 4=Warning, 5=Notification (kondisi normal namun signifikan), 6=Informational, 7=Debugging (output diagnostik detail).'
  },
  {
    id: 'enarsi-q19',
    domain: '2.0 VPN Technologies',
    type: 'simlet',
    prompt: 'SIMLET: Anda bertindak sebagai Network Engineer pada Router PE1. Pelanggan enterprise baru memerlukan isolasi tabel routing melalui VRF-Lite. Konfigurasikan VRF bernama "CustomerA" yang mendukung address-family IPv4, asosiasikan antarmuka GigabitEthernet0/0/1 ke dalam VRF "CustomerA", tetapkan alamat IP 192.168.10.1 255.255.255.0, dan aktifkan antarmuka tersebut.',
    simlet: {
      deviceHostname: 'PE1',
      deviceType: 'router',
      tasks: [
        { id: 't1', description: 'Konfigurasi vrf definition CustomerA dengan address-family ipv4', expectedKey: 'vrf_exists', expectedValue: 'CustomerA' },
        { id: 't2', description: 'Terapkan vrf forwarding CustomerA pada GigabitEthernet0/0/1', expectedKey: 'interface_vrf', expectedValue: { iface: 'GigabitEthernet0/0/1', vrf: 'CustomerA' } },
        { id: 't3', description: 'Konfigurasi IP 192.168.10.1 255.255.255.0 pada GigabitEthernet0/0/1', expectedKey: 'interface_ip', expectedValue: { ip: '192.168.10.1', mask: '255.255.255.0' } }
      ]
    },
    explanation: 'Langkah konfigurasi:\n1. PE1(config)# vrf definition CustomerA\n2. PE1(config-vrf)# address-family ipv4\n3. PE1(config-vrf)# exit\n4. PE1(config)# interface GigabitEthernet0/0/1\n5. PE1(config-if)# vrf forwarding CustomerA\n6. PE1(config-if)# ip address 192.168.10.1 255.255.255.0\n7. PE1(config-if)# no shutdown\nCatatan: Mengaitkan vrf forwarding pada antarmuka Cisco IOS otomatis menghapus alamat IP sebelumnya, sehingga "ip address" harus diketikkan setelah perintah "vrf forwarding".'
  }
];

// ============================================================================
// EXAM SUITES REGISTRY
// ============================================================================
export const EXAM_SUITES: ExamSuite[] = [
  {
    id: 'exam-ccna-200-301',
    code: '200-301 CCNA v1.1',
    title: 'Implementing and Administering Cisco Solutions (CCNA)',
    track: 'CCNA',
    timeLimitMinutes: 120,
    passingScore: 825,
    domains: [
      '1. Network Fundamentals',
      '2. Network Access',
      '3. IP Connectivity',
      '4. IP Services',
      '5. Security Fundamentals',
      '6. Automation & Programmability'
    ],
    questions: CCNA_EXAM_QUESTIONS
  },
  {
    id: 'exam-ccnp-350-401-encor',
    code: '350-401 ENCOR v1.2',
    title: 'Implementing Cisco Enterprise Network Core Technologies (ENCOR)',
    track: 'CCNP',
    timeLimitMinutes: 120,
    passingScore: 825,
    domains: [
      '1.0 Architecture',
      '2.0 Virtualization',
      '3.0 Infrastructure',
      '4.0 Network Assurance',
      '5.0 Security',
      '6.0 Automation'
    ],
    questions: ENCOR_EXAM_QUESTIONS
  },
  {
    id: 'exam-ccnp-300-410-enarsi',
    code: '300-410 ENARSI v1.1',
    title: 'Implementing Cisco Enterprise Advanced Routing and Services (ENARSI)',
    track: 'CCNP',
    timeLimitMinutes: 90,
    passingScore: 825,
    domains: [
      '1.0 Layer 3 Technologies',
      '2.0 VPN Technologies',
      '3.0 Infrastructure Security',
      '4.0 Infrastructure Services'
    ],
    questions: ENARSI_EXAM_QUESTIONS
  }
];
