import {
  BaseParams,
  GetDataTxsParams,
  DataTransaction,
  GetMassTransferTxsParams,
  MassTransferTransaction,
  GetTransferTxsParams,
  TransferTransaction,
  GetIssueTxsParams,
  GetInvokeScriptTxsParams,
  IssueTransaction,
  Tx,
  SetScriptTransaction,
  Order,
  OrderStatus,
  OrderbookPair,
  GetAssetsBalanceResponse,
  Distribution,
  AssetInfo,
  PairsResponse,
  IScriptInfo,
  IScriptDecompileResult,
  GetNftBalanceResponse,
  GetMarketsResponse,
  GetBalanceDetailsResponse,
  InvokeScriptTransaction,
  GetSetScriptTxsParams,
  KeyValuePair,
  PagingOptions,
  StateChanges,
  DepositInfo,
  GetAssetBalanceResponse,
  IBlock,
  IBlocks,
  TExt,
  TransactionTypeKey,
  InferTxType,
  TTransactionTypes,
  TransactionTypes,
  GetOrdetStatusParams as GetOrderStatusParams,
  OrderbookPairRestrictions,
  WaitForOrderToFillParams,
} from './types'

export {
  BaseParams,
  GetDataTxsParams,
  DataTransaction,
  GetMassTransferTxsParams,
  MassTransferTransaction,
  GetTransferTxsParams,
  TransferTransaction,
  GetIssueTxsParams,
  IssueTransaction,
  Tx as TxWithIdAndSender,
  SetScriptTransaction,
  Order,
  defaultLimit,
  defaultSort,
  OrderbookPair,
  GetAssetsBalanceResponse as GetAssetsBalanceParams,
  Distribution,
  AssetInfo,
  TransactionTypeKey,
  InferTxType,
  TTransactionTypes,
  TransactionTypes,
} from './types'

import { TTx, IOrder, ICancelOrder, cancelOrder as _cancelOrder, libs } from '@waves/waves-transactions'
import { IApiConfig } from './config'
import { IHttp } from './http-bindings'
import { address } from '@waves/ts-lib-crypto'

export { IHttp, axiosHttp, apolloHttp } from './http-bindings'
export * from './config'
export * from './well-known-tokens'

export const delay = (millis: number): Promise<{}> => new Promise((resolve, _) => setTimeout(resolve, millis))

export const WAVES_ASSET_ID = 'WAVES'

export type EnchancedIterator<T> = AsyncIterable<T> & {
  all: () => Promise<T>
  first: () => Promise<T>
}

const isWavesAsset = (assetId: string) => !assetId || assetId === WAVES_ASSET_ID



