import {
  TTx,
  WithId,
  WithSender,
  IOrder,
  ICancelOrder,
  IMassTransferTransaction,
  ITransferTransaction,
  IDataTransaction,
  ISetScriptTransaction,
  IIssueTransaction
} from '@waves/waves-transactions'

export type TxWithIdAndSender = TTx & WithId & WithSender

interface TypeExtension extends WithId, WithSender {
  sender: string,
}

export type MassTransferTransaction = IMassTransferTransaction & TypeExtension
export type TransferTransaction = ITransferTransaction & TypeExtension
export type DataTransaction = IDataTransaction & TypeExtension
export type SetScriptTransaction = ISetScriptTransaction & TypeExtension
export type IssueTransaction = IIssueTransaction & TypeExtension
export type Order = IOrder & TypeExtension

export interface IHttp {
  get: <T>(url: string) => Promise<T>
  post: <T>(url: string, data: any) => Promise<T>
}

export const axiosHttp = (axios: any): IHttp => ({
  get: <T>(url: string) => axios.get(url).then((x: any) => x.data as T),
  post: <T>(url: string, data: any) => axios.post(url, data).then((x: any) => x.data as T),
})

export const apolloHttp = (apollo: any): IHttp => {

  class wrapper extends apollo {
    constructor() {
      super()
    }

    async _get(url: string) {
      return this.get(url)
    }

    async _post(url: string, data: any) {
      return this.post(url, data)
    }
  }

  const http = new wrapper()
  http.initialize({ cache: undefined, context: undefined })

  return {
    get: <T>(url: string) => http.get(url).then((x: any) => x as T),
    post: <T>(url: string, data: any) => http.post(url, data).then((x: any) => x as T),
  }
}

export interface IApiConfig {
  nodes: string
  api: string
  matcher: string
  matcherPublicKey: string,
  chainId: string
}

export const config: { [K in 'testnet' | 'mainnet']: IApiConfig } = {
  testnet: {
    nodes: 'https://testnodes.wavesnodes.com/',
    api: 'https://api.testnet.wavesplatform.com/v0/',
    matcher: 'https://matcher.testnet.wavesnodes.com/matcher/',
    matcherPublicKey: '8QUAqtTckM5B8gvcuP7mMswat9SjKUuafJMusEoSn1Gy',
    chainId: 'T',
  },

  mainnet: {
    nodes: 'https://nodes.wavesnodes.com/',
    api: 'https://api.wavesplatform.com/v0/',
    matcher: 'https://matcher.wavesnodes.org/matcher/',
    matcherPublicKey: '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
    chainId: 'W',
  },
}

export type DataType = 'binary' | 'integer' | 'boolean' | 'string'

export interface BaseParams {
  limit?: number
  timeStart?: number
  timeEnd?: number
  sender?: string
  after?: string
}

export interface GetMassTransferTxsParams extends BaseParams {
  recipient?: string
}

export interface GetTransferTxsParams extends BaseParams {
  recipient?: string
}

export interface GetIssueTxsParams extends BaseParams {
  assetId?: string
  script?: string
}

export interface GetDataTxsParams extends BaseParams {
  key?: string
  vaue?: string
  type?: DataType
}

export const delay = (millis: number): Promise<{}> => new Promise((resolve, _) =>
  setTimeout(resolve, millis)
)

const wrapError = (error: any) => {
  let er
  if (error && error.response && error.response.data) {
    switch (error.response.data.error) {
      case 112:
        er = {
          code: 112,
          message: error.response.data.message,
          tx: error.response.data.tx,
        }
        break
      case 199: //script too lagre
        er = {
          code: 199,
          message: error.response.data.message,
        }
        break
      case 306: //error while executing
        er = {
          code: 306,
          message: error.response.data.message,
          tx: error.response.data.transaction,
          vars: error.response.data.vars.reduce((a: [], b: []) => [...a, ...b], []),
        }
        break
      case 307: //not allowed by account script
        er = {
          code: 307,
          message: error.response.data.message,
          tx: error.response.data.transaction,
          vars: error.response.data.vars.reduce((a: [], b: []) => [...a, ...b], []),
        }
        break
      default:
        er = error
    }

    return er
  }
}

