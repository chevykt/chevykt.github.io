import { site } from './site'

export type LegalSection = { heading: string; paragraphs: string[] }

export type LegalDoc = {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

/** What this site actually stores and loads. Keep in sync with src/lib/storage.ts and the contact form. */
export const privacyPolicy: LegalDoc = {
  title: 'Privacy Policy',
  updated: 'October 19, 2026',
  intro: `This covers ${site.url.replace('https://', '')}, the portfolio of ${site.name}.`,
  sections: [
    {
      heading: 'What this site keeps',
      paragraphs: [
        `There are no analytics, ads or tracking cookies. Your browser keeps two settings for this site: your light or dark theme and whether the sidebar is collapsed. When you send the contact form, your name, email and message go to Formspree, which delivers them to me by email; I use them only to reply. The site is hosted on GitHub Pages, which logs visits (IP address, page and time) as any web host does. To see or delete anything I hold about you, email ${site.email}.`,
      ],
    },
  ],
}
