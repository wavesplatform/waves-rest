import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getBlocks, getHeight, getLastNBlocks } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {

   const height = await getHeight()



   const blocks2 = await getBlocks(height - 250, height).all()
  // const blocks3 = await getBlocks(height - 250, height).first()

   console.log(blocks2.length)
  // console.log(blocks3.length)

  //const lastBlocks = await getLastNBlocks(150).all()

  //console.log(lastBlocks.length)

}

main()