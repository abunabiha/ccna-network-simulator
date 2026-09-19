# DOKUMEN PERANCANGAN SISTEM (SOFTWARE DESIGN DOCUMENT - SDD)
## Berdasarkan Standar IEEE Std 1016-2009
### Proyek: CCNA NetSim Pro - Cisco Network Simulator & Auto-Grader

---

## 1. Ikhtisar Arsitektur Sistem (System Architectural Overview)

Sistem **CCNA NetSim Pro** dirancang menggunakan arsitektur berlapis (*Layered & Component-Based Architecture*) yang memisahkan secara tegas antara lapisan antarmuka pengguna (*Presentation*), logika eksekusi perintah (*CLI Engine*), kernel protokol simulasi (*Network Kernel*), dan modul asesmen laboratorium (*Auto-Grading Engine*).

```mermaid
graph TD
    subgraph UI_Layer["1. Presentation Layer (React + Tailwind + SVG)"]
        TC[Topology Canvas Component]
        CT[Cisco IOS Terminal Emulator]
        LP[Lab Curriculum & Task Panel]
        PI[OSI 7-Layer PDU Inspector]
        GM[Auto-Grade Scorecard Modal]
    end

    subgraph State_Layer["2. Application State Management (Zustand)"]
        NS[Network Topology Store]
        TS[Terminal Session Store]
        SS[Simulation & Event Queue Store]
        LS[Lab Progression Store]
    end

    subgraph Core_Engine["3. Domain Simulation Kernel"]
        CLI[Cisco IOS Parser & Lexer FSM]
        DEV[Device Polymorphic Models: Router, Switch, Host]
        L2[L2 Engine: VLAN 802.1Q, STP, MAC Table]
        L3[L3 Engine: Routing Table, OSPFv2, Longest Prefix]
        SVC[Services: DHCP Server/Relay, NAT/PAT, ACL Filter]
    end

    subgraph Assessment_Engine["4. Pedagogical & Grading Subsystem"]
        LG[Rule-Based Lab Grader]
        VE[Config Validator & State Auditor]
        PM[Ping Reachability Matrix Tester]
    end

    UI_Layer <--> State_Layer
    State_Layer <--> Core_Engine
    State_Layer <--> Assessment_Engine
    Assessment_Engine --> Core_Engine
```

---

## 2. Dekomposisi Subsistem & Komponen

### 2.1 Subsistem Cisco IOS CLI & Finite State Machine (FSM)
Parser CLI Cisco mengimplementasikan mesin keadaan berhingga (*Finite State Machine*) untuk mengelola navigasi hierarki mode eksekusi perintah Cisco IOS secara ketat:

```mermaid
stateDiagram-v2
    [*] --> UserExec : Connect Console
    UserExec --> PrivilegedExec : enable
    PrivilegedExec --> UserExec : disable
    PrivilegedExec --> GlobalConfig : configure terminal
    GlobalConfig --> PrivilegedExec : exit / end / Ctrl+Z
    
    GlobalConfig --> InterfaceConfig : interface <id>
    InterfaceConfig --> GlobalConfig : exit
    InterfaceConfig --> PrivilegedExec : end / Ctrl+Z

    GlobalConfig --> SubInterfaceConfig : interface <id.subid>
    SubInterfaceConfig --> GlobalConfig : exit
    SubInterfaceConfig --> PrivilegedExec : end / Ctrl+Z

    GlobalConfig --> RouterOspfConfig : router ospf <pid>
    RouterOspfConfig --> GlobalConfig : exit
    RouterOspfConfig --> PrivilegedExec : end / Ctrl+Z

    GlobalConfig --> VlanConfig : vlan <id>
    VlanConfig --> GlobalConfig : exit
    VlanConfig --> PrivilegedExec : end / Ctrl+Z

    GlobalConfig --> LineConfig : line con 0 / line vty 0 4
    LineConfig --> GlobalConfig : exit
    LineConfig --> PrivilegedExec : end / Ctrl+Z
```

Tabel Transisi Keadaan Prompt:
| Mode CLI | Tampilan Prompt | Perintah Masuk Utama | Perintah Keluar |
| :--- | :--- | :--- | :--- |
| **User EXEC** | `Router>` | Inisialisasi sesi | `exit` (disconnect) |
| **Privileged EXEC** | `Router#` | `enable` | `disable`, `exit` |
| **Global Config** | `Router(config)#` | `configure terminal` | `exit`, `end` |
| **Interface Config** | `Router(config-if)#` | `interface GigabitEthernet0/0` | `exit`, `end` |
| **Sub-Interface Config**| `Router(config-subif)#`| `interface GigabitEthernet0/0.10` | `exit`, `end` |
| **VLAN Config** | `Router(config-vlan)#` | `vlan 10` | `exit`, `end` |
| **Router OSPF Config** | `Router(config-router)#`| `router ospf 1` | `exit`, `end` |
| **Line Config** | `Router(config-line)#` | `line console 0` | `exit`, `end` |

