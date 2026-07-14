import { describe, expect, it } from 'vitest'
import { validateReview } from './validation'
import type { ReviewDraft } from '../types'

const valid: ReviewDraft = { facultyId:'faculty-demo',relationshipType:'interviewed',experienceYear:2025,applicationTerm:'Fall 2025',outreachScore:7,interviewScore:8,offerCommunicationScore:null,studentExperienceScore:null,recommendationScore:8,positiveComment:'The interview expectations were communicated clearly.',concernComment:'',additionalContext:'',dimensions:{},agreed:true,turnstileToken:'' }
describe('review validation',()=>{
  it('accepts a valid relationship-specific review',()=>expect(validateReview(valid).success).toBe(true))
  it('rejects disallowed student scores',()=>expect(validateReview({...valid,studentExperienceScore:8}).success).toBe(false))
  it('rejects invalid score range and missing consent',()=>{
    expect(validateReview({...valid,recommendationScore:11}).success).toBe(false)
    expect(validateReview({...valid,agreed:false}).success).toBe(false)
  })
  it('rejects empty or excessive text',()=>{
    expect(validateReview({...valid,positiveComment:'short'}).success).toBe(false)
    expect(validateReview({...valid,positiveComment:'x'.repeat(2001)}).success).toBe(false)
  })
  it('treats HTML-like input as ordinary text rather than markup',()=>{
    const result=validateReview({...valid,positiveComment:'<script>alert(1)</script> firsthand text'})
    expect(result.success).toBe(true)
    if(result.success) expect(result.data.positiveComment).toContain('<script>')
  })
})
