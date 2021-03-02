import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getAssetsBalance } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  const address = '3N341VEEExcAt9FtSJ7taaUTCgGQpVbGS1Y'

  try {
    const balance = await getAssetsBalance(address)
    //const b = balance.balances.filter(x => x.assetId === 'HkaoAeH39rqZG7sY9rdhn53KfK2WWd2q3yeDRLgyqfoP')
    
    
    console.log(balance.balances.map(x => ({ assetId: x.assetId, balance: x.balance })))
  } catch (error) {
    console.log(error)
  }
}

main()
