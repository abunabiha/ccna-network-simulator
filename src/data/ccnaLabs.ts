import { LabDefinition } from '../types/lab';

export const CCNA_LABS: LabDefinition[] = [
  // -------------------------------------------------------------
  // CUSTOM TOPOLOGY SANDBOX MODE
  // -------------------------------------------------------------
  {
    id: 'sandbox-custom-topology',
    title: 'Custom Topology Builder (Free Sandbox Mode)',
    domain: '1. Network Fundamentals',
    estimatedMinutes: 60,
    difficulty: 'Beginner',
    scenario: 'Mode kanvas bebas tanpa batasan skenario. Gunakan Device Palette di bilah kiri untuk menarik (drag-and-drop) router, switch, PC, dan server. Sambungkan kabel antar antarmuka dan lakukan konfigurasi mandiri sesuai kebutuhan riset atau latihan bebas Anda.',
    objectives: [
      'Rancang topologi jaringan kustom Anda sendiri',
      'Tambahkan perangkat Router, Switch L2/L3, PC, dan Server',
      'Hubungkan kabel antar port antarmuka yang diinginkan',
      'Konfigurasi protokol jaringan secara bebas via Cisco IOS CLI',
      'Ekspor rancangan topologi ke berkas .json untuk disimpan'
    ],
    tasks: [
      {
        id: 'sandbox-task-1',
        description: 'Tarik dan tempatkan perangkat jaringan dari Device Palette ke kanvas',
        points: 50,
        type: 'operational_check',
        targetDevice: 'any',
        targetInterface: 'any',
        expectedProperty: 'interface_up',
        expectedValue: true,
        hint: 'Gunakan fitur drag and drop dari sidebar kiri.'
      },
      {
        id: 'sandbox-task-2',
        description: 'Hubungkan kabel dan konfigurasi parameter jaringan secara bebas',
        points: 50,
        type: 'operational_check',
        targetDevice: 'any',
        targetInterface: 'any',
        expectedProperty: 'interface_up',
        expectedValue: true,
        hint: 'Klik kabel pada sidebar lalu hubungkan dua port antarmuka perangkat.'
      }
    ],
    initialTopology: {
      devices: [],
      links: []
    }
  },

  // -------------------------------------------------------------
  // LAB 01: Initial Configuration & Device Hardening
  // -------------------------------------------------------------
  {
    id: 'lab-01-initial-config',
    title: 'Lab 01: Initial Device Configuration & Hardening',
    domain: '5. Security Fundamentals',
    estimatedMinutes: 20,
    difficulty: 'Beginner',
    scenario: 'Anda adalah seorang Network Administrator yang ditugaskan untuk melakukan konfigurasi awal (initial baseline configuration) dan hardening keamanan pada Router Cisco ISR 4331 baru di kantor cabang.',
    objectives: [
      'Konfigurasi hostname perangkat menjadi "HQ-Router"',
      'Amankan mode Privileged EXEC dengan enable secret "cisco123"',
      'Aktifkan enkripsi password otomatis (service password-encryption)',
      'Konfigurasi banner MOTD peringatan akses legal',
      'Konfigurasi IP address dan aktifkan antarmuka GigabitEthernet0/0'
    ],
    tasks: [
      {
        id: 'task-1-1',
        description: 'Konfigurasi hostname menjadi "HQ-Router"',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'hostname',
        expectedValue: 'HQ-Router',
        hint: 'Gunakan perintah: hostname HQ-Router di Global Config mode.'
      },
      {
        id: 'task-1-2',
        description: 'Konfigurasi enable secret terenkripsi',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'enableSecret',
        expectedValue: true,
        hint: 'Gunakan perintah: enable secret cisco123'
      },
      {
        id: 'task-1-3',
        description: 'Konfigurasi IP 192.168.1.1 255.255.255.0 pada GigabitEthernet0/0',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0',
        expectedProperty: 'interface_ip',
        expectedValue: { ip: '192.168.1.1', mask: '255.255.255.0' },
        hint: 'Masuk ke interface Gi0/0 lalu ketik: ip address 192.168.1.1 255.255.255.0'
      },
      {
        id: 'task-1-4',
        description: 'Aktifkan antarmuka GigabitEthernet0/0 (no shutdown)',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0',
        expectedProperty: 'interface_no_shutdown',
        expectedValue: true,
        hint: 'Gunakan perintah: no shutdown di mode interface Gi0/0.'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'Router', type: 'router', x: 300, y: 180 },
        { id: 'SW1', hostname: 'Switch1', type: 'switch', x: 300, y: 320 },
        { id: 'PC1', hostname: 'PC-Admin', type: 'pc', x: 300, y: 460 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0', targetDeviceId: 'SW1', targetPort: 'GigabitEthernet0/1', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'SW1', sourcePort: 'FastEthernet0/1', targetDeviceId: 'PC1', targetPort: 'FastEthernet0', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // LAB 02: VLANs & Access Ports
  // -------------------------------------------------------------
  {
    id: 'lab-02-vlan-access',
    title: 'Lab 02: VLAN Creation & Access Port Membership',
    domain: '2. Network Access',
    estimatedMinutes: 20,
    difficulty: 'Beginner',
    scenario: 'Perusahaan ingin memisahkan traffic divisi Accounting (VLAN 10) dan Engineering (VLAN 20) menggunakan Cisco Catalyst 2960 Switch.',
    objectives: [
      'Buat VLAN 10 dengan nama "Accounting" pada SW1',
      'Buat VLAN 20 dengan nama "Engineering" pada SW1',
      'Tetapkan port FastEthernet0/1 ke VLAN 10 sebagai access port',
      'Tetapkan port FastEthernet0/2 ke VLAN 20 sebagai access port'
    ],
    tasks: [
      {
        id: 'task-2-1',
        description: 'Buat VLAN 10 pada Switch SW1',
        points: 25,
        type: 'config_check',
        targetDevice: 'SW1',
        expectedProperty: 'vlan_exists',
        expectedValue: 10,
        hint: 'vlan 10 -> name Accounting'
      },
      {
        id: 'task-2-2',
        description: 'Buat VLAN 20 pada Switch SW1',
        points: 25,
        type: 'config_check',
        targetDevice: 'SW1',
        expectedProperty: 'vlan_exists',
        expectedValue: 20,
        hint: 'vlan 20 -> name Engineering'
      },
      {
        id: 'task-2-3',
        description: 'Konfigurasi Fa0/1 sebagai Access Port VLAN 10',
        points: 25,
        type: 'config_check',
        targetDevice: 'SW1',
        targetInterface: 'FastEthernet0/1',
        expectedProperty: 'switchport_mode',
        expectedValue: 'access',
        hint: 'switchport mode access -> switchport access vlan 10'
      },
      {
        id: 'task-2-4',
        description: 'Konfigurasi Fa0/2 sebagai Access Port VLAN 20',
        points: 25,
        type: 'config_check',
        targetDevice: 'SW1',
        targetInterface: 'FastEthernet0/2',
        expectedProperty: 'switchport_mode',
        expectedValue: 'access',
        hint: 'switchport mode access -> switchport access vlan 20'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'SW1', hostname: 'SW-Floor1', type: 'switch', x: 380, y: 220 },
        { id: 'PC1', hostname: 'PC-Acc', type: 'pc', x: 220, y: 380 },
        { id: 'PC2', hostname: 'PC-Eng', type: 'pc', x: 540, y: 380 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'SW1', sourcePort: 'FastEthernet0/1', targetDeviceId: 'PC1', targetPort: 'FastEthernet0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'SW1', sourcePort: 'FastEthernet0/2', targetDeviceId: 'PC2', targetPort: 'FastEthernet0', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // LAB 03: 802.1Q Trunking & Native VLAN
  // -------------------------------------------------------------
  {
    id: 'lab-03-trunking-native',
    title: 'Lab 03: 802.1Q Trunking & Native VLAN Configuration',
    domain: '2. Network Access',
    estimatedMinutes: 25,
    difficulty: 'Intermediate',
    scenario: 'Hubungkan dua switch Catalyst 2960 menggunakan kabel Cross-Over pada port GigabitEthernet0/1. Konfigurasikan trunking statis 802.1Q dan ubah Native VLAN default ke VLAN 99.',
    objectives: [
      'Konfigurasi port GigabitEthernet0/1 pada SW1 sebagai trunk 802.1Q',
      'Konfigurasi port GigabitEthernet0/1 pada SW2 sebagai trunk 802.1Q',
      'Set Native VLAN ke VLAN 99 pada kedua switch'
    ],
    tasks: [
      {
        id: 'task-3-1',
        description: 'Konfigurasi port Gi0/1 SW1 sebagai 802.1Q Trunk',
        points: 50,
        type: 'config_check',
        targetDevice: 'SW1',
        targetInterface: 'GigabitEthernet0/1',
        expectedProperty: 'switchport_mode',
        expectedValue: 'trunk',
        hint: 'interface Gi0/1 -> switchport mode trunk'
      },
      {
        id: 'task-3-2',
        description: 'Konfigurasi port Gi0/1 SW2 sebagai 802.1Q Trunk',
        points: 50,
        type: 'config_check',
        targetDevice: 'SW2',
        targetInterface: 'GigabitEthernet0/1',
        expectedProperty: 'switchport_mode',
        expectedValue: 'trunk',
        hint: 'interface Gi0/1 -> switchport mode trunk'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'SW1', hostname: 'SW-Dist1', type: 'switch', x: 260, y: 240 },
        { id: 'SW2', hostname: 'SW-Dist2', type: 'switch', x: 520, y: 240 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'SW1', sourcePort: 'GigabitEthernet0/1', targetDeviceId: 'SW2', targetPort: 'GigabitEthernet0/1', cableType: 'crossover' }
      ]
    }
  },

  // -------------------------------------------------------------
  // LAB 04: Inter-VLAN Routing (Router-on-a-Stick)
  // -------------------------------------------------------------
  {
    id: 'lab-04-intervlan-roas',
    title: 'Lab 04: Inter-VLAN Routing (Router-on-a-Stick)',
    domain: '3. IP Connectivity',
    estimatedMinutes: 30,
    difficulty: 'Intermediate',
    scenario: 'Host pada VLAN 10 dan VLAN 20 memerlukan komunikasi antar-VLAN. Lakukan konfigurasi Router-on-a-Stick (ROAS) pada Router R1 menggunakan sub-interfaces dengan enkapsulasi 802.1Q.',
    objectives: [
      'Aktifkan antarmuka fisik GigabitEthernet0/0 pada R1 tanpa IP address',
      'Buat sub-interface Gi0/0.10, enkapsulasi dot1Q 10, IP 192.168.10.1/24',
      'Buat sub-interface Gi0/0.20, enkapsulasi dot1Q 20, IP 192.168.20.1/24',
      'Konfigurasi port trunk pada switch yang mengarah ke router',
      'Verifikasi ping antar-VLAN dari PC1 ke PC2'
    ],
    tasks: [
      {
        id: 'task-4-1',
        description: 'Aktifkan interface fisik Gi0/0 pada R1 (no shutdown)',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0',
        expectedProperty: 'interface_no_shutdown',
        expectedValue: true,
        hint: 'interface Gi0/0 -> no shutdown'
      },
      {
        id: 'task-4-2',
        description: 'Konfigurasi subinterface Gi0/0.10 untuk VLAN 10',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0.10',
        expectedProperty: 'interface_ip',
        expectedValue: { ip: '192.168.10.1', mask: '255.255.255.0' },
        hint: 'interface Gi0/0.10 -> encapsulation dot1Q 10 -> ip address 192.168.10.1 255.255.255.0'
      },
      {
        id: 'task-4-3',
        description: 'Konfigurasi subinterface Gi0/0.20 untuk VLAN 20',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0.20',
        expectedProperty: 'interface_ip',
        expectedValue: { ip: '192.168.20.1', mask: '255.255.255.0' },
        hint: 'interface Gi0/0.20 -> encapsulation dot1Q 20 -> ip address 192.168.20.1 255.255.255.0'
      },
      {
        id: 'task-4-4',
        description: 'Konfigurasi port trunk pada switch SW1',
        points: 25,
        type: 'config_check',
        targetDevice: 'SW1',
        targetInterface: 'GigabitEthernet0/1',
        expectedProperty: 'switchport_mode',
        expectedValue: 'trunk',
        hint: 'interface Gi0/1 -> switchport mode trunk'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1-Gateway', type: 'router', x: 380, y: 130 },
        { id: 'SW1', hostname: 'SW-Core', type: 'switch', x: 380, y: 280 },
        { id: 'PC1', hostname: 'PC-Sales', type: 'pc', x: 230, y: 420 },
        { id: 'PC2', hostname: 'PC-Dev', type: 'pc', x: 530, y: 420 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0', targetDeviceId: 'SW1', targetPort: 'GigabitEthernet0/1', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'SW1', sourcePort: 'FastEthernet0/1', targetDeviceId: 'PC1', targetPort: 'FastEthernet0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'SW1', sourcePort: 'FastEthernet0/2', targetDeviceId: 'PC2', targetPort: 'FastEthernet0', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // LAB 05: IPv4 Static & Default Routing
  // -------------------------------------------------------------
  {
    id: 'lab-05-static-routing',
    title: 'Lab 05: IPv4 Static & Default Route Implementation',
    domain: '3. IP Connectivity',
    estimatedMinutes: 25,
    difficulty: 'Beginner',
    scenario: 'Dua kantor cabang (Branch-A dan Branch-B) dihubungkan melalui WAN link 10.0.0.0/30. Konfigurasi rute statis dan default route agar subnet LAN di kedua cabang dapat berkomunikasi penuh.',
    objectives: [
      'Konfigurasi IP WAN link pada R1 (10.0.0.1/30) dan R2 (10.0.0.2/30)',
      'Konfigurasi Static Route pada R1 menuju LAN Branch-B (192.168.2.0/24)',
      'Konfigurasi Default Route pada R2 mengarah ke R1 (0.0.0.0/0 via 10.0.0.1)',
      'Verifikasi tabel routing (show ip route) dan uji ping end-to-end'
    ],
    tasks: [
      {
        id: 'task-5-1',
        description: 'Konfigurasi IP WAN Gi0/1 pada R1 (10.0.0.1/30)',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/1',
        expectedProperty: 'interface_ip',
        expectedValue: { ip: '10.0.0.1', mask: '255.255.255.252' },
        hint: 'ip address 10.0.0.1 255.255.255.252 -> no shutdown'
      },
      {
        id: 'task-5-2',
        description: 'Konfigurasi IP WAN Gi0/1 pada R2 (10.0.0.2/30)',
        points: 25,
        type: 'config_check',
        targetDevice: 'R2',
        targetInterface: 'GigabitEthernet0/1',
        expectedProperty: 'interface_ip',
        expectedValue: { ip: '10.0.0.2', mask: '255.255.255.252' },
        hint: 'ip address 10.0.0.2 255.255.255.252 -> no shutdown'
      },
      {
        id: 'task-5-3',
        description: 'Konfigurasi Static Route pada R1 ke 192.168.2.0/24 via 10.0.0.2',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'static_route',
        expectedValue: { network: '192.168.2.0', mask: '255.255.255.0' },
        hint: 'ip route 192.168.2.0 255.255.255.0 10.0.0.2'
      },
      {
        id: 'task-5-4',
        description: 'Konfigurasi Default Route pada R2 ke 0.0.0.0/0 via 10.0.0.1',
        points: 25,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'static_route',
        expectedValue: { network: '0.0.0.0', mask: '0.0.0.0' },
        hint: 'ip route 0.0.0.0 0.0.0.0 10.0.0.1'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'Branch-A', type: 'router', x: 250, y: 200 },
        { id: 'R2', hostname: 'Branch-B', type: 'router', x: 550, y: 200 },
        { id: 'PC1', hostname: 'PC-A', type: 'pc', x: 120, y: 350 },
        { id: 'PC2', hostname: 'PC-B', type: 'pc', x: 680, y: 350 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/1', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/1', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0', targetDeviceId: 'PC1', targetPort: 'FastEthernet0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0', targetDeviceId: 'PC2', targetPort: 'FastEthernet0', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // LAB 06: Single-Area OSPFv2 Routing
  // -------------------------------------------------------------
  {
    id: 'lab-06-ospf-single-area',
    title: 'Lab 06: OSPFv2 Single-Area Implementation & Tuning',
    domain: '3. IP Connectivity',
    estimatedMinutes: 30,
    difficulty: 'Intermediate',
    scenario: 'Aktifkan protokol dynamic routing Open Shortest Path First (OSPFv2) Area 0 pada Router R1 dan R2. Konfigurasi Router ID manual dan passive-interface untuk mencegah flooding paket OSPF Hello ke arah LAN pengguna.',
    objectives: [
      'Inisialisasi proses OSPF 1 pada R1 dan R2',
      'Tetapkan Router ID: R1 (1.1.1.1) dan R2 (2.2.2.2)',
      'Iklankan subnet yang terhubung ke Area 0 menggunakan wildcard mask yang tepat',
      'Konfigurasi passive-interface pada antarmuka LAN GigabitEthernet0/0',
      'Verifikasi status tetangga OSPF (show ip ospf neighbor) mencapai status FULL'
    ],
    tasks: [
      {
        id: 'task-6-1',
        description: 'Konfigurasi OSPF process 1 dan network pada R1',
        points: 50,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'ospf_configured',
        expectedValue: true,
        hint: 'router ospf 1 -> router-id 1.1.1.1 -> network 10.0.0.0 0.0.0.3 area 0 -> network 192.168.1.0 0.0.0.255 area 0'
      },
      {
        id: 'task-6-2',
        description: 'Konfigurasi OSPF process 1 dan network pada R2',
        points: 50,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'ospf_configured',
        expectedValue: true,
        hint: 'router ospf 1 -> router-id 2.2.2.2 -> network 10.0.0.0 0.0.0.3 area 0 -> network 192.168.2.0 0.0.0.255 area 0'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'OSPF-R1', type: 'router', x: 260, y: 200 },
        { id: 'R2', hostname: 'OSPF-R2', type: 'router', x: 540, y: 200 },
        { id: 'PC1', hostname: 'Client-1', type: 'pc', x: 130, y: 350 },
        { id: 'PC2', hostname: 'Client-2', type: 'pc', x: 670, y: 350 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/1', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/1', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0', targetDeviceId: 'PC1', targetPort: 'FastEthernet0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0', targetDeviceId: 'PC2', targetPort: 'FastEthernet0', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // LAB 07: Standard & Extended Access Control Lists (ACL)
  // -------------------------------------------------------------
  {
    id: 'lab-07-acl-filtering',
    title: 'Lab 07: Traffic Filtering with Standard & Extended ACLs',
    domain: '4. IP Services',
    estimatedMinutes: 30,
    difficulty: 'Advanced',
    scenario: 'Kebijakan keamanan perusahaan mengharuskan: Server Keuangan (192.168.10.50) hanya boleh diakses oleh subnet Manajemen (192.168.1.0/24), dan memblokir traffic ICMP Echo dari subnet publik.',
    objectives: [
      'Buat Extended ACL nomor 101 pada Router Gateway',
      'Izinkan traffic TCP port 80 (HTTP) dari host tertentu',
      'Blokir traffic ICMP (Ping) dari jaringan yang tidak diizinkan',
      'Terapkan ACL pada antarmuka yang tepat (inbound / outbound)'
    ],
    tasks: [
      {
        id: 'task-7-1',
        description: 'Konfigurasi enable secret pada R1',
        points: 50,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'enableSecret',
        expectedValue: true,
        hint: 'enable secret cisco'
      },
      {
        id: 'task-7-2',
        description: 'Verifikasi antarmuka Gi0/0 berstatus aktif',
        points: 50,
        type: 'operational_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0',
        expectedProperty: 'interface_up',
        expectedValue: true,
        hint: 'no shutdown pada interface Gi0/0'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'Security-GW', type: 'router', x: 400, y: 180 },
        { id: 'SW1', hostname: 'SW-LAN', type: 'switch', x: 260, y: 320 },
        { id: 'SRV1', hostname: 'Finance-Server', type: 'server', x: 540, y: 320 },
        { id: 'PC1', hostname: 'Admin-PC', type: 'pc', x: 260, y: 460 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0', targetDeviceId: 'SW1', targetPort: 'GigabitEthernet0/1', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/1', targetDeviceId: 'SRV1', targetPort: 'FastEthernet0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'SW1', sourcePort: 'FastEthernet0/1', targetDeviceId: 'PC1', targetPort: 'FastEthernet0', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // LAB 08: Switch Port Security
  // -------------------------------------------------------------
  {
    id: 'lab-08-port-security',
    title: 'Lab 08: Switch Port Security & Violation Mitigation',
    domain: '5. Security Fundamentals',
    estimatedMinutes: 20,
    difficulty: 'Intermediate',
    scenario: 'Cegah serangan Rogue Device dan MAC Flooding dengan menerapkan Port Security pada port akses switch karyawan. Pelajari MAC address sah secara sticky dan set mode violation ke shutdown.',
    objectives: [
      'Aktifkan switchport mode access pada FastEthernet0/1',
      'Aktifkan port-security: switchport port-security',
      'Konfigurasi pembelajaran MAC otomatis: switchport port-security mac-address sticky',
      'Set batas maksimum 1 MAC address dan violation mode ke shutdown',
      'Verifikasi dengan show port-security interface FastEthernet0/1'
    ],
    tasks: [
      {
        id: 'task-8-1',
        description: 'Konfigurasi mode access pada port Fa0/1',
        points: 50,
        type: 'config_check',
        targetDevice: 'SW1',
        targetInterface: 'FastEthernet0/1',
        expectedProperty: 'switchport_mode',
        expectedValue: 'access',
        hint: 'switchport mode access'
      },
      {
        id: 'task-8-2',
        description: 'Aktifkan Port Security pada port Fa0/1',
        points: 50,
        type: 'operational_check',
        targetDevice: 'SW1',
        targetInterface: 'FastEthernet0/1',
        expectedProperty: 'interface_up',
        expectedValue: true,
        hint: 'switchport port-security'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'SW1', hostname: 'Access-SW', type: 'switch', x: 380, y: 200 },
        { id: 'PC1', hostname: 'Authorized-PC', type: 'pc', x: 240, y: 360 },
        { id: 'PC2', hostname: 'Rogue-Laptop', type: 'pc', x: 520, y: 360 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'SW1', sourcePort: 'FastEthernet0/1', targetDeviceId: 'PC1', targetPort: 'FastEthernet0', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // LAB 09: NAT & PAT (Port Address Translation / Overload)
  // -------------------------------------------------------------
  {
    id: 'lab-09-nat-pat',
    title: 'Lab 09: NAT Overload (PAT) for Internet Access',
    domain: '4. IP Services',
    estimatedMinutes: 25,
    difficulty: 'Intermediate',
    scenario: 'Hubungkan jaringan lokal privat (192.168.1.0/24) ke Internet ISP menggunakan satu alamat IP publik pada interface keluar Router dengan mekanisme NAT Overload (PAT).',
    objectives: [
      'Tentukan antarmuka IP NAT Inside (Gi0/0) dan Outside (Gi0/1)',
      'Buat Standard ACL 1 yang mengizinkan subnet privat 192.168.1.0/24',
      'Konfigurasi perintah NAT Overload: ip nat inside source list 1 interface Gi0/1 overload',
      'Verifikasi tabel translasi (show ip nat translations)'
    ],
    tasks: [
      {
        id: 'task-9-1',
        description: 'Aktifkan interface Gi0/0 (no shutdown)',
        points: 50,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0',
        expectedProperty: 'interface_no_shutdown',
        expectedValue: true,
        hint: 'interface Gi0/0 -> no shutdown'
      },
      {
        id: 'task-9-2',
        description: 'Aktifkan interface Gi0/1 (no shutdown)',
        points: 50,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/1',
        expectedProperty: 'interface_no_shutdown',
        expectedValue: true,
        hint: 'interface Gi0/1 -> no shutdown'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'Edge-Router', type: 'router', x: 380, y: 220 },
        { id: 'PC1', hostname: 'Internal-PC', type: 'pc', x: 180, y: 220 },
        { id: 'ISP-Server', hostname: 'Public-DNS', type: 'server', x: 580, y: 220 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'PC1', sourcePort: 'FastEthernet0', targetDeviceId: 'R1', targetPort: 'GigabitEthernet0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/1', targetDeviceId: 'ISP-Server', targetPort: 'FastEthernet0', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // LAB 10: DHCP Server on Cisco Router
  // -------------------------------------------------------------
  {
    id: 'lab-10-dhcp-server',
    title: 'Lab 10: Cisco IOS DHCP Server Configuration',
    domain: '4. IP Services',
    estimatedMinutes: 20,
    difficulty: 'Intermediate',
    scenario: 'Konfigurasikan Router R1 agar berfungsi sebagai DHCP Server lokal untuk mendistribusikan IP address secara dinamis kepada client PC di subnet 192.168.10.0/24.',
    objectives: [
      'Kecualikan alamat statis router: ip dhcp excluded-address 192.168.10.1 192.168.10.10',
      'Buat DHCP Pool bernama "LAN-POOL"',
      'Konfigurasi network 192.168.10.0 255.255.255.0',
      'Konfigurasi default-router 192.168.10.1 dan dns-server 8.8.8.8',
      'Verifikasi client PC menerima IP dari pool'
    ],
    tasks: [
      {
        id: 'task-10-1',
        description: 'Konfigurasi IP Gateway pada Gi0/0 (192.168.10.1/24)',
        points: 50,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0',
        expectedProperty: 'interface_ip',
        expectedValue: { ip: '192.168.10.1', mask: '255.255.255.0' },
        hint: 'ip address 192.168.10.1 255.255.255.0 -> no shutdown'
      },
      {
        id: 'task-10-2',
        description: 'Aktifkan interface Gi0/0 (no shutdown)',
        points: 50,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0',
        expectedProperty: 'interface_no_shutdown',
        expectedValue: true,
        hint: 'no shutdown'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'DHCP-R1', type: 'router', x: 380, y: 180 },
        { id: 'SW1', hostname: 'SW-Access', type: 'switch', x: 380, y: 320 },
        { id: 'PC1', hostname: 'PC-Client1', type: 'pc', x: 260, y: 460 },
        { id: 'PC2', hostname: 'PC-Client2', type: 'pc', x: 500, y: 460 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0', targetDeviceId: 'SW1', targetPort: 'GigabitEthernet0/1', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'SW1', sourcePort: 'FastEthernet0/1', targetDeviceId: 'PC1', targetPort: 'FastEthernet0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'SW1', sourcePort: 'FastEthernet0/2', targetDeviceId: 'PC2', targetPort: 'FastEthernet0', cableType: 'straight' }
      ]
    }
  }
];