---

## 3. Diagram Kelas Sistem (UML Class Diagram)

```mermaid
classDiagram
    class Device {
        <<abstract>>
        +string id
        +string hostname
        +string deviceType
        +Map~string, Interface~ interfaces
        +Map~string, any~ configState
        +executeCommand(cmd: string, context: CliContext) CliResult
        +getRunningConfig() string
    }

    class Router {
        +RoutingTable routingTable
        +OspfProcess ospfProcess
        +DhcpServer dhcpServer
        +NatTable natTable
        +List~AclRule~ accessLists
        +resolveNextHop(destIp: string) NextHopInfo
    }

    class Switch {
        +Map~number, Vlan~ vlanDatabase
        +MacAddressTable macTable
        +StpState stpState
        +forwardFrame(frame: EthernetFrame, inPort: string)
    }

    class Host {
        +string ipAddress
        +string subnetMask
        +string defaultGateway
        +string dnsServer
        +ping(destIp: string) PingResult
    }

    class Interface {
        +string name
        +string macAddress
        +string ipAddress
        +string subnetMask
        +boolean isUp
        +boolean isShutdown
        +string switchportMode
        +number accessVlan
        +List~number~ allowedVlans
        +number nativeVlan
    }

    class Link {
        +string id
        +string sourceDeviceId
        +string sourcePort
        +string targetDeviceId
        +string targetPort
        +string cableType
        +boolean isConnected
    }

    Device <|-- Router
    Device <|-- Switch
    Device <|-- Host
    Device "1" *-- "many" Interface : contains
    Link --> Interface : connects
```

---

## 4. Diagram Sekuens Alur Paket & Inspeksi OSI (Sequence Diagram)

Diagram berikut mengilustrasikan alur pemrosesan transmisi paket ICMP Echo (Ping) dari Host1 melalui Switch1 dan Router1 ke Host2 dalam mode simulasi:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Host1 as Host 1 (PC)
    participant SW1 as Switch 1 (L2)
    participant R1 as Router 1 (Default GW)
    participant Host2 as Host 2 (PC)
    participant UI as OSI 7-Layer Inspector

    User->>Host1: ping 192.168.2.10
    Host1->>Host1: Evaluasi Subnet (Different Subnet -> Gateway ARP)
    Host1->>SW1: Kirim Frame L2 (Dst MAC: R1 MAC, Dst IP: 192.168.2.10)
    SW1->>SW1: Update MAC Table & Forward based on VLAN 802.1Q
    SW1->>R1: Forward Frame ke Trunk/Access Port R1
    
    R1->>R1: L2 Decapsulation -> Periksa Dst IP
    R1->>R1: Evaluasi Access-List (Permit/Deny)
    R1->>R1: Lookup Routing Table (Longest Prefix Match)
    R1->>R1: Decrement TTL, Re-encapsulate L2 Frame
    
    R1->>Host2: Forward Packet ke Target Subnet
    Host2->>Host2: Terima ICMP Echo Request -> Generate Echo Reply
    Host2-->>R1: Kirim ICMP Echo Reply
    R1-->>SW1: Forward Reply
    SW1-->>Host1: Forward Reply
    Host1-->>User: "Reply from 192.168.2.10: bytes=32 time<1ms TTL=127"
    
    User->>UI: Klik Event PDU di Router 1
    UI-->>User: Tampilkan In-Layers (L2 MAC, L3 IP) vs Out-Layers (Next-hop MAC, Updated TTL)
