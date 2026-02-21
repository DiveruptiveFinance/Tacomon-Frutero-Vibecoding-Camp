export interface TacoEntry {
  id: string
  name: string
  taqueria: string
  location: string
  imageUrl: string
  timestamp: number
  minted: boolean
  tokenId?: number
}

export interface TacodexStats {
  totalTacos: number
  uniqueTaquerias: number
  streak: number
}
