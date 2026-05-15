'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Plus, Trash2, Edit2, Check, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  slug: string
  vcpu: number | null
  ramGb: number | null
  diskGb: number | null
  diskType: string | null
  bandwidthTb: number | null
  priceUsd: number | null
  pricingModel: string | null
  regionCode: string | null
  isActive: boolean
  sourceUrl: string | null
}

const EMPTY_FORM = {
  name: '', slug: '', vcpu: '', ramGb: '', diskGb: '', diskType: '', bandwidthTb: '',
  priceUsd: '', pricingModel: 'monthly', regionCode: '', sourceUrl: '', isActive: true,
}

export default function AdminProviderPlansPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => { fetchPlans() }, [slug])

  async function fetchPlans() {
    setLoading(true)
    const res = await fetch(`/api/admin/providers/${slug}/plans`)
    const json = await res.json()
    setPlans(json.data || [])
    setLoading(false)
  }

  function parseNum(s: string) {
    const n = parseFloat(s)
    return isNaN(n) ? null : n
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const body = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        vcpu: form.vcpu ? parseInt(form.vcpu) : null,
        ramGb: parseNum(form.ramGb),
        diskGb: parseNum(form.diskGb),
        diskType: form.diskType || null,
        bandwidthTb: parseNum(form.bandwidthTb),
        priceUsd: parseNum(form.priceUsd),
        pricingModel: form.pricingModel || null,
        regionCode: form.regionCode || null,
        sourceUrl: form.sourceUrl || null,
        isActive: form.isActive,
      }
      const url = editId
        ? `/api/admin/providers/${slug}/plans/${editId}`
        : `/api/admin/providers/${slug}/plans`
      const res = await fetch(url, {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        setShowForm(false)
        setEditId(null)
        setForm(EMPTY_FORM)
        await fetchPlans()
      } else {
        setError(json.error || 'Save failed')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this plan?')) return
    await fetch(`/api/admin/providers/${slug}/plans/${id}`, { method: 'DELETE' })
    await fetchPlans()
  }

  function startEdit(plan: Plan) {
    setForm({
      name: plan.name,
      slug: plan.slug,
      vcpu: plan.vcpu?.toString() || '',
      ramGb: plan.ramGb?.toString() || '',
      diskGb: plan.diskGb?.toString() || '',
      diskType: plan.diskType || '',
      bandwidthTb: plan.bandwidthTb?.toString() || '',
      priceUsd: plan.priceUsd?.toString() || '',
      pricingModel: plan.pricingModel || 'monthly',
      regionCode: plan.regionCode || '',
      sourceUrl: plan.sourceUrl || '',
      isActive: plan.isActive,
    })
    setEditId(plan.id)
    setShowForm(true)
  }

  const inputClass = 'w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/providers" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Plans — {slug}
        </h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM) }}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold text-gray-900 dark:text-white">{editId ? 'Edit Plan' : 'New Plan'}</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="2 vCPU / 4GB" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Slug</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className={inputClass} placeholder="auto-generated" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Price (USD/mo)</label>
                <input type="number" step="0.01" value={form.priceUsd} onChange={e => setForm(f => ({ ...f, priceUsd: e.target.value }))} className={inputClass} placeholder="5.00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">vCPU</label>
                <input type="number" value={form.vcpu} onChange={e => setForm(f => ({ ...f, vcpu: e.target.value }))} className={inputClass} placeholder="2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">RAM (GB)</label>
                <input type="number" step="0.5" value={form.ramGb} onChange={e => setForm(f => ({ ...f, ramGb: e.target.value }))} className={inputClass} placeholder="4" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Disk (GB)</label>
                <input type="number" value={form.diskGb} onChange={e => setForm(f => ({ ...f, diskGb: e.target.value }))} className={inputClass} placeholder="80" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Disk Type</label>
                <select value={form.diskType} onChange={e => setForm(f => ({ ...f, diskType: e.target.value }))} className={inputClass}>
                  <option value="">Unknown</option>
                  <option value="ssd">SSD</option>
                  <option value="nvme">NVMe</option>
                  <option value="hdd">HDD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Bandwidth (TB/mo)</label>
                <input type="number" step="0.1" value={form.bandwidthTb} onChange={e => setForm(f => ({ ...f, bandwidthTb: e.target.value }))} className={inputClass} placeholder="2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Region Code</label>
                <input value={form.regionCode} onChange={e => setForm(f => ({ ...f, regionCode: e.target.value }))} className={inputClass} placeholder="us-east-1" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Source URL</label>
                <input type="url" value={form.sourceUrl} onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))} className={inputClass} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Plans table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : plans.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No plans yet. Add one above.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">vCPU</th>
                    <th className="px-4 py-2.5 font-medium">RAM</th>
                    <th className="px-4 py-2.5 font-medium">Disk</th>
                    <th className="px-4 py-2.5 font-medium">Bandwidth</th>
                    <th className="px-4 py-2.5 font-medium">Price</th>
                    <th className="px-4 py-2.5 font-medium">Region</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {plans.map(plan => (
                    <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{plan.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{plan.vcpu ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{plan.ramGb ? `${plan.ramGb} GB` : '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {plan.diskGb ? `${plan.diskGb} GB${plan.diskType ? ` ${plan.diskType.toUpperCase()}` : ''}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{plan.bandwidthTb ? `${plan.bandwidthTb} TB` : '—'}</td>
                      <td className="px-4 py-3 font-mono text-green-600 dark:text-green-400">
                        {plan.priceUsd ? `$${plan.priceUsd.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{plan.regionCode || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${plan.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => startEdit(plan)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(plan.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