export const retry = async <T>(action: () => Promise<T>, limit: number, delayAfterFail: number): Promise<T> => {
  try {
    return await action()
  } catch (error) {
    const er = wrapError(error)
    if (er && er.code)
      throw er
    if (limit < 1)
      throw er
  }

  await delay(delayAfterFail)
  return await retry(action, limit - 1, delayAfterFail)
}

export type ApiIterable<T> = AsyncIterable<T> & { first: () => Promise<T> }

export const wavesApi = (config: IApiConfig, h: IHttp): IWavesApi => {

  const http = {
    get: <T>(url: string): Promise<T> => {
      //console.log(url)
      return h.get(url)
    },
    post: <T>(url: string, data: any): Promise<T> => {
      //console.log(url)
      //console.log(data)
      return h.post(url, data)
    },
  }

  const httpCall = <T>(base: string, endpoint: string, data?: any) =>
    retry(() =>
      data ?
        http.post<T>(base + endpoint, data) :
        http.get<T>(base + endpoint),
      5, 1000)

  const build = (base: string) => ({
    get: <T>(endpoint: string): Promise<T> => httpCall(base, endpoint),
    post: <T>(endpoint: string, data: any): Promise<T> => httpCall(base, endpoint, data),
  })

  const node = build(config.nodes)
  const api = build(config.api)
  const matcher = build(config.matcher)

  const p = (args: any) => Object.entries({ ...args, limit: args.limit || 100 }).map(x => x[1] !== undefined ? `&${x[0]}=` + x[1] : '').join('')

  const asyncIterator = <T extends { lastCursor: string }>(fetch: (lastCursor?: string) => Promise<T>) => <R>(map: (value: T) => R) => (options?: { initialCursor?: string, pageLimit?: number }): ApiIterable<R> => {
    let cursor = options && options.initialCursor
    let pageCount = 0

    const iterator = {
      [Symbol.asyncIterator]: () => ({
        next: async () => {
          if (pageCount >= (options && options.pageLimit || Number.MAX_SAFE_INTEGER))
            return { value: {} as R, done: true }

          const data = await fetch(cursor)
          cursor = data.lastCursor
          pageCount++
          return { value: map(data), done: !cursor }
        },
      }),
      first: () => iterator[Symbol.asyncIterator]().next().then(x => x.value),
    }

    return iterator
  }

  type ApiListReponse<T> = { lastCursor: string, data: { data: T }[] }

  const buildEndpoint = <TParams extends BaseParams, T>(url: string) =>
    (params: TParams, options?: PagingOptions) =>
      asyncIterator<ApiListReponse<T>>((lastCursor?: string) =>
        api.get<ApiListReponse<T>>(`${url}${p({ ...params, after: lastCursor })}`))(x => x.data.map(y => y.data))(options)

  const getDataTxs = buildEndpoint<GetDataTxsParams, DataTransaction>('transactions/data?sort=desc')
  const getMassTransfersTxs = buildEndpoint<GetMassTransferTxsParams, MassTransferTransaction>('transactions/mass-transfer?sort=desc')
  const getTransfersTxs = buildEndpoint<GetTransferTxsParams, TransferTransaction>('transactions/transfer?sort=desc')
  const getIssueTxs = buildEndpoint<GetIssueTxsParams, IssueTransaction>('transactions/issue?sort=desc')

  const getHeight = async () =>
    node.get<{ height: number }>('blocks/last').then(x => x.height)

  const geTxById = async (txId: string): Promise<TxWithIdAndSender> =>
    node.get<TxWithIdAndSender>(`transactions/info/${txId}`)

  const getUtxById = async (txId: string): Promise<TxWithIdAndSender> =>
    node.get<TxWithIdAndSender>(`transactions/unconfirmed/info/${txId}`)

  const broadcast = async (tx: TTx): Promise<TxWithIdAndSender> =>
    node.post<TxWithIdAndSender>('transactions/broadcast', tx)

  const waitForTx = async (txId: string): Promise<TxWithIdAndSender> =>
    retry(async () => geTxById(txId), 999, 1000)

  const geTxsByAddress = async (address: string, limit: number = 100): Promise<TxWithIdAndSender[]> =>
    (await node.get<TxWithIdAndSender[][]>(`transactions/address/${address}/limit/${limit}`))[0]

  const broadcastAndWait = async (tx: TxWithIdAndSender): Promise<TxWithIdAndSender> =>
    await broadcast(tx).then(x => waitForTx(x.id))

  const getUtx = (): Promise<TxWithIdAndSender[]> =>
    node.get<TxWithIdAndSender[]>('transactions/unconfirmed')

  const getBalance = (address: string): Promise<number> =>
    node.get<{ available: number }>(`addresses/balance/details/${address}`).then(x => x.available)

  const getSetScripTxsByScript = (script: string, limit: number = 100): Promise<SetScriptTransaction[]> =>
    api.post<{ data: { data: SetScriptTransaction }[] }>('transactions/set-script', {
      script: 'base64:' + script,
      limit,
    }).then(x => x.data.map(y => y.data))

  const waitForHeight = (height: number): Promise<number> =>
    retry(async () => {
      const h = await getHeight()
      if (h < height)
        throw 'Still waiting'
      return h
    }, 999, 5000)

  const placeOrder = async (order: IOrder) =>
    matcher.post<{ message: any }>('orderbook', order).then(x => x.message as Order)

  const cancelOrder = async (amountAsset: string, priceAsset: string, cancelOrder: ICancelOrder) =>
    matcher.post<void>(`orderbook/${amountAsset}/${priceAsset}/cancel`, cancelOrder)

  return Object.freeze({
    waitForHeight,
    getHeight,
    geTxById,
    getUtxById,
    broadcast,
    waitForTx,
    getDataTxs,
    geTxsByAddress,
    broadcastAndWait,
    getMassTransfersTxs,
    getTransfersTxs,
    getIssueTxs,
    getBalance,
    getUtx,
    getSetScripTxsByScript,
    placeOrder,
    cancelOrder,
    config,
  })
}

