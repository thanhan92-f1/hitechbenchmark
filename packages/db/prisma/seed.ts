import { PrismaClient } from '../generated/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed countries
  const countries = [
    { code: 'VN', name: 'Vietnam', region: 'Asia', flagEmoji: '🇻🇳' },
    { code: 'SG', name: 'Singapore', region: 'Asia', flagEmoji: '🇸🇬' },
    { code: 'JP', name: 'Japan', region: 'Asia', flagEmoji: '🇯🇵' },
    { code: 'US', name: 'United States', region: 'North America', flagEmoji: '🇺🇸' },
    { code: 'DE', name: 'Germany', region: 'Europe', flagEmoji: '🇩🇪' },
    { code: 'NL', name: 'Netherlands', region: 'Europe', flagEmoji: '🇳🇱' },
    { code: 'GB', name: 'United Kingdom', region: 'Europe', flagEmoji: '🇬🇧' },
    { code: 'FR', name: 'France', region: 'Europe', flagEmoji: '🇫🇷' },
    { code: 'AU', name: 'Australia', region: 'Oceania', flagEmoji: '🇦🇺' },
    { code: 'CA', name: 'Canada', region: 'North America', flagEmoji: '🇨🇦' },
  ]

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: country,
      create: country,
    })
  }

  console.log(`Seeded ${countries.length} countries`)

  // Seed system settings
  const settings = [
    {
      key: 'scoring.weights',
      group: 'scoring',
      isPublic: true,
      value: { cpu: 0.30, disk: 0.25, network: 0.25, memory: 0.15, security: 0.05 },
    },
    {
      key: 'scoring.version',
      group: 'scoring',
      isPublic: true,
      value: 'v1',
    },
    {
      key: 'script.version',
      group: 'script',
      isPublic: true,
      value: '1.0.0',
    },
    {
      key: 'script.endpoint',
      group: 'script',
      isPublic: true,
      value: process.env.APP_URL || 'https://benchmark.codelab.vn',
    },
    {
      key: 'rate_limit.benchmark_ingest',
      group: 'security',
      isPublic: false,
      value: { max: 10, windowSeconds: 60 },
    },
    {
      key: 'anti_fake.network_max_gbps',
      group: 'security',
      isPublic: false,
      value: 100,
    },
    {
      key: 'anti_fake.iops_max',
      group: 'security',
      isPublic: false,
      value: 3000000,
    },
    {
      key: 'anti_fake.payload_max_bytes',
      group: 'security',
      isPublic: false,
      value: 524288, // 512KB
    },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  console.log(`Seeded ${settings.length} system settings`)

  // Seed sample providers
  const sgCountry = await prisma.country.findUnique({ where: { code: 'SG' } })
  const usCountry = await prisma.country.findUnique({ where: { code: 'US' } })
  const deCountry = await prisma.country.findUnique({ where: { code: 'DE' } })

  const providers = [
    {
      name: 'Vultr',
      slug: 'vultr',
      websiteUrl: 'https://www.vultr.com',
      countryId: usCountry?.id,
      isActive: true,
    },
    {
      name: 'DigitalOcean',
      slug: 'digitalocean',
      websiteUrl: 'https://www.digitalocean.com',
      countryId: usCountry?.id,
      isActive: true,
    },
    {
      name: 'Linode / Akamai',
      slug: 'linode',
      websiteUrl: 'https://www.linode.com',
      countryId: usCountry?.id,
      isActive: true,
    },
    {
      name: 'Hetzner',
      slug: 'hetzner',
      websiteUrl: 'https://www.hetzner.com',
      countryId: deCountry?.id,
      isActive: true,
    },
    {
      name: 'UpCloud',
      slug: 'upcloud',
      websiteUrl: 'https://upcloud.com',
      isActive: true,
    },
  ]

  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { slug: provider.slug },
      update: provider,
      create: provider,
    })
  }

  console.log(`Seeded ${providers.length} providers`)

  // Seed admin user
  const adminPassword = createHash('sha256').update('admin123456').digest('hex')
  await prisma.user.upsert({
    where: { email: 'admin@hitechbenchmark.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@hitechbenchmark.com',
      password: adminPassword,
      role: 'super_admin',
    },
  })

  console.log('Seeded admin user: admin@hitechbenchmark.com')
  console.log('Database seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
