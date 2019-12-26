import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'
import { TRANSACTION_TYPE } from '@waves/waves-transactions/dist/transactions'

const { getBlocks, getHeight, getLastNBlocks } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {

  const lastBlocks = await getLastNBlocks(150).all()

  const invokes = lastBlocks.transactions(TRANSACTION_TYPE.INVOKE_SCRIPT)

  console.log(invokes.map(x => x.call!.function))

}

main()