import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { facultyRequestSchema, reviewSchema } from './schemas.ts'

Deno.test('server schema rejects relationship-incompatible fields',()=>{
  const result=reviewSchema.safeParse({facultyId:crypto.randomUUID(),relationshipType:'outreach_only',experienceYear:2025,applicationTerm:'',outreachScore:7,interviewScore:8,offerCommunicationScore:null,studentExperienceScore:null,recommendationScore:7,positiveComment:'A sufficiently detailed firsthand observation.',concernComment:'',additionalContext:'',dimensions:{},agreed:true,turnstileToken:'test'})
  assertEquals(result.success,false)
})
Deno.test('public schema has no reviewer identity field',()=>{
  const shape=reviewSchema.innerType().shape
  assert(!('reviewerId' in shape)); assert(!('email' in shape))
})
Deno.test('faculty request normalizes public research metadata',()=>{
  const result=facultyRequestSchema.safeParse({proposedName:'Test Faculty',proposedUniversity:'Test University',proposedDepartment:'Robotics',proposedCountry:'Canada',researchAreas:'Robot learning, Motion planning, Robot learning',officialProfileUrl:'https://example.edu/faculty/test',turnstileToken:'test'})
  assert(result.success)
  assertEquals(result.data.researchAreas,['Robot learning','Motion planning'])
})
