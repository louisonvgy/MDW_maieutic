import { useMemo } from 'react'
import rawData from '../data.json'

export function useFilteredData({ annee = null, cnu = null, etablissement = null } = {}) {
  return useMemo(() =>
    rawData.filter(d =>
      (!annee || d.annee === annee) &&
      (!cnu || d.cnu_norm === cnu) &&
      (!etablissement || d.etablissement_norm === etablissement)
    ),
    [annee, cnu, etablissement]
  )
}

export const allData = rawData
