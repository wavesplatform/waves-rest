import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getValuesByKeys } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  const [dapp, owner] = await getValuesByKeys('3N47sZjCm6r1zyPvrWJcAdBmPHxxYJx2zzL', 'dapp', 'owner')
  console.log({ dapp, owner })
}

main()