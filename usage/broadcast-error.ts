
import { wavesApi } from '../src'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'
import axios from 'axios'

const { broadcast } = wavesApi(config.testnet, axiosHttp(axios))

const txJson = '{"type":16,"version":1,"senderPublicKey":"CQjUfoG5dKusja4HD6QF9iLfKWwQErtugATsCgqhNm9K","dApp":"3MwGdE779Vhf4bkn8UbqQqEQwos38KtWhsn","call":{"args":[{"type":"binary","value":"base64:Qgf1Ky0iRL6zd91N5OOVt6ksDLZ9Dy/uiDHyJWtmGtU="}],"function":"create"},"payment":[],"fee":1000000,"timestamp":1561550663301,"chainId":84,"proofs":["xv2xvzXyzGjDzshJ7UV7P5rgtJtfpidnZ2LAmdhQNmGWmW5X5rJPcehAQvRWcL8VYp5V9kCNzTm444CfBKWgrea"],"id":"AyjxedjKCdTJXhGQnfxn6abTgSLsci2CBnnQK6isWcKw"}'
const tx = JSON.parse(txJson)


const main = async () => {
  try {
    const r = await broadcast(tx)
    console.log(r)
  } catch (error) {
    console.log(error)
  }
}

main()

