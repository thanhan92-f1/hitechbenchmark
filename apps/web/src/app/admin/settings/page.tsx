import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin - System Settings',
  robots: { index: false, follow: false },
}

const ADMIN_ROLES = ['super_admin', 'admin']

async function getSettings() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/system/settings`,
      { cache: 'no-store' },
    )
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

async function getQueueStatus() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/queue/status`,
      { cache: 'no-store' },
    )
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

export default async function AdminSettingsPage() {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) redirect('/login')

  const [settings, queueStatus] = await Promise.all([
    getSettings(),
    getQueueStatus(),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">System Settings</h1>

      {/* Queue Status */}
      {queueStatus && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold text-gray-900 dark:text-white">Queue Status — {queueStatus.queue}</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {Object.entries(queueStatus.counts as Record<string, number>).map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{val}</div>
                  <div className="text-xs text-gray-400 capitalize">{key}</div>
                </div>
              ))}
            </div>
            {queueStatus.recentFailed?.length > 0 && (
              <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-red-600 mb-2">Recent Failed Jobs</h3>
                <div className="space-y-2">
                  {queueStatus.recentFailed.map((job: { id: string; name: string; failedReason: string }) => (
                    <div key={job.id} className="text-xs bg-red-50 dark:bg-red-900/20 rounded p-2">
                      <span className="font-mono text-red-700 dark:text-red-300">{job.name}</span>
                      <span className="text-red-500 ml-2">{job.failedReason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* System Settings */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 dark:text-white">Configuration</h2>
        </CardHeader>
        <CardBody>
          {settings.length > 0 ? (
            <div className="space-y-3">
              {settings.map((s: { id: string; key: string; value: unknown; group?: string }) => (
                <div key={s.id} className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <div className="font-mono text-sm text-gray-900 dark:text-white">{s.key}</div>
                    {s.group && <div className="text-xs text-gray-400">{s.group}</div>}
                  </div>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded max-w-xs truncate">
                    {JSON.stringify(s.value)}
                  </code>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No system settings configured yet.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Scoring weights */}
      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-semibold text-gray-900 dark:text-white">Scoring Weights (Read-only)</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-5 gap-4">
            {[['CPU', '30%'], ['Disk', '25%'], ['Network', '25%'], ['Memory', '15%'], ['Security', '5%']].map(([label, pct]) => (
              <div key={label} className="text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{pct}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">To change scoring weights, update the <code>SCORING_WEIGHTS</code> constant in <code>packages/shared/src/constants.ts</code></p>
        </CardBody>
      </Card>
    </div>
  )
}
