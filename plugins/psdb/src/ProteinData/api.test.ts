import { ncbiSummaryByIds, ncbiSearch } from './ncbi'
import { expect, it } from '@jest/globals'

it('Searches genes', async () => {
  const res = await ncbiSearch('gene', 'cftr')
  expect(res).toContain('7157')
  expect(res).toContain('7124')
  expect(res).toContain('7422')
})

// it('Searches Pubmed entries', () => {
//   expect(
//     ncbiSearch('pubmed', 'cftr').then((res: string[]) => {
//       expect(res).toContain('7157')
//       expect(res).toContain('7124')
//       expect(res).toContain('7422')
//     })).toReturn()
// })

// it('Finds summaries by ID', () => {
//   expect(
//     ncbiSummaryByIds([''], true).then((res: object[]))
//   ).toReturn()
// })
