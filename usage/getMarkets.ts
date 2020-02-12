import { wavesApi, wellKnownTokens } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'
import { order } from '@waves/waves-transactions'

const { getMarkets, placeMarketOrder, placeOrder, getOrderStatus } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  try {
    const { matcherPublicKey, chainId } = config.testnet

    const seed = 'letter column long desk cool image vessel group powder slide polar car size report genuine'

    const o = order({
      amount: 10000000,
      price: 90000000,
      matcherPublicKey,
      amountAsset: null,
      priceAsset: wellKnownTokens.testnet.btc.id,
      orderType: 'sell',
    }, seed)

    const { message } = await placeOrder(o)
    const placed = await getOrderStatus({ orderId: message.id, priceAsset: wellKnownTokens.testnet.btc.id })

    console.log(placed)
  } catch (error) {
    console.log(error)
  }
}

main()
