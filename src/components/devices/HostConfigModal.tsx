import React, { useState, useEffect } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { Host } from '../../core/devices/Host';
import { SubnetUtils } from '../../core/network/Subnet';
import { TopologyTraversal } from '../../core/network/TopologyTraversal';
import { CiscoPcIcon, CiscoServerIcon } from '../common/CiscoIcons';
import { 
  X, 
  Settings, 
  Terminal, 
  Check, 
  AlertCircle, 
  Globe, 
  Network
} from 'lucide-react';

interface HostConfigModalProps {
  hostId: string | null;
  onClose: () => void;
}

// Duck-typing validator for Host device to avoid HMR prototype mismatch
const isHostDevice = (d: any): d is Host => {
  return !!d && (
    d instanceof Host ||
    d.deviceType === 'pc' ||
    d.deviceType === 'server' ||
    d.deviceType === 'cloud' ||
    'isDhcp' in d
  );
};

export const HostConfigModal: React.FC<HostConfigModalProps> = ({ hostId, onClose }) => {
  const host = useNetworkStore((state) => {
    if (!hostId) return undefined;
    return state.devices.find(d => d.id === hostId) || useNetworkStore.getState().devices.find(d => d.id === hostId);
  });
  const updateHostConfig = useNetworkStore((state) => state.updateHostConfig);

  const [activeTab, setActiveTab] = useState<'ip' | 'prompt'>('ip');
  
  // Local form state
  const [isDhcp, setIsDhcp] = useState<boolean>(false);
  const [ipAddress, setIpAddress] = useState<string>('');
  const [subnetMask, setSubnetMask] = useState<string>('');
  const [defaultGateway, setDefaultGateway] = useState<string>('');
  const [dnsServer, setDnsServer] = useState<string>('');
  
  const [isIpv6Auto, setIsIpv6Auto] = useState<boolean>(true);
  const [ipv6Address, setIpv6Address] = useState<string>('');
  const [ipv6Gateway, setIpv6Gateway] = useState<string>('');

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when host changes or modal opens
  useEffect(() => {
    if (host && isHostDevice(host)) {
      const h = host as Host;
      setIsDhcp(!!h.isDhcp);
      setIpAddress(h.ipAddress || '');
      setSubnetMask(h.subnetMask || '');
      setDefaultGateway(h.defaultGateway || '');
      setDnsServer(h.dnsServer || '');
    }
  }, [host]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!host || !isHostDevice(host)) return null;

  const hostDev = host as Host;
  const iface = hostDev.interfaces?.get('FastEthernet0') || Array.from(hostDev.interfaces?.values?.() || [])[0];

  // Auto-fill subnet mask based on class if user leaves it empty
  const handleIpChange = (val: string) => {
    setIpAddress(val);
    const trimmed = val.trim();
    if (!subnetMask && SubnetUtils.isValidIpv4(trimmed)) {
      setSubnetMask(SubnetUtils.getDefaultSubnetMask(trimmed));
    }
  };

  const handleIpBlur = () => {
    const trimmed = ipAddress.trim();
    if (trimmed && !subnetMask && SubnetUtils.isValidIpv4(trimmed)) {
      setSubnetMask(SubnetUtils.getDefaultSubnetMask(trimmed));
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveMessage(null);

    const trimmedIp = ipAddress.trim();
    let finalMask = subnetMask.trim();
    const trimmedGw = defaultGateway.trim();
    const trimmedDns = dnsServer.trim();

    if (!isDhcp) {
      if (trimmedIp) {
        if (!SubnetUtils.isValidIpv4(trimmedIp)) {
          setErrorMessage('Alamat IPv4 tidak valid. Format harus X.X.X.X (0-255).');
          return;
        }
        if (!finalMask) {
          finalMask = SubnetUtils.getDefaultSubnetMask(trimmedIp);
          setSubnetMask(finalMask);
        } else if (!SubnetUtils.isValidSubnetMask(finalMask)) {
          setErrorMessage('Subnet mask tidak valid.');
          return;
        }
      }
      if (trimmedGw && !SubnetUtils.isValidIpv4(trimmedGw)) {
        setErrorMessage('Default Gateway tidak valid.');
        return;
      }
      if (trimmedDns && !SubnetUtils.isValidIpv4(trimmedDns)) {
        setErrorMessage('DNS Server tidak valid.');
        return;
      }
    }

    // Update Zustand store and notify all subscribers
    updateHostConfig(host.id, {
      isDhcp,
      ipAddress: trimmedIp,
      subnetMask: finalMask || (isDhcp ? '255.255.0.0' : '255.255.255.0'),
      defaultGateway: trimmedGw,
      dnsServer: trimmedDns,
      ipv6Address,
      ipv6Gateway
    });

    setSaveMessage('Konfigurasi IP berhasil diterapkan & disimpan!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleDhcpToggle = (val: boolean) => {
    setIsDhcp(val);
    setErrorMessage(null);
    setSaveMessage(null);

    if (val) {
      // Jalankan permohonan DHCP nyata pada domain broadcast Layer 2
      const allDevs = useNetworkStore.getState().devices;
      const dhcpRes = TopologyTraversal.acquireHostDhcp(hostDev, allDevs);
      setIpAddress(dhcpRes.ipAddress);
      setSubnetMask(dhcpRes.subnetMask);
      setDefaultGateway(dhcpRes.defaultGateway);
      setDnsServer(dhcpRes.dnsServer);

      // Otomatis simpan ke store
      updateHostConfig(host.id, {
        isDhcp: true,
        ipAddress: dhcpRes.ipAddress,
        subnetMask: dhcpRes.subnetMask,
        defaultGateway: dhcpRes.defaultGateway,
        dnsServer: dhcpRes.dnsServer,
        ipv6Address,
        ipv6Gateway
      });

      if (dhcpRes.success) {
        setSaveMessage(`DHCP Berhasil! Mendapatkan IP ${dhcpRes.ipAddress} dari gateway ${dhcpRes.defaultGateway}.`);
      } else {
        setErrorMessage(`DHCP Gagal: Tidak ada server DHCP aktif di segmen Layer 2 broadcast domain ini. Menggunakan alamat APIPA (${dhcpRes.ipAddress}).`);
      }
    } else {
      let nextIp = ipAddress;
      let nextMask = subnetMask;
      let nextGw = defaultGateway;
      if (ipAddress.startsWith('169.254.')) {
        nextIp = '';
        nextMask = '';
        nextGw = '';
        setIpAddress('');
        setSubnetMask('');
        setDefaultGateway('');
      }

      updateHostConfig(host.id, {
        isDhcp: false,
        ipAddress: nextIp,
        subnetMask: nextMask,
        defaultGateway: nextGw,
        dnsServer,
        ipv6Address,
        ipv6Gateway
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-950/80 border border-sky-800/60 flex items-center justify-center">
              {host.deviceType === 'server' ? <CiscoServerIcon size={36} /> : <CiscoPcIcon size={36} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{host.hostname}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                  {(host.deviceType || 'pc').toUpperCase()} DESKTOP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Network Adapter: {iface?.name || 'FastEthernet0'} ({iface?.macAddress || '0060.2F11.2233'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: IP Configuration vs Command Prompt */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('ip')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'ip'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Desktop IP Configuration</span>
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'prompt'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Command Prompt Overview</span>
          </button>
        </div>

        {/* Tab 1: Visual IP Configuration GUI */}
        {activeTab === 'ip' && (
          <form onSubmit={handleApply} className="space-y-4">
            {/* Status Feedback Messages */}
            {saveMessage && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* IPv4 Configuration Section */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5" />
                  <span>IPv4 Configuration</span>
                </span>

                {/* DHCP vs Static Toggle */}
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="ipType"
                      checked={isDhcp}
                      onChange={() => handleDhcpToggle(true)}
                      className="text-sky-500 focus:ring-sky-500 cursor-pointer"
                    />
                    <span>DHCP</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="ipType"
                      checked={!isDhcp}
                      onChange={() => handleDhcpToggle(false)}
                      className="text-sky-500 focus:ring-sky-500 cursor-pointer"
                    />
                    <span>Static</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">IPv4 Address:</label>
                  <input
                    type="text"
                    disabled={isDhcp}
                    value={ipAddress}
                    onChange={(e) => handleIpChange(e.target.value)}
                    onBlur={handleIpBlur}
                    placeholder="192.168.1.10"
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono select-text cursor-text focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Subnet Mask:</label>
                  <input
                    type="text"
                    disabled={isDhcp}
                    value={subnetMask}
                    onChange={(e) => setSubnetMask(e.target.value)}
                    placeholder="255.255.255.0"
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono select-text cursor-text focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Default Gateway:</label>
                  <input
                    type="text"
                    disabled={isDhcp}
                    value={defaultGateway}
                    onChange={(e) => setDefaultGateway(e.target.value)}
                    placeholder="192.168.1.1"
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono select-text cursor-text focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">DNS Server:</label>
                  <input
                    type="text"
                    disabled={isDhcp}
                    value={dnsServer}
                    onChange={(e) => setDnsServer(e.target.value)}
                    placeholder="8.8.8.8"
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono select-text cursor-text focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* IPv6 Configuration Section */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>IPv6 Configuration</span>
                </span>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="ipv6Type"
                      checked={isIpv6Auto}
                      onChange={() => setIsIpv6Auto(true)}
                      className="text-sky-500 focus:ring-sky-500 cursor-pointer"
                    />
                    <span>Auto Config</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="ipv6Type"
                      checked={!isIpv6Auto}
                      onChange={() => setIsIpv6Auto(false)}
                      className="text-sky-500 focus:ring-sky-500 cursor-pointer"
                    />
                    <span>Static</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">IPv6 Address / Prefix:</label>
                  <input
                    type="text"
                    disabled={isIpv6Auto}
                    value={ipv6Address}
                    onChange={(e) => setIpv6Address(e.target.value)}
                    placeholder="2001:db8:acad:1::10/64"
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono select-text cursor-text focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">IPv6 Gateway:</label>
                  <input
                    type="text"
                    disabled={isIpv6Auto}
                    value={ipv6Gateway}
                    onChange={(e) => setIpv6Gateway(e.target.value)}
                    placeholder="fe80::1"
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono select-text cursor-text focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-950/50 transition-all cursor-pointer"
              >
                Terapkan Perubahan (Apply)
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Command Prompt Overview */}
        {activeTab === 'prompt' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-2">
            <div className="text-slate-400">Microsoft Windows [Version 10.0.19045.3803]</div>
            <div>C:\Users\Admin&gt; ipconfig /all</div>
            <pre className="text-emerald-400 leading-relaxed text-[11px] whitespace-pre-wrap">
{`${iface?.name || 'FastEthernet0'} Connection:
   Physical Address........: ${iface?.macAddress || '0060.2F11.2233'}
   DHCP Enabled............: ${hostDev.isDhcp ? 'Yes' : 'No'}
   IP Address..............: ${hostDev.ipAddress || '0.0.0.0'}
   Subnet Mask.............: ${hostDev.subnetMask || '0.0.0.0'}
   Default Gateway.........: ${hostDev.defaultGateway || '0.0.0.0'}
   DNS Server..............: ${hostDev.dnsServer || '0.0.0.0'}`}
            </pre>
            <div className="text-slate-500 pt-2 text-[10px]">
              Gunakan panel terminal Cisco Terminal di bagian bawah layar untuk menjalankan perintah live: <code>ping</code>, <code>tracert</code>, atau <code>arp -a</code>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
