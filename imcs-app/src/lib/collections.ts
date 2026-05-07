export type CollectionConfig = {
  slug: string
  name: string
  displayName: string
  contractAddresses: string[]
  chainId: number
  cap: number
  logo?: string
  closed?: boolean
}

export const COLLECTIONS: CollectionConfig[] = [
  {
    slug: 'cyberkongz',
    name: 'CyberKongz',
    displayName: 'cyberkongz',
    contractAddresses: [
      '0x57a204aa1042f6e66dd7730813f4024114d74f37',
      '0x7b1a5e0807383f84a66c8a1b1af494061a169336',
    ],
    chainId: 1,
    cap: 100,
  },
  {
    slug: 'anonymice',
    name: 'Anonymice',
    displayName: 'anonymice',
    contractAddresses: ['0xbad6186e92002e312078b5a1dafd5ddf63d3f731'],
    chainId: 1,
    cap: 50,
  },
  {
    slug: 'steddy-teddys',
    name: 'Steddy Teddys',
    displayName: 'steddy teddyz',
    contractAddresses: ['0x88888888a9361f15aadbaca355a6b2938c6a674e'],
    chainId: 80094,
    cap: 75,
  },
  {
    slug: 'normies',
    name: 'Normies',
    displayName: 'normiez',
    contractAddresses: ['0x9Eb6E2025B64f340691e424b7fe7022fFDE12438'],
    chainId: 1,
    cap: 75,
  },
  {
    slug: 'good-vibes-club',
    name: 'Good Vibes Club',
    displayName: 'gud vibez club',
    contractAddresses: ['0xB8Ea78fcaCEf50d41375E44E6814ebbA36Bb33c4'],
    chainId: 1,
    cap: 100,
    closed: true,
  },
  {
    slug: 'regenerates',
    name: 'Regenerates',
    displayName: 'regenerates',
    contractAddresses: ['0x26c42724eba22f2d1a2ac5d35b0344bf2f3f8188'],
    chainId: 8453,
    cap: 75,
    closed: true,
  },
]

export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  80094: 'Berachain',
  10: 'Optimism',
  42161: 'Arbitrum',
  137: 'Polygon',
}

export function getCollectionBySlug(slug: string): CollectionConfig | undefined {
  return COLLECTIONS.find(c => c.slug === slug)
}
