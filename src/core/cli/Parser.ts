import { CliContext, CliExecutionResult, CommandHelpItem } from '../../types/cli';
import { Device } from '../devices/Device';
import { Host } from '../devices/Host';
import { IOSCommands } from './IOSCommands';
import { CliLexer } from './Lexer';

export class CliParser {
  /**
   * Eksekusi baris perintah pada device aktif
   */
  static execute(
    commandLine: string,
    context: CliContext,
    device: Device,
    allDevices: Device[] = []
  ): CliExecutionResult {
    if (device instanceof Host) {
      return device.executeCli(commandLine, context, allDevices);
    }
    return IOSCommands.execute(commandLine, context, device, allDevices);
  }

  /**
   * Mendapatkan daftar bantuan kontekstual untuk tombol '?'
   */
  static getHelp(input: string, context: CliContext, device: Device): CommandHelpItem[] {
    if (device instanceof Host) {
      return [
        { command: 'ipconfig', description: 'Display IP configuration' },
        { command: 'ipconfig /all', description: 'Display detailed configuration' },
        { command: 'ping <ip>', description: 'Send ICMP Echo to target' },
        { command: 'tracert <ip>', description: 'Trace route to target' },
        { command: 'arp -a', description: 'View ARP cache table' },
        { command: 'arp -d', description: 'Clear ARP cache entries' },
        { command: 'arp -s', description: 'Add static ARP entry' }
      ];
    }

    const available = IOSCommands.getHelp(context, device);
    const tokens = CliLexer.tokenize(input);

    if (tokens.length === 0 || input.trim() === '') {
      return available;
    }

    // Filter bantuan berdasarkan token pertama jika sedang mengetik kata kunci
    const first = tokens[0].toLowerCase();
    return available.filter(item => item.command.toLowerCase().startsWith(first));
  }

  /**
   * Autokompleksi kata kunci untuk tombol 'Tab'
   */
  static complete(input: string, context: CliContext, device: Device): { completedText: string; candidates: string[] } {
    if (device instanceof Host) {
      const hostCmds = ['ipconfig', 'ipconfig /all', 'ping', 'tracert', 'arp', 'arp -a', 'arp -d', 'arp -s'];
      const match = hostCmds.filter(c => c.startsWith(input.toLowerCase()));
      if (match.length === 1) {
        return { completedText: match[0], candidates: match };
      }
      return { completedText: input, candidates: match };
    }

    const helpItems = IOSCommands.getHelp(context, device);
    const keywords = helpItems.map(h => h.command);

    const tokens = CliLexer.tokenize(input);
    if (tokens.length === 0) {
      return { completedText: input, candidates: [] };
    }

    // Jika sedang mengetik token terakhir
    const lastToken = tokens[tokens.length - 1];
    const prefixResult = CliLexer.matchToken(
      lastToken,
      keywords.map(k => k.split(' ')[tokens.length - 1]).filter(Boolean)
    );

    if (prefixResult.status === 'prefix' && prefixResult.matched) {
      const parts = input.split(/\s+/);
      parts[parts.length - 1] = prefixResult.matched;
      return { completedText: parts.join(' ') + ' ', candidates: prefixResult.candidates };
    }

    return { completedText: input, candidates: prefixResult.candidates };
  }
}