```

---

## 5. Subsistem Penilaian Otomatis (Lab Auto-Grader Architecture)

Mesin penilaian otomatis (*Lab Auto-Grader*) bekerja secara deterministik melalui metode audit berjenjang:
1. **Pemeriksaan Deklaratif (Running-Config AST Inspection)**: Memverifikasi keberadaan sintaks wajib (misal: `ip address`, `encapsulation dot1Q`, `switchport mode trunk`, `router ospf 1`).
2. **Pemeriksaan Keadaan Operasional (Operational State Verification)**: Memeriksa apakah status antarmuka bernilai `up/up`, apakah tabel rute memiliki rute yang diharapkan, dan apakah neighbor OSPF berstatus `FULL`.
3. **Pemeriksaan Verifikasi Fungsional (Data Plane Ping Matrix)**: Menguji konektivitas aktual dengan mengirimkan virtual ping antar node yang ditargetkan dalam skenario lab.
4. **Aturan Evaluasi Kelulusan Ketat (*Strict 100% Mastery Rule*)**: Mengikuti prinsip pedagogis *mastery learning*, kandidat hanya dinyatakan *Passed* jika dan hanya jika seluruh tugas lab terpenuhi secara sempurna tanpa kegagalan (`score === 100%`).

---

## 6. Arsitektur Live Physical Device Connector & Host NIC Bridge

Subsistem ini menjembatani lingkungan simulasi berbasis peramban (*browser sandbox*) dengan infrastruktur jaringan fisik nyata pada komputer host pengguna:

```mermaid
graph LR
    subgraph Browser_Sandbox["Web Sandbox Environment"]
        Topology["Canvas Device / Cloud Node"]
        Connector["LiveDeviceConnectorModal"]
        PingEngine["ICMP Latency Measurement Engine"]
    end

    subgraph Host_Physical_Stack["User Host & Physical Network"]
        NIC["Host NIC (en0/Wi-Fi, en1/Ethernet, lo0)"]
        GW["Default Gateway (e.g., 192.168.1.1)"]
        RouterPhysical["Physical Cisco Router / Switch (SSH/Telnet)"]
        RemoteEndpoints["External IP Endpoints / Internet"]
    end

    Topology <--> Connector
    Connector <--> NIC
    NIC <--> GW
    NIC <--> RouterPhysical
    GW <--> RemoteEndpoints
    PingEngine <--> RemoteEndpoints
```

Tiga Modus Operasional:
1. **Host NIC Bridging**: Menautkan node awan (*Cloud Bridge*) ke antarmuka fisik lokal (seperti `en0`, `en1`, atau `lo0`) dan mengidentifikasi default gateway komputer host secara otomatis.
2. **Direct Hardware Connection**: Membuka sesi interaktif via SSH (port 22), Telnet (port 23), atau Cisco RESTCONF/NX-API (port 443) ke perangkat keras Cisco fisik dengan autentikasi kredensial dan logging riwayat perintah.
3. **Real-Time ICMP Ping Tester**: Melakukan pengujian latensi transmisi paket (RTT dalam milidetik) dan time-to-live (TTL) secara langsung ke IP target di jaringan fisik.

---

## 7. Arsitektur Pearson VUE Authentic Exam Engine

Subsistem ujian meniru persis arsitektur perangkat lunak pengujian sertifikasi resmi Pearson VUE untuk ujian Cisco CCNA 200-301 (v1.1):

```mermaid
graph TD
    ExamSession["Pearson VUE Exam Session Controller (120 min countdown)"]
    
    subgraph Question_Models["Authentic Question Taxonomies"]
        MC["Multiple Choice (Single & Multiple Select)"]
        DND["Drag-and-Drop Matching Engine (Bipartite Graph Matching)"]
        SIM["Simlet Performance-Based Interactive Lab (Embedded Cisco IOS CLI)"]
    end

    subgraph Scoring_Breakdown["Domain Mastery Evaluator"]
        D1["1. Network Fundamentals (20%)"]
        D2["2. Network Access (20%)"]
        D3["3. IP Connectivity (25%)"]
        D4["4. IP Services (10%)"]
        D5["5. Security Fundamentals (15%)"]
        D6["6. Automation & Programmability (10%)"]
        TotalReport["Pearson VUE Score Report (Scaled Score 300-1000 & 100% Mastery)"]
    end

    ExamSession --> Question_Models
    Question_Models --> Scoring_Breakdown
    Scoring_Breakdown --> TotalReport
```

1. **Drag-and-Drop Bipartite Matching**: Kandidat memetakan kumpulan item sumber (*draggable concepts*) ke slot target (*drop zones*). Validasi jawaban dinilai menggunakan verifikasi pencocokan pasangan terurut $(s_i, t_j)$.
2. **Simlet Interactive Lab Engine**: Kandidat diberikan skenario troubleshooting/konfigurasi performa nyata. Komponen memuat instansi virtual Router/Switch independen lengkap dengan sub-CLI parser dan mengevaluasi status perangkat (*live running state verification*).
3. **Pearson VUE Scaled Scoring**: Skor akhir ditransformasikan ke skala standar 300–1000 poin dengan rincian capaian persentase per domain kurikulum CCNA.
