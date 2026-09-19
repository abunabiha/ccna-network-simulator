import React, { useState, useEffect } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { Host } from '../../core/devices/Host';
import { SubnetUtils } from '../../core/network/Subnet';
import { TopologyTraversal } from '../../core/network/TopologyTraversal';
import { CiscoPcIcon } from '../common/CiscoIcons';
import { 
  X, 
  Settings, 
  Terminal, 
  Check, 
  AlertCircle, 
  Globe, 
  Network, 
  Cpu
} from 'lucide-react';

interface HostConfigModalProps {
  hostId: string | null;
  onClose: () => void;
}

export const HostConfigModal: React.FC<HostConfigModalProps> = ({ hostId, onClose }) => {
  const { devices } = useNetworkStore();
  const host = devices.find(d => d.id === hostId);

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

  useEffect(() => {
    if (host && host instanceof Host) {
      setIsDhcp(host.isDhcp);
      setIpAddress(host.ipAddress || '');
      setSubnetMask(host.subnetMask || '');
      setDefaultGateway(host.defaultGateway || '');
      setDnsServer(host.dnsServer || '');
    }
  }, [host]);

  if (!host || !(host instanceof Host)) return null;

  const iface = host.interfaces.get('FastEthernet0');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveMessage(null);

    if (!isDhcp) {
      if (ipAddress && !SubnetUtils.isValidIpv4(ipAddress)) {
        setErrorMessage('Alamat IPv4 tidak valid. Format harus X.X.X.X (0-255).');
        return;
      }
      if (subnetMask && !SubnetUtils.isValidSubnetMask(subnetMask)) {
        setErrorMessage('Subnet mask tidak valid.');
        return;
      }
      if (defaultGateway && !SubnetUtils.isValidIpv4(defaultGateway)) {
        setErrorMessage('Default Gateway tidak valid.');
        return;
      }
    }

    // Update Host model in store
    host.isDhcp = isDhcp;
    host.ipAddress = ipAddress;
    host.subnetMask = subnetMask || (isDhcp ? '255.255.0.0' : '255.255.255.0');
    host.defaultGateway = defaultGateway;
    host.dnsServer = dnsServer;

    if (iface) {
      iface.ipAddress = host.ipAddress;
      iface.subnetMask = host.subnetMask;
    }

    setSaveMessage('Konfigurasi IP berhasil disimpan!');
    setTimeout(() => setSaveMessage(null), 2500);
  };

  const handleDhcpToggle = (val: boolean) => {
    setIsDhcp(val);
    setErrorMessage(null);
    setSaveMessage(null);

    if (val) {
      // Jalankan permohonan DHCP nyata pada domain broadcast Layer 2
      const dhcpRes = TopologyTraversal.acquireHostDhcp(host, devices);
      setIpAddress(dhcpRes.ipAddress);
      setSubnetMask(dhcpRes.subnetMask);
      setDefaultGateway(dhcpRes.defaultGateway);
      setDnsServer(dhcpRes.dnsServer);

      if (dhcpRes.success) {
        setSaveMessage(`DHCP Berhasil! Mendapatkan IP ${dhcpRes.ipAddress} dari gateway ${dhcpRes.defaultGateway}.`);
      } else {
        setErrorMessage(`DHCP Gagal: Tidak ada server DHCP aktif di segmen Layer 2 broadcast domain ini. Menggunakan alamat APIPA (${dhcpRes.ipAddress}).`);
      }
    } else {
      if (ipAddress.startsWith('169.254.')) {
        setIpAddress('');
        setSubnetMask('');
        setDefaultGateway('');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-950/80 border border-sky-800/60 flex items-center justify-center">
              <CiscoPcIcon size={36} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{host.hostname}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                  {host.deviceType.toUpperCase()} DESKTOP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Network Adapter: FastEthernet0 ({iface?.macAddress})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
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
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="ipType"
                      checked={isDhcp}
                      onChange={() => handleDhcpToggle(true)}
                      className="text-sky-500 focus:ring-sky-500"
                    />
                    <span>DHCP</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="ipType"
                      checked={!isDhcp}
                      onChange={() => handleDhcpToggle(false)}
                      className="text-sky-500 focus:ring-sky-500"
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
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="192.168.1.10"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-sky-500 disabled:opacity-50"
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-sky-500 disabled:opacity-50"
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-sky-500 disabled:opacity-50"
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-sky-500 disabled:opacity-50"
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
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="ipv6Type"
                      checked={isIpv6Auto}
                      onChange={() => setIsIpv6Auto(true)}
                      className="text-sky-500 focus:ring-sky-500"
                    />
                    <span>Auto Config</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="ipv6Type"
                      checked={!isIpv6Auto}
                      onChange={() => setIsIpv6Auto(false)}
                      className="text-sky-500 focus:ring-sky-500"
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-sky-500 disabled:opacity-50"
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-sky-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-950/50 transition-all"
              >
                Apply Changes
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
{`FastEthernet0 Connection:
   Physical Address........: ${iface?.macAddress || '0060.2F11.2233'}
   DHCP Enabled............: ${host.isDhcp ? 'Yes' : 'No'}
   IP Address..............: ${host.ipAddress || '0.0.0.0'}
   Subnet Mask.............: ${host.subnetMask || '0.0.0.0'}
   Default Gateway.........: ${host.defaultGateway || '0.0.0.0'}
   DNS Server..............: ${host.dnsServer || '0.0.0.0'}`}
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
