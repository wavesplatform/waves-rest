export interface IApiConfig {
  nodes: string
  api: string
  matcher: string
  matcherPublicKey: string,
  gateways?: string,
  chainId: string
}

export const config: { [K in 'testnet' | 'mainnet' | 'stage' | 'local']: IApiConfig } = {
  testnet: {
    nodes: 'https://nodes-testnet.wavesnodes.com/',
    api: 'https://api.testnet.wavesplatform.com/v0/',
    matcher: 'https://matcher-testnet.wavesnodes.com/matcher/',
    matcherPublicKey: '8QUAqtTckM5B8gvcuP7mMswat9SjKUuafJMusEoSn1Gy',
    chainId: 'T',
  },

  mainnet: {
    nodes: 'https://nodes.wavesnodes.com/',
    api: 'https://api.wavesplatform.com/v0/',
    matcher: 'https://matcher.waves.exchange/matcher/',
    gateways: 'https://gw.wavesplatform.com/api/v1/',
    matcherPublicKey: '9cpfKN9suPNvfeUNphzxXMjcnn974eme8ZhWUjaktzU5',
    chainId: 'W',
  },

  stage: {
    nodes: 'https://nodes.wavesnodes.com/',
    api: 'https://api-stage.wavesplatform.com/v0/',
    matcher: 'https://matcher.wavesnodes.org/matcher/',
    matcherPublicKey: '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
    chainId: 'W',
  },

  local: {
    nodes: 'http://localhost:6869/',
    api: '',
    matcher: '',
    matcherPublicKey: '',
    chainId: 'R',
  },
}
