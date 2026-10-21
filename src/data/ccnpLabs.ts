import { LabDefinition } from '../types/lab';

export const CCNP_LABS: LabDefinition[] = [
  // -------------------------------------------------------------
  // CCNP LAB 01: Multi-Area OSPF & Mutual EIGRP Redistribution
  // -------------------------------------------------------------
  {
    id: 'lab-ccnp-01-ospf-redistribution',
    track: 'CCNP',
    category: 'ENCOR/ENARSI Capstone',
    title: 'CCNP Lab 01: Multi-Area OSPF & Mutual EIGRP Redistribution',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 45,
    difficulty: 'Advanced',
    scenario: 'Skenario enterprise yang menghubungkan jaringan OSPF Backbone Area 0 pada Core HQ ke jaringan EIGRP AS 100 pada Kantor Cabang melalui Router ASBR Aggregation (R2). Konfigurasikan OSPF, EIGRP, dan Mutual Redistribution dengan Route-Map filtering.',
    objectives: [
      'Konfigurasi Multi-Area OSPF pada R1 dan R2 (Area 0)',
      'Konfigurasi EIGRP AS 100 pada R2 dan R3',
      'Konfigurasi Route-Map RM-EIGRP-TO-OSPF untuk filtering dan tagging',
      'Konfigurasi Mutual Redistribution antara OSPF dan EIGRP pada ASBR R2'
    ],
    tasks: [
      {
        id: 'task-ccnp1-1',
        description: 'Konfigurasi proses OSPF pada R1',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'ospf_configured',
        expectedValue: true,
        hint: 'router ospf 1 -> network 10.0.12.0 0.0.0.255 area 0'
      },
      {
        id: 'task-ccnp1-2',
        description: 'Konfigurasi proses EIGRP AS 100 pada R3',
        points: 25,
        type: 'config_check',
        targetDevice: 'R3',
        expectedProperty: 'eigrp_configured',
        expectedValue: true,
        hint: 'router eigrp 100 -> network 10.0.23.0 0.0.0.255'
      },
      {
        id: 'task-ccnp1-3',
        description: 'Konfigurasi Route-Map RM-EIGRP-TO-OSPF pada R2',
        points: 25,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'route_map_exists',
        expectedValue: 'RM-EIGRP-TO-OSPF',
        hint: 'route-map RM-EIGRP-TO-OSPF permit 10 -> set metric 20'
      },
      {
        id: 'task-ccnp1-4',
        description: 'Aktifkan OSPF pada ASBR R2',
        points: 25,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'ospf_configured',
        expectedValue: true,
        hint: 'router ospf 1 -> network 10.0.12.0 0.0.0.255 area 0'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'HQ-Core-R1', type: 'router', x: 200, y: 220 },
        { id: 'R2', hostname: 'ASBR-Agg-R2', type: 'router', x: 440, y: 220 },
        { id: 'R3', hostname: 'Branch-R3', type: 'router', x: 680, y: 220 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // CCNP LAB 02: Multi-Tenant Virtualization with VRF-Lite & MPLS
  // -------------------------------------------------------------
  {
    id: 'lab-ccnp-02-vrf-mpls',
    track: 'CCNP',
    category: 'ENCOR/ENARSI Capstone',
    title: 'CCNP Lab 02: Multi-Tenant VRF-Lite & MPLS LDP Backbone',
    domain: 'CCNP Enterprise: Infrastructure Security & Virtualization',
    estimatedMinutes: 45,
    difficulty: 'Advanced',
    scenario: 'Implementasi isolasi lalu lintas pelanggan multi-tenant (Customer RED dan Customer BLUE) menggunakan VRF-Lite pada Provider Edge (PE1) dan Label Distribution Protocol (LDP) over MPLS forwarding pada backbone.',
    objectives: [
      'Konfigurasi VRF instance RED (RD 65000:10) pada PE1',
      'Konfigurasi VRF instance BLUE (RD 65000:20) pada PE1',
      'Aktifkan MPLS dan LDP secara global pada PE1',
      'Aktifkan MPLS dan LDP pada router core P1'
    ],
    tasks: [
      {
        id: 'task-ccnp2-1',
        description: 'Konfigurasi VRF instance RED pada PE1',
        points: 25,
        type: 'config_check',
        targetDevice: 'PE1',
        expectedProperty: 'vrf_exists',
        expectedValue: 'RED',
        hint: 'ip vrf RED -> rd 65000:10'
      },
      {
        id: 'task-ccnp2-2',
        description: 'Konfigurasi VRF instance BLUE pada PE1',
        points: 25,
        type: 'config_check',
        targetDevice: 'PE1',
        expectedProperty: 'vrf_exists',
        expectedValue: 'BLUE',
        hint: 'ip vrf BLUE -> rd 65000:20'
      },
      {
        id: 'task-ccnp2-3',
        description: 'Aktifkan MPLS forwarding secara global pada PE1',
        points: 25,
        type: 'config_check',
        targetDevice: 'PE1',
        expectedProperty: 'mpls_enabled',
        expectedValue: true,
        hint: 'mpls ip'
      },
      {
        id: 'task-ccnp2-4',
        description: 'Aktifkan MPLS forwarding pada router core P1',
        points: 25,
        type: 'config_check',
        targetDevice: 'P1',
        expectedProperty: 'mpls_enabled',
        expectedValue: true,
        hint: 'mpls ip'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'PE1', hostname: 'PE-Router1', type: 'router', x: 220, y: 220 },
        { id: 'P1', hostname: 'P-Core1', type: 'router', x: 440, y: 220 },
        { id: 'PE2', hostname: 'PE-Router2', type: 'router', x: 660, y: 220 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'PE1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'P1', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'P1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'PE2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // CCNP LAB 03: Zero-Trust Branch Security (DMVPN mGRE & ZBFW)
  // -------------------------------------------------------------
  {
    id: 'lab-ccnp-03-dmvpn-zbfw',
    track: 'CCNP',
    category: 'ENCOR/ENARSI Capstone',
    title: 'CCNP Lab 03: Zero-Trust Branch Security (DMVPN mGRE & ZBFW)',
    domain: 'CCNP Enterprise: Infrastructure Security & Virtualization',
    estimatedMinutes: 50,
    difficulty: 'Advanced',
    scenario: 'Membangun konektivitas aman WAN edge kantor cabang menggunakan Dynamic Multipoint VPN (DMVPN Phase 2/3 mGRE + IPsec) serta mengamankan gateway menggunakan Zone-Based Policy Firewall (ZBFW).',
    objectives: [
      'Konfigurasi ISAKMP Policy 10 (AES, SHA, Pre-share) pada HUB',
      'Konfigurasi IPsec Profile IPSEC-PROF pada HUB',
      'Konfigurasi Security Zone INSIDE pada HUB',
      'Konfigurasi Zone-Pair Security ZP-IN-OUT pada HUB'
    ],
    tasks: [
      {
        id: 'task-ccnp3-1',
        description: 'Konfigurasi ISAKMP policy priority 10 pada HUB',
        points: 25,
        type: 'config_check',
        targetDevice: 'HUB',
        expectedProperty: 'crypto_policy_exists',
        expectedValue: 10,
        hint: 'crypto isakmp policy 10 -> encr aes -> hash sha -> authentication pre-share'
      },
      {
        id: 'task-ccnp3-2',
        description: 'Konfigurasi IPsec Profile IPSEC-PROF pada HUB',
        points: 25,
        type: 'config_check',
        targetDevice: 'HUB',
        expectedProperty: 'crypto_profile_exists',
        expectedValue: 'IPSEC-PROF',
        hint: 'crypto ipsec profile IPSEC-PROF -> set transform-set TS-VPN'
      },
      {
        id: 'task-ccnp3-3',
        description: 'Konfigurasi Security Zone INSIDE pada HUB',
        points: 25,
        type: 'config_check',
        targetDevice: 'HUB',
        expectedProperty: 'zone_exists',
        expectedValue: 'INSIDE',
        hint: 'zone security INSIDE'
      },
      {
        id: 'task-ccnp3-4',
        description: 'Konfigurasi Zone-Pair ZP-IN-OUT pada HUB',
        points: 25,
        type: 'config_check',
        targetDevice: 'HUB',
        expectedProperty: 'zone_pair_exists',
        expectedValue: 'ZP-IN-OUT',
        hint: 'zone-pair security ZP-IN-OUT source INSIDE destination OUTSIDE'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'HUB', hostname: 'HQ-DMVPN-HUB', type: 'router', x: 260, y: 220 },
        { id: 'SPOKE1', hostname: 'Branch-Spoke1', type: 'router', x: 580, y: 220 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'HUB', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'SPOKE1', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // CCNP LAB 04: Programmability, On-Box EEM & Model-Driven Telemetry
  // -------------------------------------------------------------
  {
    id: 'lab-ccnp-04-automation-telemetry',
    track: 'CCNP',
    category: 'ENCOR/ENARSI Capstone',
    title: 'CCNP Lab 04: Programmability, On-Box EEM & Model-Driven Telemetry',
    domain: 'CCNP Enterprise: Automation & Programmability',
    estimatedMinutes: 40,
    difficulty: 'Advanced',
    scenario: 'Mengaktifkan API terprogram RESTCONF (RFC 8040) & NETCONF (RFC 6241), membuat applet otomatisasi Cisco EEM on-box untuk mengaudit perintah CLI administratif, dan mengonfigurasi langganan Model-Driven Telemetry (MDT) streaming ke server collector eksternal.',
    objectives: [
      'Aktifkan RESTCONF pada router gateway R_GW',
      'Aktifkan NETCONF-YANG pada router gateway R_GW',
      'Konfigurasi EEM Applet AUDIT-RUN pada R_GW',
      'Konfigurasi Telemetry Subscription 101 pada R_GW'
    ],
    tasks: [
      {
        id: 'task-ccnp4-1',
        description: 'Aktifkan RESTCONF agent pada R_GW',
        points: 25,
        type: 'config_check',
        targetDevice: 'R_GW',
        expectedProperty: 'restconf_enabled',
        expectedValue: true,
        hint: 'restconf'
      },
      {
        id: 'task-ccnp4-2',
        description: 'Aktifkan NETCONF-YANG agent pada R_GW',
        points: 25,
        type: 'config_check',
        targetDevice: 'R_GW',
        expectedProperty: 'netconf_enabled',
        expectedValue: true,
        hint: 'netconf-yang'
      },
      {
        id: 'task-ccnp4-3',
        description: 'Konfigurasi EEM Applet AUDIT-RUN pada R_GW',
        points: 25,
        type: 'config_check',
        targetDevice: 'R_GW',
        expectedProperty: 'eem_applet_exists',
        expectedValue: 'AUDIT-RUN',
        hint: 'event manager applet AUDIT-RUN -> event cli pattern "show run" sync no -> action 1.0 syslog msg "AUDIT: show run executed"'
      },
      {
        id: 'task-ccnp4-4',
        description: 'Konfigurasi Telemetry IETF Subscription 101 pada R_GW',
        points: 25,
        type: 'config_check',
        targetDevice: 'R_GW',
        expectedProperty: 'mdt_subscription_exists',
        expectedValue: 101,
        hint: 'telemetry ietf subscription 101 -> encoding encode-kvgpb -> filter xpath /ietf-interfaces:interfaces-state'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R_GW', hostname: 'Edge-Gateway-R1', type: 'router', x: 340, y: 220 },
        { id: 'COLLECTOR', hostname: 'Telemetry-Collector', type: 'server', x: 600, y: 220 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R_GW', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'COLLECTOR', targetPort: 'FastEthernet0', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // CCNP LAB OSPF 01: Configure OSPF Authentication
  // -------------------------------------------------------------
  {
    id: 'lab-ccnp-ospf-01-authentication',
    track: 'CCNP',
    category: 'OSPFv2 & OSPFv3',
    title: 'CCNP Enterprise Lab: Configure OSPF Authentication',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 30,
    difficulty: 'Advanced',
    scenario: 'Mengonfigurasi autentikasi OSPFv2 (MD5 cryptographic authentication) baik pada level area maupun level interface antara router R1 dan L3 switch D1/D2 untuk mengamankan pertukaran paket OSPF dari serangan sniffing dan spoofing.',
    objectives: [
      'Konfigurasi autentikasi OSPF Area 1 MD5 pada Router R1',
      'Konfigurasi MD5 authentication key pada interface R1 GigabitEthernet0/0/1',
      'Konfigurasi autentikasi OSPF Area 1 MD5 pada Switch D1',
      'Konfigurasi MD5 authentication key pada interface D1 GigabitEthernet1/0/11'
    ],
    tasks: [
      {
        id: 'task-ccnp-ospf1-1',
        description: 'Konfigurasi OSPF Area 1 MD5 authentication pada R1',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'ospf_auth_area',
        expectedValue: 1,
        hint: 'router ospf 1 -> area 1 authentication message-digest'
      },
      {
        id: 'task-ccnp-ospf1-2',
        description: 'Konfigurasi MD5 authentication key cisco123 pada interface R1 GigabitEthernet0/0/1',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0/1',
        expectedProperty: 'ospf_auth_interface',
        expectedValue: 'cisco123',
        hint: 'interface GigabitEthernet0/0/1 -> ip ospf message-digest-key 1 md5 cisco123'
      },
      {
        id: 'task-ccnp-ospf1-3',
        description: 'Konfigurasi OSPF Area 1 MD5 authentication pada D1',
        points: 25,
        type: 'config_check',
        targetDevice: 'D1',
        expectedProperty: 'ospf_auth_area',
        expectedValue: 1,
        hint: 'router ospf 1 -> area 1 authentication message-digest'
      },
      {
        id: 'task-ccnp-ospf1-4',
        description: 'Konfigurasi MD5 authentication key cisco123 pada interface D1 GigabitEthernet1/0/11',
        points: 25,
        type: 'config_check',
        targetDevice: 'D1',
        targetInterface: 'GigabitEthernet1/0/11',
        expectedProperty: 'ospf_auth_interface',
        expectedValue: 'cisco123',
        hint: 'interface GigabitEthernet1/0/11 -> ip ospf message-digest-key 1 md5 cisco123'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 200, y: 220 },
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 440, y: 220 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 680, y: 220 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D1', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'D1', sourcePort: 'GigabitEthernet1/0/1', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/1', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // CCNP LAB OSPF 02: Configure OSPF Stub Areas and Summarization
  // -------------------------------------------------------------
  {
    id: 'lab-ccnp-ospf-02-stub-summarization',
    track: 'CCNP',
    category: 'OSPFv2 & OSPFv3',
    title: 'CCNP Enterprise Lab: Configure OSPF Stub Areas and Summarization',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 45,
    difficulty: 'Advanced',
    scenario: 'Mengoptimalkan Link-State Database (LSDB) dan tabel routing OSPF multiarea dengan menerapkan OSPF Stub Area, Totally Stubby Area, Not-So-Stubby Area (NSSA), serta merangkum rute inter-area (ABR Route Summarization) menggunakan perintah area range.',
    objectives: [
      'Konfigurasi Area 1 sebagai NSSA Totally Stubby pada ABR R1 (area 1 nssa no-summary)',
      'Konfigurasi Area 1 sebagai NSSA pada Switch D1 (area 1 nssa)',
      'Konfigurasi Area 2 sebagai Totally Stubby Area pada ABR R3 (area 2 stub no-summary)',
      'Konfigurasi OSPF ABR Route Summarization untuk prefix Area 1 pada R1 (area 1 range 10.10.0.0 255.255.252.0)'
    ],
    tasks: [
      {
        id: 'task-ccnp-ospf2-1',
        description: 'Konfigurasi OSPF Area 1 sebagai Totally NSSA pada ABR R1',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'ospf_area_type',
        expectedValue: { area: 1, type: 'totally-nssa' },
        hint: 'router ospf 1 -> area 1 nssa no-summary'
      },
      {
        id: 'task-ccnp-ospf2-2',
        description: 'Konfigurasi OSPF Area 1 sebagai NSSA pada Switch D1',
        points: 25,
        type: 'config_check',
        targetDevice: 'D1',
        expectedProperty: 'ospf_area_type',
        expectedValue: { area: 1, type: 'nssa' },
        hint: 'router ospf 1 -> area 1 nssa'
      },
      {
        id: 'task-ccnp-ospf2-3',
        description: 'Konfigurasi OSPF Area 2 sebagai Totally Stubby Area pada ABR R3',
        points: 25,
        type: 'config_check',
        targetDevice: 'R3',
        expectedProperty: 'ospf_area_type',
        expectedValue: { area: 2, type: 'totally-stubby' },
        hint: 'router ospf 1 -> area 2 stub no-summary'
      },
      {
        id: 'task-ccnp-ospf2-4',
        description: 'Konfigurasi ABR Route Summarization prefix 10.10.0.0 pada R1',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'ospf_area_range',
        expectedValue: '10.10.0.0',
        hint: 'router ospf 1 -> area 1 range 10.10.0.0 255.255.252.0'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 220, y: 150 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 440, y: 150 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 660, y: 150 },
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 220, y: 320 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 660, y: 320 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D1', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' },
        { id: 'l4', sourceDeviceId: 'R3', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // CCNP LAB OSPF 03: Implement Multiarea OSPFv3
  // -------------------------------------------------------------
  {
    id: 'lab-ccnp-ospf-03-multiarea-ospfv3',
    track: 'CCNP',
    category: 'OSPFv2 & OSPFv3',
    title: 'CCNP Enterprise Lab: Implement Multiarea OSPFv3 with Address Families',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 45,
    difficulty: 'Advanced',
    scenario: 'Mengimplementasikan protokol routing OSPFv3 modern yang mendukung Address Families (AF IPv4 dan AF IPv6) serta OSPFv3 tradisional untuk IPv6 murni di seluruh jaringan multi-area Cisco Enterprise.',
    objectives: [
      'Aktifkan routing IPv6 global pada router R1',
      'Aktifkan proses OSPFv3 process 123 pada router backbone R2',
      'Konfigurasi OSPFv3 interface Area 0 pada link R1 GigabitEthernet0/0/0',
      'Konfigurasi OSPFv3 interface Area 1 pada switch D1 GigabitEthernet1/0/11'
    ],
    tasks: [
      {
        id: 'task-ccnp-ospf3-1',
        description: 'Aktifkan routing IPv6 unicast global pada router R1',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'ipv6_unicast_routing_enabled',
        expectedValue: true,
        hint: 'ipv6 unicast-routing'
      },
      {
        id: 'task-ccnp-ospf3-2',
        description: 'Aktifkan proses OSPFv3 123 pada router backbone R2',
        points: 25,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'ospfv3_enabled',
        expectedValue: true,
        hint: 'router ospfv3 123'
      },
      {
        id: 'task-ccnp-ospf3-3',
        description: 'Konfigurasi interface R1 GigabitEthernet0/0/0 ke dalam OSPFv3 Area 0',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0/0',
        expectedProperty: 'ospfv3_interface_area',
        expectedValue: 0,
        hint: 'interface GigabitEthernet0/0/0 -> ospfv3 123 ipv6 area 0'
      },
      {
        id: 'task-ccnp-ospf3-4',
        description: 'Konfigurasi interface D1 GigabitEthernet1/0/11 ke dalam OSPFv3 Area 1',
        points: 25,
        type: 'config_check',
        targetDevice: 'D1',
        targetInterface: 'GigabitEthernet1/0/11',
        expectedProperty: 'ospfv3_interface_area',
        expectedValue: 1,
        hint: 'interface GigabitEthernet1/0/11 -> ipv6 ospf 123 area 1'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 220, y: 150 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 440, y: 150 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 660, y: 150 },
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 220, y: 320 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 660, y: 320 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D1', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' },
        { id: 'l4', sourceDeviceId: 'R3', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' }
      ]
    }
  },

  // -------------------------------------------------------------
  // CCNP LAB OSPF 04: Troubleshoot OSPFv3
  // -------------------------------------------------------------
  {
    id: 'lab-ccnp-ospf-04-troubleshoot-ospfv3',
    track: 'CCNP',
    category: 'OSPFv2 & OSPFv3',
    title: 'CCNP Enterprise Lab: Troubleshoot OSPFv3 Adjacencies',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 40,
    difficulty: 'Advanced',
    scenario: 'Melakukan pemecahan masalah (troubleshooting) relasi tetangga OSPFv3 yang gagal terbentuk (neighbor adjacency failure) akibat ketidakcocokan area ID, mismatch timer hello/dead, dan belum diaktifkannya unicast-routing IPv6.',
    objectives: [
      'Perbaiki aktivasi IPv6 unicast-routing yang terlupa pada Router R3',
      'Perbaiki ketidakcocokan Timer Hello (10s) dan Dead (40s) pada interface R1 GigabitEthernet0/0/0',
      'Perbaiki ketidakcocokan Area ID OSPFv3 pada interface R2 GigabitEthernet0/0/0 agar sesuai Area 0',
      'Verifikasi proses OSPFv3 aktif dan beroperasi normal pada D1'
    ],
    tasks: [
      {
        id: 'task-ccnp-ospf4-1',
        description: 'Aktifkan IPv6 unicast-routing yang non-aktif pada Router R3',
        points: 25,
        type: 'config_check',
        targetDevice: 'R3',
        expectedProperty: 'ipv6_unicast_routing_enabled',
        expectedValue: true,
        hint: 'ipv6 unicast-routing'
      },
      {
        id: 'task-ccnp-ospf4-2',
        description: 'Perbaiki timer hello (10) dan dead (40) pada interface R1 GigabitEthernet0/0/0',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0/0',
        expectedProperty: 'ospf_timer_interval',
        expectedValue: { hello: 10, dead: 40 },
        hint: 'interface GigabitEthernet0/0/0 -> ipv6 ospf hello-interval 10 & ipv6 ospf dead-interval 40'
      },
      {
        id: 'task-ccnp-ospf4-3',
        description: 'Perbaiki penetapan Area ID OSPFv3 pada interface R2 GigabitEthernet0/0/0 ke Area 0',
        points: 25,
        type: 'config_check',
        targetDevice: 'R2',
        targetInterface: 'GigabitEthernet0/0/0',
        expectedProperty: 'ospfv3_interface_area',
        expectedValue: 0,
        hint: 'interface GigabitEthernet0/0/0 -> ospfv3 123 ipv6 area 0'
      },
      {
        id: 'task-ccnp-ospf4-4',
        description: 'Pastikan proses OSPFv3 diaktifkan pada Switch D1',
        points: 25,
        type: 'config_check',
        targetDevice: 'D1',
        expectedProperty: 'ospfv3_enabled',
        expectedValue: true,
        hint: 'ipv6 router ospf 123'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 220, y: 150 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 440, y: 150 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 660, y: 150 },
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 220, y: 320 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 660, y: 320 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D1', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' },
        { id: 'l4', sourceDeviceId: 'R3', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' }
      ]
    }
  },
  {
    id: 'lab-ccnp-eigrp-01-ipv4',
    track: 'CCNP',
    category: 'EIGRP IPv4 & IPv6',
    title: 'CCNP Enterprise Lab: Implement EIGRP for IPv4',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 45,
    difficulty: 'Advanced',
    scenario: 'Mengonfigurasi dan memverifikasi protokol routing EIGRP untuk IPv4 menggunakan Named EIGRP Configuration (pada R1, R3, dan D2) serta Classic EIGRP Configuration (pada R2), mengatur passive interface, HMAC-SHA-256 dan MD5 key-chain authentication, serta unequal-cost variance load balancing.',
    objectives: [
      'Konfigurasi Named EIGRP "BASIC-EIGRP-LAB" AS 27 pada R1, R3, dan D2',
      'Konfigurasi Classic EIGRP AS 27 pada Router R2',
      'Konfigurasi Router ID pada seluruh perangkat (R1: 1.1.1.1, R2: 2.2.2.2, R3: 3.3.3.3, D2: 4.4.4.4)',
      'Konfigurasi Passive-Interface pada Loopback0 seluruh perangkat',
      'Konfigurasi Key Chain dan autentikasi MD5 pada R2 serta HMAC-SHA-256 pada R1/R3',
      'Konfigurasi Unequal-Cost Load Balancing dengan variance 2 pada Router R1'
    ],
    tasks: [
      {
        id: 'task-ccnp-eigrp1-1',
        description: 'Konfigurasi Named EIGRP BASIC-EIGRP-LAB AS 27 pada R1',
        points: 15,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'eigrp_configured',
        expectedValue: { asNumber: 27, name: 'BASIC-EIGRP-LAB' },
        hint: 'router eigrp BASIC-EIGRP-LAB -> address-family ipv4 unicast autonomous-system 27'
      },
      {
        id: 'task-ccnp-eigrp1-2',
        description: 'Konfigurasi Classic EIGRP AS 27 pada Router R2',
        points: 15,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'eigrp_configured',
        expectedValue: 27,
        hint: 'router eigrp 27'
      },
      {
        id: 'task-ccnp-eigrp1-3',
        description: 'Konfigurasi Named EIGRP BASIC-EIGRP-LAB AS 27 pada R3',
        points: 15,
        type: 'config_check',
        targetDevice: 'R3',
        expectedProperty: 'eigrp_configured',
        expectedValue: { asNumber: 27, name: 'BASIC-EIGRP-LAB' },
        hint: 'router eigrp BASIC-EIGRP-LAB -> address-family ipv4 unicast autonomous-system 27'
      },
      {
        id: 'task-ccnp-eigrp1-4',
        description: 'Konfigurasi Named EIGRP BASIC-EIGRP-LAB AS 27 pada Switch D2',
        points: 15,
        type: 'config_check',
        targetDevice: 'D2',
        expectedProperty: 'eigrp_configured',
        expectedValue: { asNumber: 27, name: 'BASIC-EIGRP-LAB' },
        hint: 'router eigrp BASIC-EIGRP-LAB -> address-family ipv4 unicast autonomous-system 27'
      },
      {
        id: 'task-ccnp-eigrp1-5',
        description: 'Konfigurasi EIGRP router-id 1.1.1.1 pada Router R1',
        points: 10,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'eigrp_router_id',
        expectedValue: '1.1.1.1',
        hint: 'address-family ipv4 unicast autonomous-system 27 -> eigrp router-id 1.1.1.1'
      },
      {
        id: 'task-ccnp-eigrp1-6',
        description: 'Konfigurasi Key Chain EIGRP-KEYS dengan key-string Cisco123 pada Router R2',
        points: 15,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'keychain_configured',
        expectedValue: { name: 'EIGRP-KEYS', keyString: 'Cisco123' },
        hint: 'key chain EIGRP-KEYS -> key 1 -> key-string Cisco123'
      },
      {
        id: 'task-ccnp-eigrp1-7',
        description: 'Konfigurasi Unequal-Cost Load Balancing (variance 2) pada Router R1',
        points: 15,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'eigrp_variance',
        expectedValue: 2,
        hint: 'address-family ipv4 unicast autonomous-system 27 -> topology base -> variance 2'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 220, y: 150 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 500, y: 150 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 220, y: 340 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 500, y: 340 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/1', cableType: 'straight' },
        { id: 'l4', sourceDeviceId: 'R3', sourcePort: 'GigabitEthernet0/0/2', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/3', cableType: 'straight' }
      ]
    }
  },
  {
    id: 'lab-ccnp-eigrp-02-advanced-ipv4',
    track: 'CCNP',
    category: 'EIGRP IPv4 & IPv6',
    title: 'CCNP Enterprise Lab: Implement Advanced EIGRP for IPv4 Features',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 40,
    difficulty: 'Advanced',
    scenario: 'Menerapkan fitur-fitur lanjutan EIGRP untuk IPv4 termasuk tuning timer hello (10s) dan hold time (30s), konfigurasi manual route summarization pada interface boundary untuk mereduksi ukuran tabel routing, dan konfigurasi EIGRP stub routing untuk membatasi penyebaran query EIGRP.',
    objectives: [
      'Konfigurasi proses EIGRP AS 98 pada R1, R2, R3, dan D1',
      'Tuning timer EIGRP hello (10s) dan hold (30s) pada interface R1 GigabitEthernet0/0/0',
      'Konfigurasi manual route summarization 192.168.0.0/22 pada interface R2',
      'Konfigurasi EIGRP stub routing (connected summary) pada Router R2 dan D1'
    ],
    tasks: [
      {
        id: 'task-ccnp-eigrp2-1',
        description: 'Konfigurasi EIGRP AS 98 pada Router R1',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'eigrp_configured',
        expectedValue: 98,
        hint: 'router eigrp 98'
      },
      {
        id: 'task-ccnp-eigrp2-2',
        description: 'Konfigurasi timer EIGRP hello (10s) dan hold time (30s) pada interface R1 GigabitEthernet0/0/0',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0/0',
        expectedProperty: 'eigrp_timer_interval',
        expectedValue: { hello: 10, hold: 30 },
        hint: 'interface GigabitEthernet0/0/0 -> ip hello-interval eigrp 98 10 & ip hold-time eigrp 98 30'
      },
      {
        id: 'task-ccnp-eigrp2-3',
        description: 'Konfigurasi manual route summarization 192.168.0.0 255.255.252.0 pada interface R2 GigabitEthernet0/0/0',
        points: 25,
        type: 'config_check',
        targetDevice: 'R2',
        targetInterface: 'GigabitEthernet0/0/0',
        expectedProperty: 'eigrp_summary_address',
        expectedValue: '192.168.0.0 255.255.252.0',
        hint: 'interface GigabitEthernet0/0/0 -> ip summary-address eigrp 98 192.168.0.0 255.255.252.0'
      },
      {
        id: 'task-ccnp-eigrp2-4',
        description: 'Konfigurasi EIGRP stub routing pada Router R2',
        points: 25,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'eigrp_stub',
        expectedValue: { connected: true, summary: true },
        hint: 'router eigrp 98 -> eigrp stub connected summary'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 220, y: 150 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 500, y: 150 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 500, y: 340 },
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 220, y: 340 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/1', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D1', targetPort: 'GigabitEthernet1/0/1', cableType: 'straight' }
      ]
    }
  },
  {
    id: 'lab-ccnp-eigrp-03-ipv6',
    track: 'CCNP',
    category: 'EIGRP IPv4 & IPv6',
    title: 'CCNP Enterprise Lab: Implement EIGRP for IPv6 & Named EIGRP',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 45,
    difficulty: 'Advanced',
    scenario: 'Menerapkan EIGRP untuk IPv6 pada arsitektur hybrid yang menggabungkan Classic EIGRP for IPv6 (pada R2) dengan Named EIGRP IPv6 Address-Family (pada R1, R3, D1, dan D2), mengamankan pertukaran rute dengan autentikasi HMAC-SHA-256, dan menerapkan unequal-cost variance routing.',
    objectives: [
      'Aktifkan ipv6 unicast-routing secara global pada seluruh router dan switch L3',
      'Konfigurasi Classic EIGRP IPv6 AS 43 pada Router R2 dan interface-nya',
      'Konfigurasi Named EIGRP "EIGRP_IPV6" AS 43 pada R1, R3, D1, dan D2',
      'Konfigurasi EIGRP IPv6 router-id pada seluruh perangkat',
      'Konfigurasi autentikasi HMAC-SHA-256 Cisco123 pada interface R1 GigabitEthernet0/0/0',
      'Konfigurasi variance 2 pada R1 di bawah topology base IPv6'
    ],
    tasks: [
      {
        id: 'task-ccnp-eigrp3-1',
        description: 'Aktifkan IPv6 unicast-routing secara global pada Router R1',
        points: 15,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'ipv6_unicast_routing_enabled',
        expectedValue: true,
        hint: 'ipv6 unicast-routing'
      },
      {
        id: 'task-ccnp-eigrp3-2',
        description: 'Konfigurasi Classic EIGRP IPv6 AS 43 pada interface R2 GigabitEthernet0/0/0',
        points: 20,
        type: 'config_check',
        targetDevice: 'R2',
        targetInterface: 'GigabitEthernet0/0/0',
        expectedProperty: 'eigrp_ipv6_configured',
        expectedValue: 43,
        hint: 'interface GigabitEthernet0/0/0 -> ipv6 eigrp 43'
      },
      {
        id: 'task-ccnp-eigrp3-3',
        description: 'Konfigurasi Named EIGRP IPv6 AS 43 pada Router R1',
        points: 20,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'eigrp_ipv6_configured',
        expectedValue: 43,
        hint: 'router eigrp EIGRP_IPV6 -> address-family ipv6 unicast autonomous-system 43'
      },
      {
        id: 'task-ccnp-eigrp3-4',
        description: 'Konfigurasi EIGRP router-id 1.1.1.1 pada Router R1',
        points: 15,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'eigrp_router_id',
        expectedValue: '1.1.1.1',
        hint: 'address-family ipv6 unicast autonomous-system 43 -> eigrp router-id 1.1.1.1'
      },
      {
        id: 'task-ccnp-eigrp3-5',
        description: 'Konfigurasi autentikasi HMAC-SHA-256 pada interface R1 GigabitEthernet0/0/0',
        points: 15,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0/0',
        expectedProperty: 'eigrp_auth',
        expectedValue: { mode: 'hmac-sha-256' },
        hint: 'af-interface GigabitEthernet0/0/0 -> authentication mode hmac-sha-256 Cisco123'
      },
      {
        id: 'task-ccnp-eigrp3-6',
        description: 'Konfigurasi variance 2 pada Router R1 untuk EIGRP IPv6',
        points: 15,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'eigrp_variance',
        expectedValue: 2,
        hint: 'address-family ipv6 unicast autonomous-system 43 -> topology base -> variance 2'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 220, y: 150 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 440, y: 150 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 660, y: 150 },
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 220, y: 320 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 660, y: 320 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D1', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' },
        { id: 'l4', sourceDeviceId: 'R3', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' }
      ]
    }
  },
  {
    id: 'lab-ccnp-eigrp-04-troubleshoot-ipv4',
    track: 'CCNP',
    category: 'EIGRP IPv4 & IPv6',
    title: 'CCNP Enterprise Lab: Troubleshoot EIGRP for IPv4',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 40,
    difficulty: 'Advanced',
    scenario: 'Melakukan identifikasi dan perbaikan (troubleshooting) masalah relasi ketetanggaan dan pertukaran rute EIGRP untuk IPv4: duplicate router-id antara R1 dan R3, pemblokiran hello akibat passive-interface default tanpa negasi pada interface uplink, ketidakcocokan key-string autentikasi MD5, dan kesalahan nomor AS pada Switch D2.',
    objectives: [
      'Perbaiki duplikasi router-id pada R3 menjadi 3.3.3.3 (Ticket 4.1.1.1)',
      'Perbaiki penekanan hello dengan mengaktifkan interface R3 GigabitEthernet0/0/0 (no passive-interface) (Ticket 4.1.1.1)',
      'Perbaiki key-string autentikasi pada R2 agar cocok dengan key-chain peers (Ticket 4.1.1.2)',
      'Perbaiki kesalahan konfigurasi AS number pada Switch D2 dari AS 421 ke AS 412 (Ticket 4.1.1.3)'
    ],
    tasks: [
      {
        id: 'task-ccnp-eigrp4-1',
        description: 'Perbaiki duplikasi EIGRP router-id pada Router R3 menjadi 3.3.3.3',
        points: 25,
        type: 'config_check',
        targetDevice: 'R3',
        expectedProperty: 'eigrp_router_id',
        expectedValue: '3.3.3.3',
        hint: 'router eigrp 412 -> eigrp router-id 3.3.3.3'
      },
      {
        id: 'task-ccnp-eigrp4-2',
        description: 'Aktifkan transmisi paket hello EIGRP pada interface R3 GigabitEthernet0/0/0 (no passive-interface)',
        points: 25,
        type: 'config_check',
        targetDevice: 'R3',
        targetInterface: 'GigabitEthernet0/0/0',
        expectedProperty: 'eigrp_passive_interface',
        expectedValue: false,
        hint: 'router eigrp 412 -> no passive-interface GigabitEthernet0/0/0'
      },
      {
        id: 'task-ccnp-eigrp4-3',
        description: 'Perbaiki key-string pada Key Chain EIGRP-KEYS Router R2 menjadi Cisco123',
        points: 25,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'keychain_configured',
        expectedValue: { name: 'EIGRP-KEYS', keyString: 'Cisco123' },
        hint: 'key chain EIGRP-KEYS -> key 1 -> key-string Cisco123'
      },
      {
        id: 'task-ccnp-eigrp4-4',
        description: 'Koreksi AS number EIGRP pada Switch D2 menjadi AS 412',
        points: 25,
        type: 'config_check',
        targetDevice: 'D2',
        expectedProperty: 'eigrp_configured',
        expectedValue: 412,
        hint: 'no router eigrp 421 -> router eigrp 412'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 220, y: 150 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 500, y: 150 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 220, y: 340 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 500, y: 340 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R3', sourcePort: 'GigabitEthernet0/0/2', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/3', cableType: 'straight' }
      ]
    }
  },
  {
    id: 'lab-ccnp-eigrp-05-troubleshoot-ipv6',
    track: 'CCNP',
    category: 'EIGRP IPv4 & IPv6',
    title: 'CCNP Enterprise Lab: Troubleshoot EIGRP for IPv6',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 40,
    difficulty: 'Advanced',
    scenario: 'Melakukan pemecahan masalah (troubleshooting) penyebaran rute IPv6 pada EIGRP AS 43: memperbaiki konfigurasi stub receive-only pada D1 yang menghalangi perambatan rute ringkas, membetulkan prefix summary-address yang salah (::/0 diganti menjadi 2001:db8:acad:2000::/63) pada R2, dan memastikan aktivasi EIGRP IPv6 berjalan normal di seluruh segmen.',
    objectives: [
      'Perbaiki konfigurasi EIGRP stub pada D1 dengan menghilangkan receive-only agar rute ringkas dapat diiklankan (Ticket 4.1.2.1)',
      'Koreksi IPv6 summary-address pada interface R2 GigabitEthernet0/0/0 menjadi 2001:db8:acad:2000::/63 (Ticket 4.1.2.1)',
      'Pastikan proses IPv6 EIGRP AS 43 aktif pada Switch D2',
      'Pastikan ipv6 unicast-routing telah aktif secara menyeluruh'
    ],
    tasks: [
      {
        id: 'task-ccnp-eigrp5-1',
        description: 'Perbaiki konfigurasi EIGRP stub pada Switch D1 agar tidak memblokir perambatan rute (disable receive-only)',
        points: 25,
        type: 'config_check',
        targetDevice: 'D1',
        expectedProperty: 'eigrp_stub',
        expectedValue: { receiveOnly: false },
        hint: 'router eigrp EIGRP_IPV6 -> address-family ipv6 unicast autonomous-system 43 -> eigrp stub connected summary'
      },
      {
        id: 'task-ccnp-eigrp5-2',
        description: 'Koreksi summary-address IPv6 pada interface R2 GigabitEthernet0/0/0 menjadi 2001:db8:acad:2000::/63',
        points: 25,
        type: 'config_check',
        targetDevice: 'R2',
        targetInterface: 'GigabitEthernet0/0/0',
        expectedProperty: 'eigrp_ipv6_summary_address',
        expectedValue: '2001:db8:acad:2000::/63',
        hint: 'interface GigabitEthernet0/0/0 -> ipv6 summary-address eigrp 43 2001:db8:acad:2000::/63'
      },
      {
        id: 'task-ccnp-eigrp5-3',
        description: 'Pastikan proses IPv6 EIGRP AS 43 aktif pada Switch D2',
        points: 25,
        type: 'config_check',
        targetDevice: 'D2',
        expectedProperty: 'eigrp_ipv6_configured',
        expectedValue: 43,
        hint: 'router eigrp EIGRP_IPV6 -> address-family ipv6 unicast autonomous-system 43'
      },
      {
        id: 'task-ccnp-eigrp5-4',
        description: 'Pastikan ipv6 unicast-routing telah diaktifkan pada Switch D1',
        points: 25,
        type: 'config_check',
        targetDevice: 'D1',
        expectedProperty: 'ipv6_unicast_routing_enabled',
        expectedValue: true,
        hint: 'ipv6 unicast-routing'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 220, y: 150 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 440, y: 150 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 660, y: 150 },
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 220, y: 320 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 660, y: 320 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D1', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' },
      ]
    }
  },
  {
    id: 'lab-ccnp-bgp-01-ebgp-ibgp',
    track: 'CCNP',
    category: 'BGP & MP-BGP',
    title: 'CCNP Enterprise Lab: Implement eBGP and iBGP',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 45,
    difficulty: 'Advanced',
    scenario: 'Membangun konektivitas BGP skala enterprise menghubungkan AS 65000 (R1, R2, R3) dengan pelanggan AS 65001 (D1) dan AS 65002 (D2). Mengonfigurasi relasi eBGP peering menggunakan IPv4 dan IPv6 address family, iBGP full-mesh di internal AS 65000 menggunakan next-hop-self pada edge routers (R1 dan R3), mengiklankan network internal AS 65000 pada R2, serta menerapkan AS-path filtering untuk memastikan AS 65000 berfungsi sebagai Non-Transit AS.',
    objectives: [
      'Konfigurasi eBGP peering pada R1 dengan Switch D1 (AS 65001) untuk IPv4 dan IPv6 Address Families',
      'Konfigurasi eBGP peering pada R3 dengan Switch D2 (AS 65002) untuk IPv4 dan IPv6 Address Families',
      'Konfigurasi iBGP peering di AS 65000 pada R1, R2, dan R3 dengan next-hop-self pada R1 dan R3',
      'Iklankan prefix 172.16.0.0/16 (IPv4) dan 2001:DB8:A000::/36 (IPv6) pada R2',
      'Konfigurasi AS 65000 sebagai Non-Transit AS menggunakan ip as-path access-list 10 permit ^$ dan filter-list 10 out pada R1 dan R3'
    ],
    tasks: [
      {
        id: 'task-ccnp-bgp1-1',
        description: 'Konfigurasi eBGP peering pada R1 dengan D1 (209.165.200.6, AS 65001) di Address Family IPv4',
        points: 20,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '209.165.200.6', remoteAs: 65001, addressFamily: 'ipv4', activate: true },
        hint: 'router bgp 65000 -> neighbor 209.165.200.6 remote-as 65001 -> address-family ipv4 unicast -> neighbor 209.165.200.6 activate'
      },
      {
        id: 'task-ccnp-bgp1-2',
        description: 'Konfigurasi eBGP peering pada R3 dengan D2 (209.165.200.10, AS 65002) di Address Family IPv4',
        points: 20,
        type: 'config_check',
        targetDevice: 'R3',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '209.165.200.10', remoteAs: 65002, addressFamily: 'ipv4', activate: true },
        hint: 'router bgp 65000 -> neighbor 209.165.200.10 remote-as 65002 -> address-family ipv4 unicast -> neighbor 209.165.200.10 activate'
      },
      {
        id: 'task-ccnp-bgp1-3',
        description: 'Konfigurasi next-hop-self pada Router R1 ke iBGP peer 10.0.0.1 under Address Family IPv4',
        points: 20,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '10.0.0.1', nextHopSelf: true, addressFamily: 'ipv4' },
        hint: 'router bgp 65000 -> address-family ipv4 unicast -> neighbor 10.0.0.1 next-hop-self'
      },
      {
        id: 'task-ccnp-bgp1-4',
        description: 'Iklankan network internal 172.16.0.0 mask 255.255.0.0 pada Router R2 di bawah Address Family IPv4',
        points: 20,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'bgp_network',
        expectedValue: { network: '172.16.0.0', mask: '255.255.0.0', addressFamily: 'ipv4' },
        hint: 'router bgp 65000 -> address-family ipv4 unicast -> network 172.16.0.0 mask 255.255.0.0'
      },
      {
        id: 'task-ccnp-bgp1-5',
        description: 'Konfigurasi AS 65000 sebagai Non-Transit AS dengan AS-Path ACL 10 permit ^$ dan filter-list 10 out pada R1',
        points: 20,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'as_path_acl',
        expectedValue: { number: 10, action: 'permit', regex: '^$' },
        hint: 'ip as-path access-list 10 permit ^$ -> router bgp 65000 -> address-family ipv4 unicast -> neighbor 209.165.200.6 filter-list 10 out'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 220, y: 150 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 440, y: 150 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 660, y: 150 },
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 220, y: 320 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 660, y: 320 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D1', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' },
        { id: 'l4', sourceDeviceId: 'R3', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' }
      ]
    }
  },
  {
    id: 'lab-ccnp-bgp-02-advanced-features',
    track: 'CCNP',
    category: 'BGP & MP-BGP',
    title: 'CCNP Enterprise Lab: Configure BGP Advanced Features',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 45,
    difficulty: 'Advanced',
    scenario: 'Mengonfigurasi fitur-fitur lanjutan BGP enterprise pada router gateway GW1 dan GW2 yang terhubung ke multi-homed upstream ISP (ISP1 AS 65100, ISP2 AS 65200, dan ISP3 AS 4279500803): penggunaan BGP Peer Group ISP-PEERS untuk konsistensi kebijakan, autentikasi MD5 password, filtering rute dengan AS-path ACL, manipulasi rute masuk dengan Local Preference via route-map PREFER-ISP1-ISP2, manipulasi rute keluar menggunakan MED (metric) via route-map SET-MED-ISP2, default-originate pada ISP1, dan agregasi rute summary-only pada ISP3.',
    objectives: [
      'Konfigurasi BGP Peer Group ISP-PEERS pada GW1 dengan update-source dan MD5 password authentication',
      'Terapkan AS-path filtering outbound pada GW1 untuk membatasi iklan hanya rute lokal AS 65000',
      'Konfigurasi route-map PREFER-ISP1-ISP2 pada GW1 dengan set local-preference 200',
      'Konfigurasi route-map SET-MED-ISP2 pada GW2 dengan set metric 50',
      'Konfigurasi default-originate pada ISP1 dan aggregate-address summary-only pada ISP3'
    ],
    tasks: [
      {
        id: 'task-ccnp-bgp2-1',
        description: 'Konfigurasi BGP peer-group ISP-PEERS pada Gateway GW1',
        points: 20,
        type: 'config_check',
        targetDevice: 'GW1',
        expectedProperty: 'bgp_peer_group',
        expectedValue: { name: 'ISP-PEERS' },
        hint: 'router bgp 65000 -> neighbor ISP-PEERS peer-group'
      },
      {
        id: 'task-ccnp-bgp2-2',
        description: 'Konfigurasi autentikasi MD5 password cisco123 untuk peering ke ISP1 (209.165.201.1) pada GW1',
        points: 20,
        type: 'config_check',
        targetDevice: 'GW1',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '209.165.201.1', password: 'cisco123' },
        hint: 'router bgp 65000 -> neighbor 209.165.201.1 password cisco123'
      },
      {
        id: 'task-ccnp-bgp2-3',
        description: 'Konfigurasi route-map PREFER-ISP1-ISP2 dengan set local-preference 200 pada GW1',
        points: 20,
        type: 'config_check',
        targetDevice: 'GW1',
        expectedProperty: 'route_map_clause',
        expectedValue: { name: 'PREFER-ISP1-ISP2', sequence: 10, setLocalPreference: 200 },
        hint: 'route-map PREFER-ISP1-ISP2 permit 10 -> set local-preference 200'
      },
      {
        id: 'task-ccnp-bgp2-4',
        description: 'Konfigurasi route-map SET-MED-ISP2 dengan set metric 50 pada GW2',
        points: 20,
        type: 'config_check',
        targetDevice: 'GW2',
        expectedProperty: 'route_map_clause',
        expectedValue: { name: 'SET-MED-ISP2', sequence: 10, setMetric: 50 },
        hint: 'route-map SET-MED-ISP2 permit 10 -> set metric 50'
      },
      {
        id: 'task-ccnp-bgp2-5',
        description: 'Konfigurasi aggregate-address 203.0.112.0 255.255.252.0 summary-only pada Router ISP3',
        points: 20,
        type: 'config_check',
        targetDevice: 'ISP3',
        expectedProperty: 'bgp_aggregate_address',
        expectedValue: { prefix: '203.0.112.0', mask: '255.255.252.0', summaryOnly: true },
        hint: 'router bgp 4279500803 -> aggregate-address 203.0.112.0 255.255.252.0 summary-only'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'GW1', hostname: 'GW1', type: 'router', x: 220, y: 150 },
        { id: 'GW2', hostname: 'GW2', type: 'router', x: 220, y: 320 },
        { id: 'ISP1', hostname: 'ISP1', type: 'router', x: 500, y: 120 },
        { id: 'ISP2', hostname: 'ISP2', type: 'router', x: 500, y: 240 },
        { id: 'ISP3', hostname: 'ISP3', type: 'router', x: 500, y: 360 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'GW1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'GW2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'GW1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'ISP1', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'GW2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'ISP2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l4', sourceDeviceId: 'ISP2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'ISP3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' }
      ]
    }
  },
  {
    id: 'lab-ccnp-bgp-03-route-reflector',
    track: 'CCNP',
    category: 'BGP & MP-BGP',
    title: 'CCNP Enterprise Lab: Configure BGP Route Reflector',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 45,
    difficulty: 'Advanced',
    scenario: 'Mengurangi kompleksitas iBGP full-mesh dalam AS 65000 dengan mendesain R2 sebagai BGP Route Reflector (RR) yang melayani client R1 dan R3. Mengonfigurasi cluster-id 999 pada R2, menetapkan neighbor R1 dan R3 sebagai route-reflector-client untuk IPv4 dan IPv6 address families, serta memverifikasi bahwa rute yang diterima dari satu client berhasil direfleksikan ke client lainnya tanpa sesi peering langsung antara R1 dan R3.',
    objectives: [
      'Konfigurasi BGP cluster-id 999 pada Route Reflector R2',
      'Tetapkan neighbor 10.0.0.2 dan 10.0.0.6 sebagai route-reflector-client pada R2 untuk Address Family IPv4',
      'Tetapkan neighbor 2001:db8:feed:1::2 dan 2001:db8:feed:2::6 sebagai route-reflector-client pada R2 untuk Address Family IPv6',
      'Pastikan sesi iBGP langsung antara R1 dan R3 ditiadakan sehingga seluruh pertukaran rute melalui R2'
    ],
    tasks: [
      {
        id: 'task-ccnp-bgp3-1',
        description: 'Konfigurasi proses BGP AS 65000 dengan cluster-id 999 pada Route Reflector R2',
        points: 20,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'bgp_configured',
        expectedValue: { asNumber: 65000, clusterId: '999' },
        hint: 'router bgp 65000 -> bgp cluster-id 999'
      },
      {
        id: 'task-ccnp-bgp3-2',
        description: 'Konfigurasi neighbor 10.0.0.2 sebagai route-reflector-client pada R2 under Address Family IPv4',
        points: 20,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '10.0.0.2', routeReflectorClient: true, addressFamily: 'ipv4' },
        hint: 'router bgp 65000 -> address-family ipv4 unicast -> neighbor 10.0.0.2 route-reflector-client'
      },
      {
        id: 'task-ccnp-bgp3-3',
        description: 'Konfigurasi neighbor 10.0.0.6 sebagai route-reflector-client pada R2 under Address Family IPv4',
        points: 20,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '10.0.0.6', routeReflectorClient: true, addressFamily: 'ipv4' },
        hint: 'router bgp 65000 -> address-family ipv4 unicast -> neighbor 10.0.0.6 route-reflector-client'
      },
      {
        id: 'task-ccnp-bgp3-4',
        description: 'Konfigurasi neighbor 2001:db8:feed:1::2 sebagai route-reflector-client pada R2 under Address Family IPv6',
        points: 20,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '2001:db8:feed:1::2', routeReflectorClient: true, addressFamily: 'ipv6' },
        hint: 'router bgp 65000 -> address-family ipv6 unicast -> neighbor 2001:db8:feed:1::2 route-reflector-client'
      },
      {
        id: 'task-ccnp-bgp3-5',
        description: 'Konfigurasi neighbor 2001:db8:feed:2::6 sebagai route-reflector-client pada R2 under Address Family IPv6',
        points: 20,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '2001:db8:feed:2::6', routeReflectorClient: true, addressFamily: 'ipv6' },
        hint: 'router bgp 65000 -> address-family ipv6 unicast -> neighbor 2001:db8:feed:2::6 route-reflector-client'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 220, y: 150 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 440, y: 150 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 660, y: 150 },
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 220, y: 320 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 660, y: 320 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D1', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' },
        { id: 'l4', sourceDeviceId: 'R3', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' }
      ]
    }
  },
  {
    id: 'lab-ccnp-bgp-04-path-manipulation',
    track: 'CCNP',
    category: 'BGP & MP-BGP',
    title: 'CCNP Enterprise Lab: Implement BGP Path Manipulation',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 40,
    difficulty: 'Advanced',
    scenario: 'Menerapkan manipulasi pemilihan jalur terbaik (BGP Best Path Selection) pada Router R1 yang terhubung multihomed ke AS tetangga (R2 AS 500 dan R3 AS 300). Mengimplementasikan parameter Weight (lokal ke router), Local Preference (disebarkan ke seluruh iBGP), AS-Path Prepending (mempengaruhi rute masuk dari AS eksternal), dan Multi-Exit Discriminator (MED) untuk kontrol rekayasa lalu lintas IPv4 dan IPv6.',
    objectives: [
      'Konfigurasi BGP router-id 1.1.1.1 dan no bgp default ipv4-unicast pada R1',
      'Manipulasi pemilihan jalur masuk menggunakan Local Preference via route-map USE_THIS_PATH_FOR_IPV4',
      'Manipulasi pemilihan rute masuk dari AS eksternal menggunakan AS-Path Prepending via route-map PREPEND_AS',
      'Konfigurasi MED via route-map SET_METRIC untuk mempengaruhi exit point pada upstream peers'
    ],
    tasks: [
      {
        id: 'task-ccnp-bgp4-1',
        description: 'Konfigurasi BGP AS 6500 dengan router-id 1.1.1.1 dan no bgp default ipv4-unicast pada R1',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'bgp_configured',
        expectedValue: { asNumber: 6500, routerId: '1.1.1.1', noBgpDefaultIpv4Unicast: true },
        hint: 'router bgp 6500 -> bgp router-id 1.1.1.1 -> no bgp default ipv4-unicast'
      },
      {
        id: 'task-ccnp-bgp4-2',
        description: 'Konfigurasi route-map USE_THIS_PATH_FOR_IPV4 dengan set local-preference 300 pada R1',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'route_map_clause',
        expectedValue: { name: 'USE_THIS_PATH_FOR_IPV4', sequence: 10, setLocalPreference: 300 },
        hint: 'route-map USE_THIS_PATH_FOR_IPV4 permit 10 -> set local-preference 300'
      },
      {
        id: 'task-ccnp-bgp4-3',
        description: 'Terapkan route-map USE_THIS_PATH_FOR_IPV4 inbound pada neighbor 10.1.3.130 under Address Family IPv4',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '10.1.3.130', routeMapIn: 'USE_THIS_PATH_FOR_IPV4', addressFamily: 'ipv4' },
        hint: 'router bgp 6500 -> address-family ipv4 unicast -> neighbor 10.1.3.130 route-map USE_THIS_PATH_FOR_IPV4 in'
      },
      {
        id: 'task-ccnp-bgp4-4',
        description: 'Konfigurasi route-map PREPEND_AS dengan set as-path prepend 6500 6500 pada R1',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'route_map_clause',
        expectedValue: { name: 'PREPEND_AS', sequence: 10, setAsPathPrepend: '6500 6500' },
        hint: 'route-map PREPEND_AS permit 10 -> set as-path prepend 6500 6500'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 250, y: 220 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 550, y: 140 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 550, y: 300 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/1', cableType: 'straight' }
      ]
    }
  },
  {
    id: 'lab-ccnp-bgp-05-mp-bgp',
    track: 'CCNP',
    category: 'BGP & MP-BGP',
    title: 'CCNP Enterprise Lab: Implement MP-BGP',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 40,
    difficulty: 'Advanced',
    scenario: 'Mengimplementasikan Multiprotocol BGP (MP-BGP) pada jaringan enterprise yang menjalankan routing dual-stack (IPv4 dan IPv6) antara R1 (AS 1000), R2 (AS 500), dan R3 (AS 300). Mengonfigurasi neighbor peering di bawah Address Family ipv4 unicast dan ipv6 unicast dengan aktivasi eksplisit, mengiklankan prefix dual-stack, serta melakukan agregasi dan peringkasan prefix IPv6 menggunakan aggregate-address summary-only.',
    objectives: [
      'Konfigurasi proses BGP AS 1000 dengan router-id 1.1.1.1 pada R1',
      'Aktifkan neighbor IPv4 di bawah address-family ipv4 unicast',
      'Aktifkan neighbor IPv6 di bawah address-family ipv6 unicast',
      'Iklankan prefix IPv4 dan IPv6 secara independen di setiap address family',
      'Lakukan peringkasan IPv6 pada R1 menggunakan aggregate-address 2001:db8:acad:1000::/52 summary-only'
    ],
    tasks: [
      {
        id: 'task-ccnp-bgp5-1',
        description: 'Konfigurasi proses BGP AS 1000 dengan router-id 1.1.1.1 pada Router R1',
        points: 20,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'bgp_configured',
        expectedValue: { asNumber: 1000, routerId: '1.1.1.1' },
        hint: 'router bgp 1000 -> bgp router-id 1.1.1.1'
      },
      {
        id: 'task-ccnp-bgp5-2',
        description: 'Aktifkan neighbor 10.1.2.2 under Address Family IPv4 pada Router R1',
        points: 20,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '10.1.2.2', activate: true, addressFamily: 'ipv4' },
        hint: 'router bgp 1000 -> address-family ipv4 unicast -> neighbor 10.1.2.2 activate'
      },
      {
        id: 'task-ccnp-bgp5-3',
        description: 'Aktifkan neighbor 2001:db8:acad:1012::2 under Address Family IPv6 pada Router R1',
        points: 20,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '2001:db8:acad:1012::2', activate: true, addressFamily: 'ipv6' },
        hint: 'router bgp 1000 -> address-family ipv6 unicast -> neighbor 2001:db8:acad:1012::2 activate'
      },
      {
        id: 'task-ccnp-bgp5-4',
        description: 'Iklankan prefix IPv6 2001:db8:acad:1001::/64 under Address Family IPv6 pada R1',
        points: 20,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'bgp_network',
        expectedValue: { network: '2001:db8:acad:1001::/64', addressFamily: 'ipv6' },
        hint: 'router bgp 1000 -> address-family ipv6 unicast -> network 2001:db8:acad:1001::/64'
      },
      {
        id: 'task-ccnp-bgp5-5',
        description: 'Konfigurasi aggregate-address 2001:db8:acad:1000::/52 summary-only under Address Family IPv6 pada R1',
        points: 20,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'bgp_aggregate_address',
        expectedValue: { prefix: '2001:db8:acad:1000::/52', summaryOnly: true, addressFamily: 'ipv6' },
        hint: 'router bgp 1000 -> address-family ipv6 unicast -> aggregate-address 2001:db8:acad:1000::/52 summary-only'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 250, y: 220 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 550, y: 140 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 550, y: 300 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/1', cableType: 'straight' }
      ]
    }
  },
  {
    id: 'lab-ccnp-bgp-06-troubleshoot-bgp',
    track: 'CCNP',
    category: 'BGP & MP-BGP',
    title: 'CCNP Enterprise Lab: Troubleshooting BGP',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 45,
    difficulty: 'Advanced',
    scenario: 'Melakukan pemecahan masalah (troubleshooting) jaringan BGP enterprise yang mengalami kegagalan propagasi rute dan ketidakkonsistenan pemilihan jalur: Trouble Ticket 20.1.1.1 (Edge router R1 dan R3 gagal memperbarui next-hop attribute ke alamat dirinya sendiri pada iBGP peering ke R2, menyebabkan rute eBGP tidak dapat dijangkau oleh internal AS) dan Trouble Ticket 20.1.1.2 (Rekayasa jalur gagal karena penggunaan atribut Weight yang bersifat non-transitif lokal ke router alih-alih Local Preference pada rute masuk).',
    objectives: [
      'Identifikasi dan perbaiki missing next-hop-self pada R1 untuk iBGP peering IPv4 dan IPv6 ke R2 (Ticket 20.1.1.1)',
      'Identifikasi dan perbaiki missing next-hop-self pada R3 untuk iBGP peering IPv4 dan IPv6 ke R2 (Ticket 20.1.1.1)',
      'Koreksi route-map manipulasi jalur pada R1 dengan mengganti set weight menjadi set local-preference 100 (Ticket 20.1.1.2)',
      'Koreksi route-map manipulasi jalur pada R3 dengan mengganti set weight menjadi set local-preference 400 (Ticket 20.1.1.2)'
    ],
    tasks: [
      {
        id: 'task-ccnp-bgp6-1',
        description: 'Perbaiki missing next-hop-self pada R1 untuk peering iBGP IPv4 ke 192.168.99.2 (Ticket 20.1.1.1)',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '192.168.99.2', nextHopSelf: true, addressFamily: 'ipv4' },
        hint: 'router bgp 65000 -> address-family ipv4 unicast -> neighbor 192.168.99.2 next-hop-self'
      },
      {
        id: 'task-ccnp-bgp6-2',
        description: 'Perbaiki missing next-hop-self pada R3 untuk peering iBGP IPv4 ke 192.168.99.2 (Ticket 20.1.1.1)',
        points: 25,
        type: 'config_check',
        targetDevice: 'R3',
        expectedProperty: 'bgp_neighbor',
        expectedValue: { neighborIp: '192.168.99.2', nextHopSelf: true, addressFamily: 'ipv4' },
        hint: 'router bgp 65000 -> address-family ipv4 unicast -> neighbor 192.168.99.2 next-hop-self'
      },
      {
        id: 'task-ccnp-bgp6-3',
        description: 'Koreksi route-map SET-LP pada Router R1 menjadi set local-preference 100 (Ticket 20.1.1.2)',
        points: 25,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'route_map_clause',
        expectedValue: { name: 'SET-LP', sequence: 10, setLocalPreference: 100 },
        hint: 'route-map SET-LP permit 10 -> set local-preference 100'
      },
      {
        id: 'task-ccnp-bgp6-4',
        description: 'Koreksi route-map SET-LP pada Router R3 menjadi set local-preference 400 (Ticket 20.1.1.2)',
        points: 25,
        type: 'config_check',
        targetDevice: 'R3',
        expectedProperty: 'route_map_clause',
        expectedValue: { name: 'SET-LP', sequence: 10, setLocalPreference: 400 },
        hint: 'route-map SET-LP permit 10 -> set local-preference 400'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'R1', hostname: 'R1', type: 'router', x: 220, y: 150 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 440, y: 150 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 660, y: 150 },
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 220, y: 320 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 660, y: 320 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D1', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' },
        { id: 'l4', sourceDeviceId: 'R3', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' }
      ]
    }
  },

  // ==========================================
  // ROUTING MANIPULATION & PBR LABS
  // ==========================================
  {
    id: 'lab-ccnp-rm-01-redistribution-eigrp-ospf',
    title: 'CCNP Enterprise: Configure Route Redistribution Between EIGRP and OSPF',
    track: 'CCNP',
    category: 'Routing Manipulation & PBR',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 60,
    difficulty: 'Advanced',
    scenario: 'Perusahaan multinasional sedang mengintegrasikan domain routing OSPFv3 dan EIGRP Named Mode pada ASBR Router R2. Anda ditugaskan mengonfigurasi redistribusi dua arah (two-way redistribution) untuk IPv4 dan IPv6 antara OSPFv3 Process 1 dan EIGRP CISCO AS 64512 dengan seed metric yang tepat dan include-connected, sehingga seluruh host dan loopback di kedua domain routing dapat saling berkomunikasi secara penuh.',
    objectives: [
      'Konfigurasi routing OSPFv3 Process 1 pada Router R1, Switch D1, dan Router R2 (Area 0 dan Area 11).',
      'Konfigurasi EIGRP Named Mode (CISCO, AS 64512) pada Router R2, Router R3, dan Switch D2 untuk IPv4 dan IPv6.',
      'Konfigurasi redistribusi OSPFv3 ke EIGRP pada ASBR R2 dengan seed metric 1000000 10 255 1 1500 (IPv4) dan default-metric include-connected (IPv6).',
      'Konfigurasi redistribusi EIGRP ke OSPFv3 pada ASBR R2 dengan metric-type 1 (IPv4) dan route-map E2O include-connected (IPv6).',
      'Verifikasi tabel routing dan konektivitas end-to-end IPv4 dan IPv6 di seluruh topologi.'
    ],
    tasks: [
      {
        id: 'task-ccnp-rm1-1',
        description: 'Pastikan OSPFv3 Process 1 aktif pada Router R1 dengan passive-interface Loopback0',
        points: 10,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'ospfv3_enabled',
        expectedValue: 1,
        hint: 'router ospfv3 1 -> address-family ipv4 unicast -> passive-interface Loopback0'
      },
      {
        id: 'task-ccnp-rm1-2',
        description: 'Pastikan OSPFv3 Process 1 aktif pada Switch D1',
        points: 10,
        type: 'config_check',
        targetDevice: 'D1',
        expectedProperty: 'ospfv3_enabled',
        expectedValue: 1,
        hint: 'router ospfv3 1 -> router-id 11.11.11.11'
      },
      {
        id: 'task-ccnp-rm1-3',
        description: 'Pastikan EIGRP Named Mode CISCO AS 64512 IPv4 dan IPv6 aktif pada Router R3',
        points: 10,
        type: 'config_check',
        targetDevice: 'R3',
        expectedProperty: 'eigrp_configured',
        expectedValue: 64512,
        hint: 'router eigrp CISCO -> address-family ipv4 unicast autonomous-system 64512'
      },
      {
        id: 'task-ccnp-rm1-4',
        description: 'Pastikan EIGRP Named Mode CISCO AS 64512 aktif pada Switch D2',
        points: 10,
        type: 'config_check',
        targetDevice: 'D2',
        expectedProperty: 'eigrp_configured',
        expectedValue: 64512,
        hint: 'router eigrp CISCO -> address-family ipv4 unicast autonomous-system 64512'
      },
      {
        id: 'task-ccnp-rm1-5',
        description: 'Konfigurasi OSPFv3 Process 1 pada ASBR Router R2',
        points: 10,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'ospfv3_enabled',
        expectedValue: 1,
        hint: 'router ospfv3 1 -> router-id 2.2.2.2'
      },
      {
        id: 'task-ccnp-rm1-6',
        description: 'Konfigurasi EIGRP Named Mode CISCO AS 64512 pada ASBR Router R2',
        points: 10,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'eigrp_configured',
        expectedValue: 64512,
        hint: 'router eigrp CISCO -> address-family ipv4 unicast autonomous-system 64512'
      },
      {
        id: 'task-ccnp-rm1-7',
        description: 'Konfigurasi redistribusi OSPFv3 ke EIGRP IPv4 pada R2 dengan seed metric 1000000 10 255 1 1500',
        points: 10,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'redistribution_configured',
        expectedValue: { protocol: 'eigrp', redisProtocol: 'ospfv3', asOrProcessId: 1, metric: 1000000 },
        hint: 'router eigrp CISCO -> address-family ipv4 unicast autonomous-system 64512 -> topology base -> redistribute ospfv3 1 metric 1000000 10 255 1 1500'
      },
      {
        id: 'task-ccnp-rm1-8',
        description: 'Konfigurasi redistribusi OSPF ke EIGRP IPv6 pada R2 dengan default-metric dan include-connected',
        points: 10,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'redistribution_configured',
        expectedValue: { protocol: 'eigrp-v6', redisProtocol: 'ospf', asOrProcessId: 1 },
        hint: 'address-family ipv6 unicast autonomous-system 64512 -> topology base -> default-metric 1000000 10 255 1 1500 -> redistribute ospf 1 include-connected'
      },
      {
        id: 'task-ccnp-rm1-9',
        description: 'Konfigurasi redistribusi EIGRP 64512 ke OSPFv3 IPv4 pada R2 dengan metric-type 1',
        points: 10,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'redistribution_configured',
        expectedValue: { protocol: 'ospfv3', af: 'ipv4', redisProtocol: 'eigrp', asOrProcessId: 64512, metricType: 'type-1' },
        hint: 'router ospfv3 1 -> address-family ipv4 unicast -> redistribute eigrp 64512 metric-type 1'
      },
      {
        id: 'task-ccnp-rm1-10',
        description: 'Konfigurasi route-map E2O dan redistribusi EIGRP ke OSPFv3 IPv6 pada R2',
        points: 10,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'redistribution_configured',
        expectedValue: { protocol: 'ospfv3', af: 'ipv6', redisProtocol: 'eigrp', asOrProcessId: 64512, routeMap: 'E2O' },
        hint: 'route-map E2O permit 10 -> set metric-type type-1; router ospfv3 1 -> address-family ipv6 unicast -> redistribute eigrp 64512 route-map E2O include-connected'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 100, y: 220 },
        { id: 'R1', hostname: 'R1', type: 'router', x: 280, y: 220 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 460, y: 220 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 640, y: 220 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 820, y: 220 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'D1', sourcePort: 'GigabitEthernet1/0/11', targetDeviceId: 'R1', targetPort: 'GigabitEthernet0/0/1', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l4', sourceDeviceId: 'R3', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' }
      ]
    }
  },
  {
    id: 'lab-ccnp-rm-02-manipulate-redistribution',
    title: 'CCNP Enterprise: Manipulate Route Redistribution',
    track: 'CCNP',
    category: 'Routing Manipulation & PBR',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 60,
    difficulty: 'Advanced',
    scenario: 'Setelah redistribusi dua arah berjalan, tim arsitek jaringan menerapkan kebijakan kontrol rute untuk mencegah perutean suboptimal dan menghemat tabel routing. Anda diminta memfilter subnet 10.10.x.x dari OSPF agar tidak masuk ke domain EIGRP menggunakan distribute-list dengan ACL standard pada Router R2. Selanjutnya, gunakan prefix-list dan route-map RED_TO_OSPF pada R2 untuk hanya mengizinkan prefix 172.16.0.0/16 (le 24) dari EIGRP yang diredistribusikan ke OSPF dengan metric yang dimodifikasi menjadi 25.',
    objectives: [
      'Verifikasi redistribusi dasar antara OSPFv3 dan EIGRP pada ASBR Router R2.',
      'Konfigurasi standard access-list 5 pada R2 untuk memblokir subnet 10.10.41.0/24 - 10.10.44.0/24 dan mengizinkan lainnya.',
      'Terapkan distribute-list 5 out GigabitEthernet0/0/1 di bawah EIGRP topology base pada R2.',
      'Konfigurasi ip prefix-list EIGRP_TO_OSPF pada R2 untuk mencocokkan subnet 172.16.0.0/16 le 24.',
      'Buat route-map RED_TO_OSPF yang mencocokkan prefix-list tersebut dan menyetel metric menjadi 25.',
      'Terapkan route-map RED_TO_OSPF pada redistribusi EIGRP ke OSPFv3 IPv4 di Router R2.',
      'Verifikasi tabel routing pada Switch D1 dan Switch D2 untuk memastikan rute terfilter sesuai kebijakan.'
    ],
    tasks: [
      {
        id: 'task-ccnp-rm2-1',
        description: 'Konfigurasi standard access-list 5 pada R2 untuk deny 10.10.41.0-44.0/24 dan permit any',
        points: 20,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'access_list',
        expectedValue: 5,
        hint: 'access-list 5 deny 10.10.41.0 0.0.0.255 ... access-list 5 permit any'
      },
      {
        id: 'task-ccnp-rm2-2',
        description: 'Terapkan distribute-list 5 out GigabitEthernet0/0/1 pada EIGRP topology base di R2',
        points: 20,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'distribute_list',
        expectedValue: { protocol: 'eigrp', acl: 5, direction: 'out', interfaceName: 'GigabitEthernet0/0/1' },
        hint: 'router eigrp CISCO -> address-family ipv4 unicast autonomous-system 64512 -> topology base -> distribute-list 5 out GigabitEthernet0/0/1'
      },
      {
        id: 'task-ccnp-rm2-3',
        description: 'Konfigurasi ip prefix-list EIGRP_TO_OSPF seq 5 permit 172.16.0.0/16 le 24 pada R2',
        points: 20,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'prefix_list_exists',
        expectedValue: 'EIGRP_TO_OSPF',
        hint: 'ip prefix-list EIGRP_TO_OSPF seq 5 permit 172.16.0.0/16 le 24'
      },
      {
        id: 'task-ccnp-rm2-4',
        description: 'Konfigurasi route-map RED_TO_OSPF dengan match prefix-list dan set metric 25 pada R2',
        points: 20,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'route_map_clause',
        expectedValue: { name: 'RED_TO_OSPF', sequence: 10, matchPrefixList: 'EIGRP_TO_OSPF', setMetric: 25 },
        hint: 'route-map RED_TO_OSPF permit 10 -> match ip address prefix-list EIGRP_TO_OSPF -> set metric 25'
      },
      {
        id: 'task-ccnp-rm2-5',
        description: 'Terapkan route-map RED_TO_OSPF pada redistribusi EIGRP ke OSPFv3 IPv4 di R2',
        points: 20,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'redistribution_configured',
        expectedValue: { protocol: 'ospfv3', af: 'ipv4', redisProtocol: 'eigrp', asOrProcessId: 64512, routeMap: 'RED_TO_OSPF' },
        hint: 'router ospfv3 1 -> address-family ipv4 unicast -> redistribute eigrp 64512 metric-type 1 route-map RED_TO_OSPF'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 100, y: 220 },
        { id: 'R1', hostname: 'R1', type: 'router', x: 280, y: 220 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 460, y: 220 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 640, y: 220 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 820, y: 220 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'D1', sourcePort: 'GigabitEthernet1/0/11', targetDeviceId: 'R1', targetPort: 'GigabitEthernet0/0/1', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l4', sourceDeviceId: 'R3', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' }
      ]
    }
  },
  {
    id: 'lab-ccnp-rm-03-path-control-pbr',
    title: 'CCNP Enterprise: Path Control Using Policy-Based Routing (PBR)',
    track: 'CCNP',
    category: 'Routing Manipulation & PBR',
    domain: 'CCNP Enterprise: Advanced Routing & Services',
    estimatedMinutes: 60,
    difficulty: 'Advanced',
    scenario: 'Dalam topologi dual-path redundan perusahaan, OSPF Area 0 memilih tautan GigabitEthernet berkecepatan tinggi melalui Router R2 sebagai jalur optimal menuju Switch D2, sedangkan tautan Serial R1-R3 hanya menjadi jalur cadangan karena memiliki cost OSPF yang lebih tinggi. Untuk mendistribusikan beban trafik (load-sharing) dan memprioritaskan paket tertentu, Anda diminta mengonfigurasi Policy-Based Routing (PBR) pada Router R1. Gunakan named standard ACL Lo2-ACL dan route-map R1-to-R3 untuk mengarahkan trafik asal D1 Loopback 2 (10.10.2.0/24) langsung melewati tautan Serial ke next-hop R3 172.16.2.2. Selanjutnya, konfigurasi Local PBR menggunakan named extended ACL R1-TRAFFIC dan route-map LOCAL-PBR untuk mengarahkan trafik ICMP / IP yang dibangkitkan secara lokal oleh Router R1 menuju 192.168.1.0/24 ke jalur Serial tersebut.',
    objectives: [
      'Konfigurasi pengalamatan IP dan OSPF 123 Area 0 dengan auto-cost reference-bandwidth 1000 pada seluruh router dan switch.',
      'Verifikasi jalur normal OSPF dari D1 menuju subnet Loopback D2 melalui GigabitEthernet R1 -> R2 -> R3.',
      'Buat standard named ACL Lo2-ACL pada R1 untuk mencocokkan trafik dari 10.10.2.0/24.',
      'Buat route-map R1-to-R3 pada R1 yang mengarahkan trafik matching ke set ip next-hop 172.16.2.2.',
      'Terapkan PBR pada interface R1 GigabitEthernet0/0/1 menggunakan perintah ip policy route-map R1-to-R3.',
      'Buat extended named ACL R1-TRAFFIC pada R1 untuk mencocokkan trafik lokal IP menuju 192.168.1.0/24.',
      'Buat route-map LOCAL-PBR pada R1 dengan set ip next-hop 172.16.2.2.',
      'Terapkan Local PBR pada Router R1 menggunakan ip local policy route-map LOCAL-PBR.',
      'Verifikasi keberhasilan PBR dan pencocokan paket menggunakan show route-map dan show ip policy.'
    ],
    tasks: [
      {
        id: 'task-ccnp-pbr-1',
        description: 'Konfigurasi OSPF 123 Process pada Router R1',
        points: 10,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'ospf_configured',
        expectedValue: 123,
        hint: 'router ospf 123 -> router-id 1.1.1.1'
      },
      {
        id: 'task-ccnp-pbr-2',
        description: 'Konfigurasi OSPF 123 Process pada Router R2',
        points: 10,
        type: 'config_check',
        targetDevice: 'R2',
        expectedProperty: 'ospf_configured',
        expectedValue: 123,
        hint: 'router ospf 123 -> router-id 2.2.2.1'
      },
      {
        id: 'task-ccnp-pbr-3',
        description: 'Konfigurasi OSPF 123 Process pada Router R3',
        points: 10,
        type: 'config_check',
        targetDevice: 'R3',
        expectedProperty: 'ospf_configured',
        expectedValue: 123,
        hint: 'router ospf 123 -> router-id 3.3.3.1'
      },
      {
        id: 'task-ccnp-pbr-4',
        description: 'Konfigurasi named standard ACL Lo2-ACL pada Router R1',
        points: 15,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'named_acl_exists',
        expectedValue: 'Lo2-ACL',
        hint: 'ip access-list standard Lo2-ACL -> permit 10.10.2.0 0.0.0.255'
      },
      {
        id: 'task-ccnp-pbr-5',
        description: 'Konfigurasi route-map R1-to-R3 match Lo2-ACL dan set ip next-hop 172.16.2.2 pada R1',
        points: 15,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'route_map_clause',
        expectedValue: { name: 'R1-to-R3', sequence: 10, matchAcl: 'Lo2-ACL', setIpNextHop: '172.16.2.2' },
        hint: 'route-map R1-to-R3 permit 10 -> match ip address Lo2-ACL -> set ip next-hop 172.16.2.2'
      },
      {
        id: 'task-ccnp-pbr-6',
        description: 'Terapkan PBR route-map R1-to-R3 pada interface R1 GigabitEthernet0/0/1',
        points: 15,
        type: 'config_check',
        targetDevice: 'R1',
        targetInterface: 'GigabitEthernet0/0/1',
        expectedProperty: 'pbr_interface_policy',
        expectedValue: 'R1-to-R3',
        hint: 'interface GigabitEthernet0/0/1 -> ip policy route-map R1-to-R3'
      },
      {
        id: 'task-ccnp-pbr-7',
        description: 'Konfigurasi named extended ACL R1-TRAFFIC pada Router R1',
        points: 10,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'named_acl_exists',
        expectedValue: 'R1-TRAFFIC',
        hint: 'ip access-list extended R1-TRAFFIC -> permit ip any 192.168.1.0 0.0.0.255'
      },
      {
        id: 'task-ccnp-pbr-8',
        description: 'Konfigurasi route-map LOCAL-PBR match R1-TRAFFIC dan set ip next-hop 172.16.2.2 pada R1',
        points: 15,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'route_map_clause',
        expectedValue: { name: 'LOCAL-PBR', sequence: 10, matchAcl: 'R1-TRAFFIC', setIpNextHop: '172.16.2.2' },
        hint: 'route-map LOCAL-PBR permit 10 -> match ip address R1-TRAFFIC -> set ip next-hop 172.16.2.2'
      },
      {
        id: 'task-ccnp-pbr-9',
        description: 'Terapkan Local PBR route-map LOCAL-PBR secara global pada Router R1',
        points: 10,
        type: 'config_check',
        targetDevice: 'R1',
        expectedProperty: 'pbr_local_policy',
        expectedValue: 'LOCAL-PBR',
        hint: 'ip local policy route-map LOCAL-PBR'
      }
    ],
    initialTopology: {
      devices: [
        { id: 'D1', hostname: 'D1', type: 'switch-l3', x: 100, y: 220 },
        { id: 'R1', hostname: 'R1', type: 'router', x: 280, y: 220 },
        { id: 'R2', hostname: 'R2', type: 'router', x: 460, y: 150 },
        { id: 'R3', hostname: 'R3', type: 'router', x: 640, y: 220 },
        { id: 'D2', hostname: 'D2', type: 'switch-l3', x: 820, y: 220 }
      ],
      links: [
        { id: 'l1', sourceDeviceId: 'D1', sourcePort: 'GigabitEthernet1/0/11', targetDeviceId: 'R1', targetPort: 'GigabitEthernet0/0/1', cableType: 'straight' },
        { id: 'l2', sourceDeviceId: 'R1', sourcePort: 'GigabitEthernet0/0/0', targetDeviceId: 'R2', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l3', sourceDeviceId: 'R2', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'R3', targetPort: 'GigabitEthernet0/0/0', cableType: 'straight' },
        { id: 'l4', sourceDeviceId: 'R1', sourcePort: 'Serial0/1/0', targetDeviceId: 'R3', targetPort: 'Serial0/1/0', cableType: 'serial' },
        { id: 'l5', sourceDeviceId: 'R3', sourcePort: 'GigabitEthernet0/0/1', targetDeviceId: 'D2', targetPort: 'GigabitEthernet1/0/11', cableType: 'straight' }
      ]
    }
  }
];
