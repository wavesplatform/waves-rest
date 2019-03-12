import { remove, p, run, copy, create, copyJson, npmInstall, npmGetVersion, versionToString } from './utils'

async function build() {
  try {
    await remove(p('tmp'))
    await remove(p('../dist'))
    await create(p('tmp'))
    await create(p('tmp/src'))
    await copy(p('../src'), p('tmp/src'))
    await copy(p('../tsconfig.json'), p('tmp/tsconfig.json'))
    await run('tsc', p('tmp'))
    await copy(p('tmp/dist'), p('../dist'))
    await remove(p('tmp'))
    const ver = await npmGetVersion('@waves/waves-rest')
    ver.patch++
    await copyJson(p('../package.json'), p('../dist/package.json'), { main: 'index.js', types: 'index.d.ts', version: versionToString(ver) })
  } catch (error) {
    console.log(error)
  }
}

build()