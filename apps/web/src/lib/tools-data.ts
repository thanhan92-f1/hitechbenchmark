import {
  ShieldCheck, Globe, Network, Code2, Search, Flag,
  Lock, Wifi, KeyRound, Terminal, FileCode, Hash,
  Link2, Regex, QrCode, Clock, GitCompare, Palette,
  Type, FileJson, Settings, LayoutTemplate, MapPin,
  Rss, Bot, FileSearch, AlertCircle, Mail, Server,
  Fingerprint, BarChart, Building2, Car, Database,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ToolDef {
  id: string
  label: string
  description: string
  href: string
  icon: LucideIcon
  badge?: string
}

export interface ToolGroupDef {
  id: string
  label: string
  labelVi?: string
  description: string
  href: string
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'rose'
  bgClass: string
  textClass: string
  borderClass: string
  icon: LucideIcon
  tools: ToolDef[]
}

export const toolGroups: ToolGroupDef[] = [
  {
    id: 'ssl',
    label: 'SSL Tools',
    description: 'SSL/TLS certificate checking and HTTPS security',
    href: '/tools/ssl',
    color: 'green',
    bgClass: 'bg-green-50 dark:bg-green-950/30',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-200 dark:border-green-800',
    icon: ShieldCheck,
    tools: [
      { id: 'check', label: 'SSL Check', description: 'Verify SSL certificate validity and details', href: '/tools/ssl/check', icon: ShieldCheck },
      { id: 'http2', label: 'HTTP/2 Check', description: 'Test if your server supports HTTP/2', href: '/tools/ssl/http2', icon: Wifi },
      { id: 'http3', label: 'HTTP/3 / QUIC', description: 'Check QUIC and HTTP/3 protocol support', href: '/tools/ssl/http3', icon: Wifi, badge: 'New' },
      { id: 'expiry', label: 'SSL Expiry', description: 'Monitor SSL certificate expiration dates', href: '/tools/ssl/expiry', icon: Clock },
      { id: 'decode', label: 'CSR / Cert Decoder', description: 'Decode CSR and certificate PEM files', href: '/tools/ssl/decode', icon: FileCode },
      { id: 'csr', label: 'CSR Generator', description: 'Generate Certificate Signing Requests', href: '/tools/ssl/csr', icon: KeyRound },
      { id: 'hsts', label: 'HSTS Check', description: 'Verify HTTP Strict Transport Security', href: '/tools/ssl/hsts', icon: Lock },
      { id: 'caa', label: 'CAA Record', description: 'Check Certificate Authority Authorization DNS records', href: '/tools/ssl/caa', icon: ShieldCheck },
    ],
  },
  {
    id: 'domain',
    label: 'Domain & DNS',
    description: 'Domain registration info and DNS record lookup',
    href: '/tools/domain',
    color: 'blue',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800',
    icon: Globe,
    tools: [
      { id: 'whois', label: 'Whois / RDAP', description: 'Get domain registration information', href: '/tools/domain/whois', icon: Globe },
      { id: 'dns', label: 'DNS Records', description: 'Look up A, MX, TXT, CNAME, NS records', href: '/tools/domain/dns', icon: Server },
      { id: 'mx', label: 'MX Check', description: 'Inspect mail server (MX) records', href: '/tools/domain/mx', icon: Mail },
      { id: 'ns', label: 'NS Lookup', description: 'Find authoritative name servers', href: '/tools/domain/ns', icon: Server },
      { id: 'txt', label: 'TXT Lookup', description: 'View all TXT DNS records', href: '/tools/domain/txt', icon: FileSearch },
      { id: 'spf', label: 'SPF Check', description: 'Validate SPF email authentication records', href: '/tools/domain/spf', icon: ShieldCheck },
      { id: 'dkim', label: 'DKIM Check', description: 'Verify DKIM email signing records', href: '/tools/domain/dkim', icon: KeyRound },
      { id: 'dmarc', label: 'DMARC Check', description: 'Check DMARC email policy records', href: '/tools/domain/dmarc', icon: ShieldCheck },
      { id: 'rdns', label: 'Reverse DNS', description: 'Find hostname from an IP address', href: '/tools/domain/rdns', icon: Network },
      { id: 'propagation', label: 'DNS Propagation', description: 'Check DNS propagation worldwide', href: '/tools/domain/propagation', icon: Globe },
      { id: 'blacklist', label: 'Blacklist Check', description: 'Check if domain/IP is on spam blacklists', href: '/tools/domain/blacklist', icon: AlertCircle },
      { id: 'age', label: 'Domain Age', description: 'Find out how old a domain is', href: '/tools/domain/age', icon: Clock },
    ],
  },
  {
    id: 'ip',
    label: 'IP & Network',
    description: 'IP address lookup and network diagnostic tools',
    href: '/tools/ip',
    color: 'purple',
    bgClass: 'bg-purple-50 dark:bg-purple-950/30',
    textClass: 'text-purple-700 dark:text-purple-400',
    borderClass: 'border-purple-200 dark:border-purple-800',
    icon: Network,
    tools: [
      { id: 'my', label: 'My IP Address', description: 'Find your current public IP and location', href: '/tools/ip/my', icon: MapPin },
      { id: 'info', label: 'IP Lookup', description: 'Detailed information about any IP address', href: '/tools/ip/info', icon: Network },
      { id: 'location', label: 'IP Location Map', description: 'Show IP address location on a map', href: '/tools/ip/location', icon: MapPin },
      { id: 'port', label: 'Port Scanner', description: 'Check if common ports are open on a server', href: '/tools/ip/port', icon: Server },
      { id: 'subnet', label: 'Subnet Calculator', description: 'Calculate subnets and CIDR notation', href: '/tools/ip/subnet', icon: Network },
      { id: 'mac', label: 'MAC Lookup', description: 'Identify manufacturer from MAC address', href: '/tools/ip/mac', icon: Fingerprint },
      { id: 'redirect', label: 'Redirect Checker', description: 'Trace HTTP redirect chains for a URL', href: '/tools/ip/redirect', icon: Link2 },
      { id: 'asn', label: 'ASN Lookup', description: 'Look up Autonomous System information', href: '/tools/ip/asn', icon: BarChart },
    ],
  },
  {
    id: 'dev',
    label: 'Developer Tools',
    description: 'Encoding, formatting, generation and conversion utilities',
    href: '/tools/dev',
    color: 'orange',
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    textClass: 'text-orange-700 dark:text-orange-400',
    borderClass: 'border-orange-200 dark:border-orange-800',
    icon: Code2,
    tools: [
      { id: 'uuid', label: 'UUID Generator', description: 'Generate UUID v4 and v7 identifiers', href: '/tools/dev/uuid', icon: Hash },
      { id: 'base64', label: 'Base64 Encode/Decode', description: 'Encode and decode Base64 data', href: '/tools/dev/base64', icon: FileCode },
      { id: 'json', label: 'JSON Formatter', description: 'Format, validate and minify JSON', href: '/tools/dev/json', icon: FileJson },
      { id: 'password', label: 'Password Generator', description: 'Generate strong random passwords', href: '/tools/dev/password', icon: KeyRound },
      { id: 'hash', label: 'Hash Generator', description: 'MD5, SHA-1, SHA-256, SHA-512 hashes', href: '/tools/dev/hash', icon: Hash },
      { id: 'bcrypt', label: 'Bcrypt', description: 'Hash and verify passwords with bcrypt', href: '/tools/dev/bcrypt', icon: Lock },
      { id: 'url', label: 'URL Encode/Decode', description: 'Encode and decode URL strings', href: '/tools/dev/url', icon: Link2 },
      { id: 'regex', label: 'Regex Tester', description: 'Test and debug regular expressions', href: '/tools/dev/regex', icon: Regex },
      { id: 'jwt', label: 'JWT Decoder', description: 'Decode and inspect JWT tokens', href: '/tools/dev/jwt', icon: KeyRound },
      { id: 'timestamp', label: 'Unix Timestamp', description: 'Convert Unix timestamps to dates', href: '/tools/dev/timestamp', icon: Clock },
      { id: 'diff', label: 'Text Diff', description: 'Compare two texts side-by-side', href: '/tools/dev/diff', icon: GitCompare },
      { id: 'color', label: 'Color Converter', description: 'Convert HEX, RGB, HSL colors', href: '/tools/dev/color', icon: Palette },
      { id: 'case', label: 'Case Converter', description: 'Convert camelCase, snake_case, PascalCase', href: '/tools/dev/case', icon: Type },
      { id: 'qr', label: 'QR Code', description: 'Generate QR codes from text or URLs', href: '/tools/dev/qr', icon: QrCode },
      { id: 'html', label: 'HTML Encode/Decode', description: 'Encode and decode HTML entities', href: '/tools/dev/html', icon: FileCode },
      { id: 'cron', label: 'Cron Parser', description: 'Parse and explain cron expressions', href: '/tools/dev/cron', icon: Clock },
      { id: 'yaml', label: 'YAML ↔ JSON', description: 'Convert between YAML and JSON', href: '/tools/dev/yaml', icon: FileJson },
      { id: 'gitignore', label: '.gitignore Generator', description: 'Generate .gitignore for your stack', href: '/tools/dev/gitignore', icon: Terminal },
    ],
  },
  {
    id: 'web',
    label: 'Web & SEO',
    description: 'Website analysis, SEO metadata and performance tools',
    href: '/tools/web',
    color: 'red',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800',
    icon: Search,
    tools: [
      { id: 'headers', label: 'HTTP Headers', description: 'Inspect HTTP response headers of any URL', href: '/tools/web/headers', icon: Settings },
      { id: 'og', label: 'OpenGraph Preview', description: 'Preview social media sharing cards', href: '/tools/web/og', icon: LayoutTemplate },
      { id: 'meta', label: 'Meta Tag Inspector', description: 'Check all meta tags of any webpage', href: '/tools/web/meta', icon: FileSearch },
      { id: 'robots', label: 'Robots.txt Tester', description: 'Check and validate robots.txt rules', href: '/tools/web/robots', icon: Bot },
      { id: 'sitemap', label: 'Sitemap Check', description: 'Find and validate XML sitemaps', href: '/tools/web/sitemap', icon: Rss },
      { id: 'cors', label: 'CORS Check', description: 'Test CORS headers on any API endpoint', href: '/tools/web/cors', icon: ShieldCheck },
      { id: 'utm', label: 'UTM Builder', description: 'Build and parse UTM tracking URLs', href: '/tools/web/utm', icon: Link2 },
    ],
  },
  {
    id: 'vn',
    label: 'Việt Nam',
    labelVi: 'Tra Cứu Việt Nam',
    description: 'Công cụ tra cứu thông tin đặc thù Việt Nam',
    href: '/tools/vn',
    color: 'rose',
    bgClass: 'bg-rose-50 dark:bg-rose-950/30',
    textClass: 'text-rose-700 dark:text-rose-400',
    borderClass: 'border-rose-200 dark:border-rose-800',
    icon: Flag,
    tools: [
      { id: 'tax-business', label: 'MST Doanh Nghiệp', description: 'Tra cứu mã số thuế doanh nghiệp tại Việt Nam', href: '/tools/vn/tax-business', icon: Building2 },
      { id: 'tax-household', label: 'MST Hộ Kinh Doanh', description: 'Tra cứu mã số thuế hộ kinh doanh cá thể', href: '/tools/vn/tax-household', icon: Database },
      { id: 'traffic', label: 'Tra Cứu Phạt Nguội', description: 'Kiểm tra vi phạm giao thông theo biển số', href: '/tools/vn/traffic', icon: Car },
      { id: 'ip-vn', label: 'IP Đăng Ký Việt Nam', description: 'Tra cứu dải IP đăng ký tại Việt Nam qua APNIC/RDAP', href: '/tools/vn/ip-vn', icon: Network },
    ],
  },
]

export function getToolGroup(id: string) {
  return toolGroups.find(g => g.id === id)
}

export function getTool(groupId: string, toolId: string) {
  const group = getToolGroup(groupId)
  return group?.tools.find(t => t.id === toolId)
}
