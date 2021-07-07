import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { evaluate } = wavesApi(config.mainnet, axiosHttp(axios))

const main = async () => {
  const result = await evaluate('3PNze6jf5ZvScSj1cmiq34Jby825MV49gR3', 'advise("3P9ZegsKUtsEpdRPNVrMH7nHEEqY5MrmjDp")').catch(x => {
    console.log(x)
  })

  console.log(result)
}

main()