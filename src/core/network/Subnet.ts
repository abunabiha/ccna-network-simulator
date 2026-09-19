/**
 * Subnet.ts
 * Formulasi matematika pengalamatan IPv4, Subnet Mask, CIDR, dan Wildcard Mask
 * Berdasarkan RFC 791, RFC 1519 (CIDR), dan Cisco IOS conventions.
 */

export class SubnetUtils {
  /**
   * Mengubah representasi dotted-decimal IPv4 ke unsigned 32-bit integer
   */
  static ipToLong(ip: string): number {
    const parts = ip.trim().split('.').map(p => parseInt(p, 10));
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
      return 0;
    }
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
  }

  /**
   * Mengubah unsigned 32-bit integer kembali ke format dotted-decimal
   */
  static longToIp(num: number): string {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join('.');
  }

  /**
   * Menghitung subnet mask dari panjang prefix CIDR (0 - 32)
   */
  static cidrToMask(cidr: number): string {
    if (cidr <= 0) return '0.0.0.0';
    if (cidr >= 32) return '255.255.255.255';
    const maskLong = ((~0) << (32 - cidr)) >>> 0;
    return this.longToIp(maskLong);
  }

  /**
   * Menghitung panjang prefix CIDR dari subnet mask dotted-decimal
   */
  static maskToCidr(mask: string): number {
    const maskLong = this.ipToLong(mask);
    let count = 0;
    for (let i = 31; i >= 0; i--) {
      if ((maskLong & (1 << i)) !== 0) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * Menghitung Network ID dari IP dan Subnet Mask
   */
  static getNetworkAddress(ip: string, mask: string): string {
    const ipLong = this.ipToLong(ip);
    const maskLong = this.ipToLong(mask);
    const netLong = (ipLong & maskLong) >>> 0;
    return this.longToIp(netLong);
  }

  /**
   * Menghitung Broadcast Address dari IP dan Subnet Mask
   */
  static getBroadcastAddress(ip: string, mask: string): string {
    const ipLong = this.ipToLong(ip);
    const maskLong = this.ipToLong(mask);
    const netLong = (ipLong & maskLong) >>> 0;
    const bcastLong = (netLong | (~maskLong)) >>> 0;
    return this.longToIp(bcastLong);
  }

  /**
   * Menguji apakah dua IP berada dalam subnet logis yang sama
   */
  static isSameSubnet(ip1: string, ip2: string, mask: string): boolean {
    return this.getNetworkAddress(ip1, mask) === this.getNetworkAddress(ip2, mask);
  }

  /**
   * Mengubah Subnet Mask ke Wildcard Mask (Inverted Mask)
   */
  static maskToWildcard(mask: string): string {
    const maskLong = this.ipToLong(mask);
    const wildcardLong = (~maskLong) >>> 0;
    return this.longToIp(wildcardLong);
  }

  /**
   * Mengubah Wildcard Mask ke Subnet Mask
   */
  static wildcardToMask(wildcard: string): string {
    const wcLong = this.ipToLong(wildcard);
    const maskLong = (~wcLong) >>> 0;
    return this.longToIp(maskLong);
  }

  /**
   * Menguji kecocokan IP terhadap pola Network dan Mask/Wildcard (digunakan di ACL & OSPF)
   */
  static matchesNetwork(ip: string, network: string, maskOrWildcard: string, isWildcard: boolean = false): boolean {
    const ipLong = this.ipToLong(ip);
    const netLong = this.ipToLong(network);
    const filterLong = this.ipToLong(maskOrWildcard);

    if (isWildcard) {
      const bitMask = (~filterLong) >>> 0;
      return (ipLong & bitMask) === (netLong & bitMask);
    } else {
      return (ipLong & filterLong) === (netLong & filterLong);
    }
  }

  /**
   * Validasi format IPv4
   */
  static isValidIpv4(ip: string): boolean {
    if (!ip || typeof ip !== 'string') return false;
    const parts = ip.trim().split('.');
    if (parts.length !== 4) return false;
    return parts.every(p => {
      const n = parseInt(p, 10);
      return !isNaN(n) && n >= 0 && n <= 255 && p === n.toString();
    });
  }

  /**
   * Validasi Subnet Mask biner kontigu
   */
  static isValidSubnetMask(mask: string): boolean {
    if (!this.isValidIpv4(mask)) return false;
    const maskLong = this.ipToLong(mask);
    // Mask kontigu: invert maskLong + 1 harus merupakan power of 2
    const inverted = (~maskLong) >>> 0;
    return ((inverted + 1) & inverted) === 0;
  }
}
