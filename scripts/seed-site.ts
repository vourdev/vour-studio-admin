import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * One-off script: populate the site-settings global (contact, socials, nav)
 * with the marketing site's current values. Edit from the admin panel after.
 *
 * Usage: npm run seed:site
 */

async function seedSiteCommand() {
  const payload = await getPayload({ config })

  const existing = await payload.findGlobal({ slug: 'site-settings' })
  const alreadySet = Boolean(
    existing &&
      'contact' in existing &&
      existing.contact &&
      'whatsappNumber' in existing.contact &&
      existing.contact.whatsappNumber,
  )
  if (alreadySet) {
    console.log('Site settings sudah terisi. Melewatkan (jalankan dengan kontak dikosongkan untuk overwrite).')
    process.exit(0)
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      contact: {
        whatsappNumber: '6287787388296',
        phoneNumber: '087787388296',
        contactEmail: 'vour.d3v@gmail.com',
      },
      socials: [
        { label: 'GitHub', href: 'https://github.com/vourstudio', icon: 'github' },
        { label: 'LinkedIn', href: 'https://linkedin.com/company/vourstudio', icon: 'linkedin' },
        { label: 'Instagram', href: 'https://instagram.com/vour.studio', icon: 'instagram' },
        { label: 'TikTok', href: 'https://tiktok.com/@vour.studio', icon: 'tiktok' },
      ],
      mainNav: [
        { label: 'Solutions', href: '/solutions' },
        { label: 'Products', href: '/products' },
        { label: 'Projects', href: '/projects' },
        { label: 'Blog', href: '/resources' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  })

  console.log('Site settings diperbarui: kontak, socials, mainNav.')
  process.exit(0)
}

seedSiteCommand().catch((error) => {
  console.error(error)
  process.exit(1)
})
