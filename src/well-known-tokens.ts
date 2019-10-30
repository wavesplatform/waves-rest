
export interface ITokenInfo {
  id: string
  name: string
  decimals: number
  ticker: string
}

export interface IWellKnownTokens {
  btc: ITokenInfo,
  eth: ITokenInfo,
  usd: ITokenInfo,
}

export const wellKnownTokens: { [K in 'testnet' | 'mainnet']: IWellKnownTokens } = {
  mainnet: {
    btc: {
      id: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
      name: 'Bitcoin',
      ticker: 'BTC',
      decimals: 8,
    },
    eth: {
      id: '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu',
      name: 'Etherium',
      ticker: 'ETH',
      decimals: 8,
    },
    usd: {
      id: 'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
      name: 'US Dollar',
      ticker: 'USD',
      decimals: 2,
    },
  },
  testnet: {
    btc: {
      id: 'DWgwcZTMhSvnyYCoWLRUXXSH1RSkzThXLJhww9gwkqdn',
      name: 'Bitcoin',
      ticker: 'BTC',
      decimals: 8,
    },
    eth: {
      id: 'BrmjyAWT5jjr3Wpsiyivyvg5vDuzoX2s93WgiexXetB3',
      name: 'Etherium',
      ticker: 'ETH',
      decimals: 8,
    },
    usd: {
      id: 'D6N2rAqWN6ZCWnCeNFWLGqqjS6nJLeK4m19XiuhdDenr',
      name: 'US Dollar',
      ticker: 'USD',
      decimals: 2,
    },
  },
}