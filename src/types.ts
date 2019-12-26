import {
  TTx,
  WithId,
  WithSender,
  IOrder,
  ICancelOrder,
  IAliasTransaction,
  ICancelLeaseTransaction,
  IExchangeTransaction,
  IBurnTransaction,
  IMassTransferTransaction,
  ITransferTransaction,
  IDataTransaction,
  ISetScriptTransaction,
  IIssueTransaction,
  IInvokeScriptTransaction,
} from '@waves/waves-transactions'
import { TTransactionType } from '@waves/waves-transactions/dist/transactions'
import { TxTypeMap } from '@waves/waves-transactions/dist/make-tx'

export type LONG = string | number
export type Sort = 'asc' | 'desc'

export const defaultSort: Sort = 'desc'

export const defaultLimit = 100

export type DataType = 'binary' | 'integer' | 'boolean' | 'string'

export type TxWithIdAndSender = TTx & WithIdAndSender

export interface WithIdAndSender extends WithId, WithSender {
  sender: string
}

export type FieldToString<T, K extends keyof T> = Omit<T, K> & { [P in K]: string }

export interface NxtConsensus {
  'nxt-consensus': {
    'base-target': number
    'generation-signature': string
  }
}


export interface IBlock extends NxtConsensus {
  blocksize: number
  reward: number
  signature: string
  fee: number
  generator: string
  transactions: TxWithIdAndSender[]
  version: number
  reference: string
  features: any[]
  totalFee: number
  desiredReward: number
  transactionCount: number
  timestamp: number
  height: number
}

export interface IBlocksTransactions {
  <T extends TTransactionType>(filterByType: T): Array<TxTypeMap[T] & WithIdAndSender>
  (filter: (tx: TxWithIdAndSender) => boolean): Array<TxWithIdAndSender>
}

export interface IBlocks extends Array<IBlock> {
  transactions: IBlocksTransactions
}

export type AliasTransaction = FieldToString<IAliasTransaction, 'timestamp'> & WithIdAndSender
export type CancelLeaseTransaction = FieldToString<ICancelLeaseTransaction, 'timestamp'> & WithIdAndSender
export type ExchangeTransaction = FieldToString<IExchangeTransaction, 'timestamp'> & WithIdAndSender
export type BurnTransaction = FieldToString<IBurnTransaction, 'timestamp'> & WithIdAndSender
export type TransferTransaction = FieldToString<ITransferTransaction, 'timestamp'> & WithIdAndSender
export type MassTransferTransaction = FieldToString<IMassTransferTransaction, 'timestamp'> & WithIdAndSender
export type DataTransaction = FieldToString<IDataTransaction, 'timestamp'> & WithIdAndSender
export type SetScriptTransaction = FieldToString<ISetScriptTransaction, 'timestamp'> & WithIdAndSender
export type IssueTransaction = FieldToString<IIssueTransaction, 'timestamp'> & WithIdAndSender
export type InvokeScriptTransaction = FieldToString<IInvokeScriptTransaction, 'timestamp'> & WithIdAndSender
export type Order = IOrder & WithIdAndSender

export interface BaseParams {
  limit?: number
  timeStart?: number
  timeEnd?: number
  sender?: string
  after?: string
  sort?: Sort
}

export interface GetMassTransferTxsParams extends BaseParams {
  recipient?: string
}

export interface GetTransferTxsParams extends BaseParams {
  recipient?: string
  assetId?: string
}

export interface GetIssueTxsParams extends BaseParams {
  assetId?: string
  script?: string
}

export interface GetInvokeScriptTxsParams extends BaseParams {
  dapp?: string
  function?: string
}

export interface GetSetScriptTxsParams extends BaseParams {
  script?: string
}

export interface GetReissueTxsParams extends BaseParams {
  assetId?: string
}

export interface GetBurnTxsParams extends BaseParams {
  assetId?: string
}

