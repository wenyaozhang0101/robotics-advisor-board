import type { Faculty, PublicReview } from '../types'

// Preview mode intentionally starts empty. Public profiles must come from the
// moderated production database; the browser never substitutes sample people.
export const demoFaculty: Faculty[] = []
export const demoReviews: PublicReview[] = []
