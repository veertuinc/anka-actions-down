import * as core from '@actions/core'
import {parseParams, doAction} from './action'
import {Runner, timeout, HardTimeoutError, VM} from 'anka-actions-common'
import {Octokit} from '@octokit/rest'
;(async function main(): Promise<void> {
  try {
    const params = await parseParams()
    const runner = new Runner(
      new Octokit({auth: params.ghPAT, baseUrl: params.ghBaseUrl}),
      params.ghOwner,
      params.ghRepo
    )
    const vm = new VM(
      params.baseUrl,
      params.rootToken,
      params.httpsAgentCa,
      params.httpsAgentCert,
      params.httpsAgentKey,
      params.httpsAgentPassphrase,
      params.httpsAgentSkipCertVerify
    )

    if (params.hardTimeout > 0) {
      await Promise.race([
        timeout(params.hardTimeout * 1000, 'job-ttl exceeded'),
        doAction(runner, vm, params)
      ])
    } else {
      await doAction(runner, vm, params)
    }
  } catch (error) {
    let message
    if (error instanceof Error) message = error.message
    else message = String(error)

    core.setFailed(message)

    if (error instanceof HardTimeoutError) {
      process.exit(1)
    }
  }
})()