//return await this.node.get<IAssetInfo>(`assets/details/${assetId}`)

export interface PagingOptions {
  initialCursor?: string
  pageLimit?: number
}


export interface IWavesApi {
  //getAssetInfo(assetId: string): Promise<IAssetInfo>
  waitForHeight(height: number): Promise<number>
  getHeight(): Promise<number>
  geTxById(txId: string): Promise<TxWithIdAndSender>
  getUtxById(txId: string): Promise<TxWithIdAndSender>
  broadcast(tx: TTx): Promise<TxWithIdAndSender>
  broadcastAndWait(tx: TTx): Promise<TxWithIdAndSender>
  waitForTx(txId: string): Promise<TxWithIdAndSender>
  getDataTxs(params: GetDataTxsParams, options?: PagingOptions): ApiIterable<DataTransaction[]>
  getMassTransfersTxs(params: GetMassTransferTxsParams, options?: PagingOptions): ApiIterable<MassTransferTransaction[]>
  getIssueTxs(params: GetIssueTxsParams, options?: PagingOptions): ApiIterable<IssueTransaction[]>
  getTransfersTxs(params: GetTransferTxsParams, options?: PagingOptions): ApiIterable<TransferTransaction[]>
  geTxsByAddress(address: string, limit?: number): Promise<TxWithIdAndSender[]>
  getUtx(): Promise<TxWithIdAndSender[]>
  getSetScripTxsByScript(script: string, limit?: number): Promise<SetScriptTransaction[]>
  getBalance(address: string): Promise<number>
  placeOrder(order: IOrder): Promise<Order>
  cancelOrder(amountAsset: string, priceAsset: string, cancelOrder: ICancelOrder): Promise<void>
  config: IApiConfig
}