const wrapError = (error: any) => {
  let er
  if (error && error.response && error.response.data) {
    switch (error.response.data.error) {
      case 112:
        er = {
          code: 112,
          message: error.response.data.message,
          tx: error.response.data.tx,
          raw: er,
        }
        break
      case 199: //script too lagre
        er = {
          code: 199,
          message: error.response.data.message,
          raw: er,
        }
        break
      case 306: //error while executing
        er = {
          code: 306,
          message: error.response.data.message,
          tx: error.response.data.transaction,
          trace: error.response.data.trace,
          raw: er,
        }
        if (error.response.data.vars) {
          (<any>er).vars = error.response.data.vars.reduce((a: [], b: []) => [...a, ...b], [])
        }
        break
      case 307: //not allowed by account script
        er = {
          code: 307,
          message: error.response.data.message,
          tx: error.response.data.transaction,
          trace: error.response.data.trace,
          raw: er,
        }
        if (error.response.data.vars) {
          (<any>er).vars = error.response.data.vars.reduce((a: [], b: []) => [...a, ...b], [])
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
    if (er && er.code) {
      throw er
    }
    if (limit < 1) {
      throw er
    }
  }

  await delay(delayAfterFail)
  return await retry(action, limit - 1, delayAfterFail)
}

export type ApiIterable<T> = AsyncIterable<{ lastCursor: string, items: T[] }> & { first: () => Promise<{ lastCursor: string, items: T[] }>; take: (count: number) => AsyncIterableIterator<{ lastCursor: string, items: T[] }>, all: () => Promise<T[]> }

export const wavesApi = (config: IApiConfig, h: IHttp): IWavesApi => {
  const http = {
    get: <T>(url: string): Promise<T> =>
      h.get(url),
    post: <T>(url: string, data: any): Promise<T> =>
      h.post(url, data),
  }

  const defaultLimit = config.chainId === 'W' ? 1000 : 10000

  const joinUrl = (a: string, b: string) => {
    const aa = a.endsWith('/') ? a.slice(undefined, -1) : a
    const bb = a.startsWith('/') ? b.slice(1) : b
    return aa + '/' + bb
  }

  const httpCall = <T>(base: string, endpoint: string, data?: any) => data ? http.post<T>(joinUrl(base, endpoint), data) : http.get<T>(joinUrl(base, endpoint))

  const noEnpoint = <T>(): Promise<T> => {
    throw new Error(`Endpoint is not awailable in chain with ID: ${config.chainId}`)
  }

  const build = (base?: string) => ({
    get: <T>(endpoint: string): Promise<T> => base ? httpCall(base, endpoint) : noEnpoint<T>(),
    post: <T>(endpoint: string, data: any): Promise<T> => base ? httpCall(base, endpoint, data) : noEnpoint<T>(),
  })

  const node = build(config.nodes)
  const api = build(config.api)
  const matcher = build(config.matcher)
  const gateways = build(config.gateways)

  // const p = (args: BaseParams) =>
  //   Object.entries({ ...args, limit: args.limit || defaultLimit, sort: args.sort || defaultSort })
  //     .map(x => (x[1] !== undefined ? `${x[0]}=${x[1]}` : undefined))
  //     .filter(x => x !== undefined)
  //     .join('&')

  const asyncIterator = <T extends { lastCursor: string }>(fetch: (lastCursor?: string) => Promise<T>) => <R>(
    map: (value: T) => { lastCursor: string, items: R[] }
  ) => (options?: { initialCursor?: string; pageLimit?: number }): ApiIterable<R> => {
    let cursor = options && options.initialCursor
    let pageCount = 0

    async function* createIterator() {
      do {
        const data = await fetch(cursor)

        yield map(data)
        cursor = data.lastCursor
        pageCount++
      } while (cursor && pageCount < ((options && options!.pageLimit) || Number.MAX_SAFE_INTEGER))
    }

    const iterator = createIterator()

    async function* take<T>(iterator: AsyncIterableIterator<T>, count: number) {
      let take = 0
      do {
        const data = await iterator.next()
        yield data.value
        take++
      } while (take < count)
    }

    const ext = (iterator: AsyncIterableIterator<{ lastCursor: string, items: R[] }>) => ({
      ...iterator,
      first: () => iterator.next().then(x => x.value),
      take: (count: number) => ext(take(iterator, count)),
      all: async () => {
        const all: R[][] = []
        for await (const i of iterator) {
          all.push(i.items)
        }
        return all.reduce((a, b) => [...a, ...b], [])
      },
    })

    return ext(iterator)
  }

  type ApiListReponse<T> = { lastCursor: string; data: { data: T }[] }

  const buildEndpoint = <TParams extends BaseParams, T>(url: string) => (params: TParams, options?: PagingOptions) =>
    asyncIterator<ApiListReponse<T>>((lastCursor?: string) =>
      api.post<ApiListReponse<T>>(url, { ...params, after: lastCursor })
    )(x => ({ lastCursor: x.lastCursor, items: x.data.map(y => y.data) }))(options)

  const getDataTxs = buildEndpoint<GetDataTxsParams, DataTransaction>('transactions/data?')
  const getMassTransfersTxs = buildEndpoint<GetMassTransferTxsParams, MassTransferTransaction>(
    'transactions/mass-transfer?'
  )
  const getTransfersTxs = buildEndpoint<GetTransferTxsParams, TransferTransaction>('transactions/transfer?')

  const getIssueTxs = buildEndpoint<GetIssueTxsParams, IssueTransaction>('transactions/issue?')

  const getInvokeScriptTxs = buildEndpoint<GetInvokeScriptTxsParams, InvokeScriptTransaction>('transactions/invoke-script?')

  const getSetScriptTxs = buildEndpoint<GetSetScriptTxsParams, SetScriptTransaction>('transactions/set-script?')

  const getHeight = async () => node.get<{ height: number }>('blocks/last').then(x => x.height)

  const getBlocksTransactions = async (from: number, to: number): Promise<Tx[]> => {
    const blocks = await node.get<IBlock[]>(`blocks/seq/${from}/${to}`)
    const txs = blocks.map(x => x.transactions.map(tx => { tx.height = x.height; return tx }))
    return ([] as Tx[]).concat.apply([], txs)
  }

  const getTxById = async (txId: string): Promise<Tx> =>
    node.get<Tx>(`transactions/info/${txId}`)

  const getUtxById = async (txId: string): Promise<Tx> =>
    node.get<Tx>(`transactions/unconfirmed/info/${txId}`)

  const broadcast = async (tx: TTx): Promise<Tx> =>
    node.post<Tx>('transactions/broadcast', tx)

  const waitForTx = async (txId: string, timeoutInSeconds = 60): Promise<Tx> => retry(async () => getTxById(txId), timeoutInSeconds, 1000)

  const getTxsByAddress = async (address: string, limit: number = 100): Promise<Tx[]> =>
    node.get<Tx[][]>(`transactions/address/${address}/limit/${limit}`).then(x => x[0])

  const broadcastAndWait = async (tx: Tx, timeoutInSeconds = 60): Promise<Tx> =>
    broadcast(tx).then(x => waitForTx(x.id, timeoutInSeconds))

  const getAssetDistribution = async (assetId: string, height?: number, limit: number = 999): Promise<Distribution> =>
    node.get<Distribution>(`assets/${assetId}/distribution/${height || await getHeight() - 1}/limit/${limit}`)

  const _assetInfoCache: Record<string, AssetInfo> = {}

  const getAssetInfo = async (assetId: string): Promise<AssetInfo> => {
    if (assetId === WAVES_ASSET_ID) {
      return {
        assetId: WAVES_ASSET_ID,
        decimals: 8,
        description: WAVES_ASSET_ID,
        issueHeight: 0,
        issueTimestamp: 0,
        issuer: WAVES_ASSET_ID,
        name: WAVES_ASSET_ID,
        minSponsoredAssetFee: 0,
        quantity: 0,
        reissuable: false,
        scripted: false,
      }
    }

    if (_assetInfoCache[assetId])
      return _assetInfoCache[assetId]

    return node.get<AssetInfo>(`assets/details/${assetId}`).then(info => {
      _assetInfoCache[assetId] = info
      return info
    })
  }

  const stateChanges = async (txId: string): Promise<StateChanges> =>
    node.get<StateChanges>(`debug/stateChanges/info/${txId}`)

  const getUtx = (): Promise<Tx[]> => node.get<Tx[]>('transactions/unconfirmed')

  const getBalance = (address: string): Promise<number> =>
    node.get<{ available: number }>(`addresses/balance/details/${address}`).then(x => x.available)

  const getBalanceDetails = (address: string): Promise<GetBalanceDetailsResponse> =>
    node.get(`addresses/balance/details/${address}`)

  const getAssetsBalance = (address: string): Promise<GetAssetsBalanceResponse> => node.get(`assets/balance/${address}`)

  const getAssetBalance = (address: string, assetId: string): Promise<GetAssetBalanceResponse> => node.get(`assets/balance/${address}/${assetId}`)

  const waitForBalance = (address: string, expectedBalance: number): Promise<number> =>
    retry(async () => {
      const balance = await getBalance(address)
      if (balance < expectedBalance) {
        throw new Error('still waiting for balane')
      }
      return balance
    }, 100, 1000)

  const waitForAssetBalance = (address: string, assetId: string, expectedBalance: number): Promise<number> =>
    isWavesAsset(assetId) ?
      waitForBalance(address, expectedBalance) :
      retry(async () => {
        const { balance } = await getAssetBalance(address, assetId)
        if (balance < expectedBalance) {
          throw new Error('still waiting for balane')
        }
        return balance
      }, 100, 1000)

  const getNftBalance = (address: string, limit: number = defaultLimit): Promise<GetNftBalanceResponse> => node.get(`assets/nft/${address}/limit/${limit}`)

  const waitForHeight = (height: number): Promise<number> =>
    retry(async () => {
      const h = await getHeight()
      if (h < height) throw 'Still waiting'
      return h
    }, 999, 5000)

  const getOrderbookPair = async (amountAsset: string, priceAsset: string): Promise<OrderbookPair> =>
    matcher.get<OrderbookPair>(`orderbook/${amountAsset}/${priceAsset}`)

  const getOrderbookPairRestrictions = async (amountAsset: string | { id: string, decimals: number }, priceAsset: string | { id: string, decimals: number }): Promise<OrderbookPairRestrictions> => {

    if (!amountAsset)
      amountAsset = WAVES_ASSET_ID

    if (!priceAsset)
      priceAsset = WAVES_ASSET_ID

    const [{ id: amountAssetId, decimals: amountDecimals }, { id: priceAssetId, decimals: priceDecimals }] = await Promise.all([
      typeof amountAsset === 'string' ? getAssetInfo(amountAsset).then(({ decimals }) => ({ id: amountAsset, decimals })) : Promise.resolve(amountAsset),
      typeof priceAsset === 'string' ? getAssetInfo(priceAsset).then(({ decimals }) => ({ id: priceAsset, decimals })) : Promise.resolve(priceAsset)
    ])

    return await matcher.get<OrderbookPairRestrictions>(`orderbook/${amountAssetId}/${priceAssetId}/info`)
      .then(x => ({
        matchingRules: { tickSize: Number(x.matchingRules.tickSize) * Math.pow(10, priceDecimals) },
        restrictions: x.restrictions ? {
          maxAmount: Number(x.restrictions.maxAmount) * Math.pow(10, amountDecimals),
          minAmount: Number(x.restrictions.minAmount) * Math.pow(10, amountDecimals),
          maxPrice: Number(x.restrictions.maxPrice) * Math.pow(10, priceDecimals),
          minPrice: Number(x.restrictions.minPrice) * Math.pow(10, priceDecimals),
          stepAmount: Number(x.restrictions.stepAmount) * Math.pow(10, amountDecimals),
          stepPrice: Number(x.restrictions.stepPrice) * Math.pow(10, priceDecimals),
        } : null,
      }))
  }


  const placeOrder = async (order: IOrder) =>
    matcher.post<{ success: boolean, message: Order & { id: string }, status: string }>('orderbook', order).then(x => x)

  const placeMarketOrder = async (order: IOrder) =>
    matcher.post<{ success: boolean, message: Order & { id: string }, status: string }>('orderbook/market', order).then(x => x)

  const placeMarketOrderAndWaitUntilFill = async (order: IOrder, timeoutInSeconds = 3) => {
    const result = await placeMarketOrder(order)
    if (result.status !== 'OrderAccepted')
      throw new Error(JSON.stringify(result))
    return waitForOrderStatus({
      orderId: result.message.id,
      status: 'Filled',
      amountAsset: result.message.assetPair.amountAsset,
      priceAsset: result.message.assetPair.priceAsset,
      timeoutInSeconds,
    })
  }

  const getOrderStatus = async ({ orderId, amountAsset, priceAsset }: GetOrderStatusParams) =>
    matcher.get<OrderStatus>(`orderbook/${amountAsset || WAVES_ASSET_ID}/${priceAsset || WAVES_ASSET_ID}/${orderId}`)

  const waitForOrderStatus = async ({ orderId, amountAsset, priceAsset, status, timeoutInSeconds }: WaitForOrderToFillParams): Promise<OrderStatus> =>
    retry(async () => getOrderStatus({ orderId, amountAsset, priceAsset })
      .then(x => x.status === status ? Promise.resolve(x) : Promise.reject('retry')), timeoutInSeconds || 3, 1000)
      .catch(x => Promise.reject('timeout'))

  const cancelOrder = async (amountAsset: string, priceAsset: string, cancelOrder: ICancelOrder) =>
    matcher.post<void>(`orderbook/${amountAsset}/${priceAsset}/cancel`, cancelOrder)

  const getKeyValuePairs = (address: string): Promise<KeyValuePair[]> =>
    node.get<KeyValuePair[]>(`addresses/data/${address}`).then(x => x.map(({ type, value, key }) => ({ type, key, value: value.toString() })))

  const getValueByKey = (address: string, key: string): Promise<KeyValuePair> =>
    node.get<KeyValuePair>(`addresses/data/${address}/${key}`)

  const getWavesExchangeRate = (to: 'btc' | 'usd'): Promise<number> => {
    const map = {
      btc: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
      usd: 'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
    }
    const matcherAddress = address({ publicKey: config.matcherPublicKey }, config.chainId)
    const amountAsset = 'WAVES'
    const priceAsset = map[to]

    return api.get<any>(`matcher/${matcherAddress}/pairs/${amountAsset}/${priceAsset}`)
      .then(x => x.data as PairsResponse)
      .then(x => x.lastPrice)
  }

  const getMarkets = () =>
    matcher.get<GetMarketsResponse>('orderbook')

  const getScriptInfo = (address: string): Promise<IScriptInfo> =>
    node.get<IScriptInfo>(`addresses/scriptInfo/${address}`)

  const decompileScript = (scriptBinary: string) =>
    node.post<IScriptDecompileResult>('utils/script/decompile', scriptBinary)

  const getDepositInfo = (userAddress: string, assetId: string) =>
    gateways.post<DepositInfo>('external/deposit', { userAddress, assetId })

  return Object.freeze({

    //height
    getHeight,
    waitForHeight,

    //blocks
    getBlocksTransactions,

    //txs
    getTxById,
    waitForTx,
    getUtx,
    getUtxById,
    getTxsByAddress,

    //txs filters
    getTransfersTxs,
    getIssueTxs,
    getMassTransfersTxs,
    getDataTxs,
    getInvokeScriptTxs,
    getSetScriptTxs,

    //data
    getKeyValuePairs,
    getValueByKey,

    //balance
    getBalance,
    getBalanceDetails,
    waitForAssetBalance,
    waitForBalance,

    //assets
    getAssetDistribution,
    getAssetsBalance,
    getAssetBalance,
    getAssetInfo,
    getNftBalance,

    //scripts
    getScriptInfo,
    decompileScript,
    stateChanges,


    //matcher
    placeOrder,
    placeMarketOrder,
    placeMarketOrderAndWaitUntilFill,
    getOrderStatus,
    waitForOrderStatus,
    cancelOrder,
    getOrderbookPair,
    getOrderbookPairRestrictions,
    getWavesExchangeRate,
    getMarkets,

    //gateways
    getDepositInfo,

    //broadcast
    broadcast,
    broadcastAndWait,

    config,
  })
}

export interface IWavesApi {

  //height
  getHeight(): Promise<number>
  waitForHeight(height: number): Promise<number>

  //blocks
  getBlocksTransactions(from: number, to: number): Promise<Tx[]>

  //txs
  getTxById(txId: string): Promise<Tx>
  waitForTx(txId: string, timeoutInSeconds?: number): Promise<Tx>
  getUtx(): Promise<Tx[]>
  getUtxById(txId: string): Promise<Tx>
  getTxsByAddress(address: string, limit?: number): Promise<Tx[]>

  //txs filters
  getTransfersTxs(params: GetTransferTxsParams, options?: PagingOptions): ApiIterable<TransferTransaction>
  getIssueTxs(params: GetIssueTxsParams, options?: PagingOptions): ApiIterable<IssueTransaction>
  getMassTransfersTxs(params: GetMassTransferTxsParams, options?: PagingOptions): ApiIterable<MassTransferTransaction>
  getDataTxs(params: GetDataTxsParams, options?: PagingOptions): ApiIterable<DataTransaction>
  getInvokeScriptTxs(params: GetInvokeScriptTxsParams, options?: PagingOptions): ApiIterable<InvokeScriptTransaction>
  getSetScriptTxs(params: GetSetScriptTxsParams, options?: PagingOptions): ApiIterable<SetScriptTransaction>

  //data
  getKeyValuePairs(address: string): Promise<KeyValuePair[]>
  getValueByKey(address: string, key: string): Promise<KeyValuePair>

  //balance
  getBalance(address: string): Promise<number>
  getBalanceDetails(address: string): Promise<GetBalanceDetailsResponse>
  waitForAssetBalance(address: string, assetId: string, amount: number): Promise<number>
  waitForBalance(address: string, amount: number): Promise<number>

  //assets
  getAssetDistribution(assetId: string, height?: number, limit?: number): Promise<Distribution>
  getAssetsBalance(address: string): Promise<GetAssetsBalanceResponse>
  getAssetBalance(address: string, assetId: string): Promise<GetAssetBalanceResponse>
  getAssetInfo(assetId: string): Promise<AssetInfo>
  getNftBalance(address: string): Promise<GetNftBalanceResponse>

  //scripts
  getScriptInfo(address: string): Promise<IScriptInfo>
  decompileScript(scriptBinary: string): Promise<IScriptDecompileResult>
  stateChanges(txId: string): Promise<StateChanges>



  //matcher
  placeOrder(order: IOrder): Promise<{ success: boolean, message: Order & { id: string }, status: string }>
  placeMarketOrder(order: IOrder): Promise<{ success: boolean, message: Order & { id: string }, status: string }>
  placeMarketOrderAndWaitUntilFill(order: IOrder, timeoutInSeconds?: number): Promise<OrderStatus>
  getOrderStatus(params: GetOrderStatusParams): Promise<OrderStatus>
  waitForOrderStatus({ orderId, amountAsset, priceAsset, status, timeoutInSeconds }: WaitForOrderToFillParams): Promise<OrderStatus>
  cancelOrder(amountAsset: string, priceAsset: string, cancelOrder: ICancelOrder): Promise<void>
  getOrderbookPair(amountAsset: string, priceAsset: string): Promise<OrderbookPair>
  getOrderbookPairRestrictions(amountAsset: string | { id: string, decimals: number }, priceAsset: string | { id: string, decimals: number }): Promise<OrderbookPairRestrictions>
  getWavesExchangeRate(to: 'btc' | 'usd'): Promise<number>
  getMarkets(): Promise<GetMarketsResponse>

  //gateways
  getDepositInfo(userAddress: string, assetId: string): Promise<DepositInfo>

  //broadcast
  broadcast(tx: TTx): Promise<Tx>
  broadcastAndWait(tx: TTx, timeoutInSeconds?: number): Promise<Tx>

  config: IApiConfig
}