export interface GetExchangeTxsParams extends BaseParams {
  matcher?: string
  amountAsset?: string
  priceAsset?: string
}

export interface GetLeaseTxsParams extends BaseParams {
  recipient?: string
}

export interface GetLeaseCancelTxsParams extends BaseParams { }

export interface GetDataTxsParams extends BaseParams {
  key?: string
  vaue?: string
  type?: DataType
}

export interface AssetBalance {
  assetId: string
  balance: number
  reissuable: boolean
  minSponsoredAssetFee: number | null
  sponsorBalance: number | null
  quantity: number
  issueTransaction: IssueTransaction
}

export type AmountPricePair = {
  amountAsset: string
  priceAsset: string
}

export type AmountPrice = {
  amount: string
  price: string
}

export interface OrderbookPair {
  pair: AmountPricePair
  bids: AmountPrice[]
  asks: AmountPrice[]
}

export interface Distribution {
  hasNext: boolean
  lastItem: string
  items: { [address: string]: number }
}

export interface AssetInfo {
  assetId: string
  issueHeight: number
  issueTimestamp: number
  issuer: string
  name: string
  description: string
  decimals: number
  reissuable: boolean
  quantity: number
  scripted: boolean
  minSponsoredAssetFee: number | null
}

export interface PairsResponse {
  firstPrice: number
  lastPrice: number
  low: number
  high: number
  weightedAveragePrice: number
  volume: number
  quoteVolume: number
  volumeWaves: number
  txsCount: number
}

export interface GetAssetsBalanceResponse {
  address: string
  balances: AssetBalance[]
}

export interface GetAssetBalanceResponse {
  address: string
  assetId: string
  balance: number
}

export interface GetBalanceDetailsResponse {
  address: string
  regular: number
  generating: number
  available: number
  effective: number
}

export type GetNftBalanceResponse = {
  senderPublicKey: string
  quantity: number
  fee: number
  description: string
  type: number
  version: number
  reissuable: boolean
  script: string
  sender: string
  feeAssetId: string
  chainId: number
  proofs: string[]
  assetId: string
  decimals: number
  name: string
  id: string
  timestamp: number
}[]

export interface IScriptInfo {
  address: string
  script: string
  scriptText: string
  complexity: number
  extraFee: number
}

export interface StateChanges {
  senderPublicKey: string
  fee: number
  type: number
  version: number
  stateChanges: {
    data: KeyValuePair[]
    transfers: Transfer[]
  }
  call: Call
  dApp: string
  sender: string
  feeAssetId: string | null
  proofs: string[]
  payment: Payment[]
  id: string
  timestamp: number
  height: number
}

export interface Call {
  function: string
  args: Arg[]
}

export interface Arg {
  type: string
  value: number
}

export interface Payment {
  amount: number
  assetId: string | null
}

export interface PagingOptions {
  initialCursor?: string
  pageLimit?: number
}

export interface KeyValuePair {
  type: string
  value: string
  key: string
}

export interface Transfer {
  address: string
  asset: string | null
  amount: number
}

export interface IScriptDecompileResult {
  STDLIB_VERSION: number
  SCRIPT_TYPE: string
  CONTENT_TYPE: string
  script: string
}

export interface GetMarketsResponse {
  matcherPublicKey: string
  markets: Market[]
}

export interface Market {
  amountAssetName: string
  amountAsset: string
  priceAsset: string
  created: number
  amountAssetInfo: { decimals: number } | null
  restrictions: Restrictions
  priceAssetInfo: { decimals: number } | null
  matchingRules: MatchingRules
  priceAssetName: string
}

export interface MatchingRules {
  tickSize: string
}

export interface Restrictions {
  stepAmount: string
  minAmount: string
  maxAmount: string
  stepPrice: string
  minPrice: string
  maxPrice: string
}

export interface DepositInfo {
  address: string
  minAmount: number
  maxAmount: number
}


