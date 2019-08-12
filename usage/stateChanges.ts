import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { stateChanges } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  const r = await stateChanges('E4W4dkMCubrDsJAJfZbQQE3DxvLtN9uAbQGk7wBGJ15J')
  console.log(r)
}

main()