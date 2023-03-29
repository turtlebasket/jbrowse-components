import { useState } from 'react'
import { ncbiSearch, searchPubmed } from '../ProteinData/ncbi'
import ViewType from '@jbrowse/core/pluggableElementTypes/ViewType'
import React from 'react'

const NCBISearchView = () => {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState('')
  const [currTypeId, setCurrId] = useState('gene')

  const opts = [
    ['Gene', 'gene'],
    ['Genome', 'genome'],
    ['Protein', 'protein'],
    ['PubMed Paper', 'pubmed'],
  ]

  return (
    <div className="searchbar-view">
      <div className="searchbar-container">
        <input
          placeholder="Enter search query..."
          className="searchbar"
          onChange={val => setQuery(val)}
        />
        <select
          className="searchbar-item"
          name="datatypes"
          onChange={(val: string) => setCurrId(val)}
        >
          {div.forEach(() => {
            return <div></div>
          })}
        </select>
        <button className="btn-primary" onClick={() => {}}>
          Search
        </button>
      </div>
    </div>
  )
}

function installNcbiSearch(pluginManager) {
  pluginManager.addViewType(
    new ViewType({
      name: 'NCBI Search View',
      stateModel: {},
      ReactComponent: NCBISearchView,
    }),
  )
}

export default installNcbiSearch
