'use client'

import { Shield, ShieldCheck, ShieldAlert, ShieldX, Lock, Unlock, Server, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SecurityData {
  open_ports?: number[]
  ssh_root_login?: string
  ssh_password_auth?: string
  ssh_port?: number
  fail2ban?: boolean
  ufw_status?: string
  iptables_rules?: number
  docker_socket_exposed?: boolean
  selinux?: string
  apparmor?: boolean
  sysctl?: Record<string, string>
}

interface Finding {
  severity: 'pass' | 'info' | 'warn' | 'crit'
  title: string
  detail: string
}

const HIGH_RISK_PORTS: Record<number, string> = {
  23: 'Telnet',
  135: 'RPC',
  139: 'NetBIOS',
  445: 'SMB',
  1433: 'MSSQL',
  1521: 'Oracle DB',
  3306: 'MySQL',
  3389: 'RDP',
  4444: 'Metasploit default',
  5432: 'PostgreSQL',
  5900: 'VNC',
  6379: 'Redis',
  8080: 'HTTP Alt',
  27017: 'MongoDB',
}

const MED_RISK_PORTS: Record<number, string> = {
  21: 'FTP',
  25: 'SMTP',
  110: 'POP3',
  143: 'IMAP',
  2375: 'Docker daemon (unencrypted)',
  3000: 'Dev server',
  8443: 'HTTPS Alt',
  9200: 'Elasticsearch',
  9300: 'Elasticsearch',
  15672: 'RabbitMQ admin',
}

function analyze(sec: SecurityData): Finding[] {
  const findings: Finding[] = []

  // SSH root login
  if (sec.ssh_root_login !== undefined) {
    if (sec.ssh_root_login === 'yes') {
      findings.push({ severity: 'crit', title: 'Root login enabled', detail: 'PermitRootLogin yes — direct root SSH login is allowed. Use a non-root user with sudo.' })
    } else if (sec.ssh_root_login === 'prohibit-password' || sec.ssh_root_login === 'without-password') {
      findings.push({ severity: 'info', title: 'Root login: keys only', detail: 'PermitRootLogin prohibit-password — root login allowed only with SSH keys. Consider disabling root login entirely.' })
    } else {
      findings.push({ severity: 'pass', title: 'Root login disabled', detail: 'PermitRootLogin no — SSH root login is properly disabled.' })
    }
  }

  // SSH password auth
  if (sec.ssh_password_auth !== undefined) {
    if (sec.ssh_password_auth === 'yes') {
      findings.push({ severity: 'warn', title: 'Password authentication enabled', detail: 'PasswordAuthentication yes — SSH allows password logins, making the server vulnerable to brute-force attacks. Prefer SSH key-only authentication.' })
    } else {
      findings.push({ severity: 'pass', title: 'SSH key-only auth', detail: 'PasswordAuthentication no — SSH requires key-based authentication.' })
    }
  }

  // SSH non-default port
  if (sec.ssh_port !== undefined && sec.ssh_port !== 22) {
    findings.push({ severity: 'pass', title: `SSH on non-default port ${sec.ssh_port}`, detail: 'Running SSH on a non-standard port reduces automated scan traffic.' })
  }

  // Fail2Ban
  if (sec.fail2ban !== undefined) {
    if (sec.fail2ban) {
      findings.push({ severity: 'pass', title: 'Fail2Ban active', detail: 'Fail2Ban is running and protecting against brute-force attacks.' })
    } else {
      findings.push({ severity: 'warn', title: 'Fail2Ban not detected', detail: 'No brute-force protection detected. Consider installing fail2ban.' })
    }
  }

  // Docker socket
  if (sec.docker_socket_exposed) {
    findings.push({ severity: 'crit', title: 'Docker socket exposed', detail: '/var/run/docker.sock is world-readable or accessible — this grants root-equivalent access to the host.' })
  }

  // UFW / firewall
  if (sec.ufw_status !== undefined) {
    const active = sec.ufw_status.toLowerCase().includes('active')
    if (active) {
      findings.push({ severity: 'pass', title: 'UFW firewall active', detail: 'UFW is running and enforcing firewall rules.' })
    } else {
      findings.push({ severity: 'warn', title: 'UFW firewall inactive', detail: 'UFW is installed but not active. No software firewall is enforced.' })
    }
  }

  // iptables rules
  if (sec.iptables_rules !== undefined) {
    if (sec.iptables_rules === 0) {
      findings.push({ severity: 'warn', title: 'No iptables rules', detail: 'iptables has 0 rules — all traffic is allowed by default.' })
    } else {
      findings.push({ severity: 'info', title: `${sec.iptables_rules} iptables rule${sec.iptables_rules > 1 ? 's' : ''}`, detail: 'iptables firewall rules are configured.' })
    }
  }

  // SELinux / AppArmor
  if (sec.selinux) {
    if (sec.selinux === 'enforcing') {
      findings.push({ severity: 'pass', title: 'SELinux enforcing', detail: 'SELinux is in enforcing mode — mandatory access control is active.' })
    } else if (sec.selinux === 'permissive') {
      findings.push({ severity: 'info', title: 'SELinux permissive', detail: 'SELinux is in permissive mode — logging but not blocking.' })
    }
  }

  if (sec.apparmor !== undefined) {
    if (sec.apparmor) {
      findings.push({ severity: 'pass', title: 'AppArmor enabled', detail: 'AppArmor provides mandatory access control.' })
    }
  }

  // Open port analysis
  if (sec.open_ports && sec.open_ports.length > 0) {
    const critPorts = sec.open_ports.filter(p => HIGH_RISK_PORTS[p])
    const warnPorts = sec.open_ports.filter(p => MED_RISK_PORTS[p])

    for (const p of critPorts) {
      findings.push({
        severity: 'crit',
        title: `High-risk port ${p} open (${HIGH_RISK_PORTS[p]})`,
        detail: `Port ${p} (${HIGH_RISK_PORTS[p]}) is publicly accessible. Restrict to localhost or a trusted IP if not required externally.`,
      })
    }
    for (const p of warnPorts) {
      findings.push({
        severity: 'warn',
        title: `Sensitive port ${p} open (${MED_RISK_PORTS[p]})`,
        detail: `Port ${p} (${MED_RISK_PORTS[p]}) is publicly accessible. Verify this is intentional.`,
      })
    }
  }

  return findings
}

const SEVERITY_META = {
  pass: { icon: ShieldCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', label: 'PASS' },
  info: { icon: Shield, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', label: 'INFO' },
  warn: { icon: ShieldAlert, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800', label: 'WARN' },
  crit: { icon: ShieldX, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', label: 'CRIT' },
}

function calcGrade(findings: Finding[]): { grade: string; color: string; label: string } {
  const crits = findings.filter(f => f.severity === 'crit').length
  const warns = findings.filter(f => f.severity === 'warn').length
  if (crits >= 2) return { grade: 'F', color: 'text-red-600 dark:text-red-400', label: 'Critical Risk' }
  if (crits === 1) return { grade: 'D', color: 'text-orange-600 dark:text-orange-400', label: 'High Risk' }
  if (warns >= 3) return { grade: 'C', color: 'text-yellow-600 dark:text-yellow-400', label: 'Moderate Risk' }
  if (warns >= 1) return { grade: 'B', color: 'text-blue-600 dark:text-blue-400', label: 'Low Risk' }
  return { grade: 'A', color: 'text-green-600 dark:text-green-400', label: 'Secure' }
}

export function SecurityAudit({ securityData, openPorts }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  securityData: any
  openPorts?: number[]
}) {
  const raw = (securityData ?? {}) as SecurityData
  const sec: SecurityData = {
    ...raw,
    open_ports: raw.open_ports ?? openPorts ?? [],
  }

  const hasData = Object.keys(sec).some(k => sec[k as keyof SecurityData] !== undefined && k !== 'sysctl')

  if (!hasData) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
        <Lock className="w-4 h-4" />
        <span>No security scan data recorded for this benchmark.</span>
      </div>
    )
  }

  const findings = analyze(sec)
  const grade = calcGrade(findings)

  const passes = findings.filter(f => f.severity === 'pass').length
  const issues = findings.filter(f => f.severity !== 'pass').length

  return (
    <div className="space-y-4">
      {/* Grade summary */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className={cn('text-4xl font-bold font-mono w-12 text-center', grade.color)}>{grade.grade}</div>
        <div>
          <div className={cn('font-semibold text-sm', grade.color)}>{grade.label}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {passes} check{passes !== 1 ? 's' : ''} passed · {issues} issue{issues !== 1 ? 's' : ''} detected
          </p>
        </div>
        {sec.open_ports && sec.open_ports.length > 0 && (
          <div className="ml-auto text-right text-xs text-gray-400">
            <div>Open ports</div>
            <div className="font-mono font-semibold text-gray-700 dark:text-gray-300">{sec.open_ports.length}</div>
          </div>
        )}
      </div>

      {/* Open ports list */}
      {sec.open_ports && sec.open_ports.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Open Ports</h4>
          <div className="flex flex-wrap gap-1.5">
            {sec.open_ports.sort((a, b) => a - b).map(p => {
              const isHigh = HIGH_RISK_PORTS[p]
              const isMed = MED_RISK_PORTS[p]
              return (
                <span
                  key={p}
                  title={isHigh ? HIGH_RISK_PORTS[p] : isMed ? MED_RISK_PORTS[p] : ''}
                  className={cn(
                    'px-2 py-0.5 text-xs font-mono rounded border',
                    isHigh
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                      : isMed
                        ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                  )}
                >
                  {p}{(isHigh || isMed) ? ` (${isHigh ?? isMed})` : ''}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Findings */}
      {findings.length > 0 && (
        <div className="space-y-2">
          {['crit', 'warn', 'info', 'pass'].map(sev =>
            findings.filter(f => f.severity === sev).map((f, i) => {
              const meta = SEVERITY_META[f.severity as keyof typeof SEVERITY_META]
              const Icon = meta.icon
              return (
                <div key={`${sev}-${i}`} className={cn('flex items-start gap-3 p-3 rounded-lg border', meta.bg, meta.border)}>
                  <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', meta.color)} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-bold uppercase tracking-wide', meta.color)}>{meta.label}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{f.title}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{f.detail}</p>
                  </div>
                </div>
              )
            }),
          )}
        </div>
      )}

      {/* Sysctl hardening summary */}
      {sec.sysctl && Object.keys(sec.sysctl).length > 0 && (
        <details className="text-xs text-gray-500 dark:text-gray-400">
          <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 font-medium">
            <Server className="w-3.5 h-3.5 inline mr-1.5" />
            Kernel hardening parameters ({Object.keys(sec.sysctl).length})
          </summary>
          <div className="mt-2 space-y-1 pl-5">
            {Object.entries(sec.sysctl).map(([key, val]) => (
              <div key={key} className="flex gap-2 font-mono">
                <span className="text-gray-400">{key}</span>
                <span className="text-gray-700 dark:text-gray-300">=</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
