import { wavesApi, config, axiosHttp } from '../src'
import axios from 'axios'
import { order, cancelOrder as co } from '@waves/waves-transactions'

const { placeOrder, cancelOrder } = wavesApi(config.testnet, axiosHttp(axios))

export const testingHostSeed = 'a897148d797746499489466437b300aa87d8d2e6066f40448a3860729bca1a5e'

const main = async () => {
  const ord = order({
    amount: 1,
    price: Math.round(0.1 * Math.pow(10, 16)),
    amountAsset: 'FSL5oQL7YEE7B4qJvKo4gcxaKAKJT8UyjkBtaGTdjHiK',
    priceAsset: null,
    orderType: 'buy',
    matcherPublicKey: config.testnet.matcherPublicKey,
  }, testingHostSeed)

  try {
    const r1 = await placeOrder(ord)
    const c = co({ orderId: ord.id }, testingHostSeed)
    console.log(c)
    const r2 = await cancelOrder(ord.assetPair.amountAsset!, 'WAVES', c)
    console.log(r2)
  } catch (error) {
    console.log(error)
  }

}

main()