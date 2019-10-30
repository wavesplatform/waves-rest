import { wavesApi, wellKnownTokens } from '../src'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'
import axios from 'axios'
import { address } from '@waves/waves-crypto'
import { randomSeed } from '@waves/ts-lib-crypto'

const { getDepositInfo } = wavesApi(config.mainnet, axiosHttp(axios))

const main = async () => {

  const adr = address(randomSeed())

  try {
    const r = await getDepositInfo(adr, wellKnownTokens.mainnet.eth.id)
    console.log(r)
  } catch (error) {
    console.log(error)
  }
}

main()

