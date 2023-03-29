const url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

/**
 * Run NCBI search
 * @param db DB to search (gene, genome, pubmed)
 * @param query Search query containing keywords
 * @returns IDs matching keyword
 */
export async function ncbiSearch(
  db: 'gene' | 'genome' | 'pubmed',
  query: string,
) {
  const res = await fetch(`${url}/esearch.fcgi?db=${db}&term=${query}`)
  const blob = await res.blob()
  const val = await blob.text()
  const xmlParser = new DOMParser().parseFromString(val, 'text/xml')
  const els = xmlParser.getElementsByTagName('Id')
  const ids: string[] = []
  for (let i = 0; i < els.length; i++) {
    ids.push(els[i].innerHTML)
  }
  return ids
}

/**
 * NCBI DB entry summaries by ID
 * @param ids ID (or array of IDs) to check
 * @returns A summary for each ID
 */
export async function ncbiSummaryByIds(
  ids: string | string[],
  short = true
): Promise<object | object[]> { 
  const res = await fetch(`${url}/esummary.fcgi?db=gene&id=${String(ids)}`);
  const blob = await res.blob()
  const val = await blob.text()
  const summaries = []
  const xmlParser = new DOMParser().parseFromString(val, 'text/xml')
  const summaryEls = xmlParser.getElementsByTagName('DocumentSummary')
  if (short) {
  }
  else {
    for (let i = 0; i < summaryEls.length; i++) {
      const el = summaryEls[i]
      summaries.push({
      })
    }
  }

  return summaries.length == 1 ? summaries[0] : summaries
}
