import { wavesApi } from '../src'
import axios from 'axios'
import { order, cancelOrder as co, IOrder } from '@waves/waves-transactions'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { placeOrder, cancelOrder } = wavesApi(config.testnet, axiosHttp(axios))

export const testingHostSeed = 'a897148d797746499489466437b300aa87d8d2e6066f40448a3860729bca1a5e'

const main = async () => {
  const ord: IOrder = {
    orderType: 'sell',
    version: 2,
    assetPair: {
      'amountAsset': 'BrmjyAWT5jjr3Wpsiyivyvg5vDuzoX2s93WgiexXetB3',
      'priceAsset': 'D6N2rAqWN6ZCWnCeNFWLGqqjS6nJLeK4m19XiuhdDenr',
    },
    price: 10000,
    amount: 100000000,
    timestamp: 1574942821640,
    expiration: 1577448421640,
    matcherFee: 300000,
    matcherPublicKey: '8QUAqtTckM5B8gvcuP7mMswat9SjKUuafJMusEoSn1Gy',
    senderPublicKey: '6xSRHh8Fd9Nx2JiRy3p5xQ77bEztLyAvbxfHMdB86dMn',
    proofs: [
      '4tS3PbG1dxof1wGh81brfgUTptJ9Gqs2Y4QsJ6K2gn7XmNUyir4Xny4Eu5ZmqHV4VPkgtizsXGsVhbjRGGh7drwn',
    ],

  }

  const orderId = '6QXUy4eSxCouiniBB1XpTiooZYtncrWUWLMXS5L5tWap'

  try {
    await placeOrder(ord)
  } catch (error) {
    console.log(error.isAxiosError)
    console.log(error.response.data)
  }
}

main()
