import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getBlocks, getHeight, getLastNBlocks } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {

  const height = await getHeight()
  const a = await getBlocks(height - 10, height)
  const b = await getLastNBlocks(10)

  //console.log(JSON.stringify(a, undefined, 2))
  console.log(JSON.stringify(b, undefined, 2))
}

main()