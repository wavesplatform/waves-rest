import { wavesApi, wellKnownTokens } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'
import { order } from '@waves/waves-transactions'

const { getMarkets, placeMarketOrderAndWaitUntilFill, placeOrder, getOrderStatus } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  try {
    const { matcherPublicKey, chainId } = config.testnet

    const seed = 'letter column long desk cool image vessel group powder slide polar car size report genuine'

    const o = order({
      amount: 1000,
      price: 9000000000,
      matcherPublicKey,
      amountAsset: wellKnownTokens.testnet.btc.id,
      priceAsset: wellKnownTokens.testnet.usdn.id,
      orderType: 'sell',
    }, seed)

    const result = await placeMarketOrderAndWaitUntilFill(o)

    console.log(result)
  } catch (error) {
    console.log(error)
  }
}

main()
