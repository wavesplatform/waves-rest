
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