import type { Image, WorkChapter } from '@/content/schema'

const landscape = (image?: Image) => (image && image.width >= image.height ? image : undefined)

/**
 * A chapter's tile picture: the one picked for it (`tile`), else its lead capture, else its first build
 * with a landscape picture. Null when it has none, so the chapter shows its logo face.
 */
export function chapterPicture(chapter: WorkChapter): Image | null {
  return chapter.tile ?? landscape(chapter.lead) ?? chapter.items.map((item) => landscape(item.image)).find(Boolean) ?? null
}
