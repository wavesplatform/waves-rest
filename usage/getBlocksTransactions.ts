import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getBlocks, getHeight, getLastNBlocks } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {

  const lastBlocks = await getLastNBlocks(150).all()

  const invokes = lastBlocks.transactions('invokeScript')
  const result = lastBlocks.transactionsByType('invokeScript')

  console.log(invokes.map(x => x.call!.function))
  console.log(result)

  


}

main()