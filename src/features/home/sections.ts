import type { ComponentType } from 'react'
import { AboutSection } from './about/AboutSection'
import { HeroSection } from './hero/HeroSection'
import { AutomationSection } from './automation/AutomationSection'
import { ManifestoSection } from './manifesto/ManifestoSection'
import { ServicesSection } from './services/ServicesSection'
import { WorkSection } from './work/WorkSection'
import { ShowcaseSection } from '@/features/showcase/ShowcasePage'
import { ProofSection } from '@/features/proof/ProofPage'
import { ContactSection } from '@/features/contact/ContactPage'

/**
 * The Home page, in scroll order. Add a section = build it in its own folder (component + css +
 * scene, copy from src/content) and add one line here. Delete a section = remove its line.
 * Each section renders its own <section id> so it can be linked to with /#<id>.
 */
export type HomeSection = { id: string; Component: ComponentType }

export const homeSectionList: HomeSection[] = [
  { id: 'hero', Component: HeroSection },
  { id: 'manifesto', Component: ManifestoSection },
  { id: 'automation', Component: AutomationSection },
  { id: 'work', Component: WorkSection },
  { id: 'services', Component: ServicesSection },
  { id: 'about', Component: AboutSection },
  // Proof, Showcase and Contact keep their own pages too (/proof, /showcase, /contact); here they run as sections.
  { id: 'proof', Component: ProofSection },
  { id: 'showcase', Component: ShowcaseSection },
  // Contact is the last section, after Showcase. /contact stays a page too.
  { id: 'contact', Component: ContactSection },
]
