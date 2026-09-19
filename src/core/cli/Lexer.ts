/**
 * Lexer.ts
 * Tokenizer & Prefix Resolution untuk Cisco IOS CLI
 */

export interface TokenMatchResult {
  status: 'exact' | 'prefix' | 'ambiguous' | 'none';
  matched?: string;
  candidates: string[];
}

export class CliLexer {
  /**
   * Memecah baris perintah menjadi array token dengan mempertahankan quote
   */
  static tokenize(input: string): string[] {
    const trimmed = input.trim();
    if (!trimmed) return [];

    const tokens: string[] = [];
    let currentToken = '';
    let insideQuote = false;
    let quoteChar = '';

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];

      if ((char === '"' || char === "'") && (!insideQuote || quoteChar === char)) {
        insideQuote = !insideQuote;
        quoteChar = insideQuote ? char : '';
        continue;
      }

      if (char === ' ' && !insideQuote) {
        if (currentToken.length > 0) {
          tokens.push(currentToken);
          currentToken = '';
        }
      } else {
        currentToken += char;
      }
    }

    if (currentToken.length > 0) {
      tokens.push(currentToken);
    }

    return tokens;
  }

  /**
   * Mencari kecocokan token parsial terhadap himpunan kata kunci yang tersedia
   */
  static matchToken(token: string, availableKeywords: string[]): TokenMatchResult {
    const lowerToken = token.toLowerCase();

    // 1. Cek Exact Match
    const exact = availableKeywords.find(k => k.toLowerCase() === lowerToken);
    if (exact) {
      return { status: 'exact', matched: exact, candidates: [exact] };
    }

    // 2. Cek Prefix Match
    const candidates = availableKeywords.filter(k => k.toLowerCase().startsWith(lowerToken));
    if (candidates.length === 1) {
      return { status: 'prefix', matched: candidates[0], candidates };
    } else if (candidates.length > 1) {
      return { status: 'ambiguous', candidates };
    } else {
      return { status: 'none', candidates: [] };
    }
  }

  /**
   * Normalisasi nama interface Cisco (misal: Gi0/0 -> GigabitEthernet0/0, fa0/1 -> FastEthernet0/1)
   */
  static normalizeInterfaceName(name: string): string {
    const clean = name.trim();
    const lower = clean.toLowerCase();

    if (lower.startsWith('gi') || lower.startsWith('g')) {
      const portPart = clean.replace(/^[a-zA-Z]+/i, '');
      return `GigabitEthernet${portPart}`;
    }
    if (lower.startsWith('fa') || lower.startsWith('f')) {
      const portPart = clean.replace(/^[a-zA-Z]+/i, '');
      return `FastEthernet${portPart}`;
    }
    if (lower.startsWith('se') || lower.startsWith('s')) {
      const portPart = clean.replace(/^[a-zA-Z]+/i, '');
      return `Serial${portPart}`;
    }
    if (lower.startsWith('vl') || lower.startsWith('v')) {
      const portPart = clean.replace(/^[a-zA-Z]+/i, '');
      return `Vlan${portPart}`;
    }
    if (lower.startsWith('lo')) {
      const portPart = clean.replace(/^[a-zA-Z]+/i, '');
      return `Loopback${portPart}`;
    }
    return clean;
  }
}
