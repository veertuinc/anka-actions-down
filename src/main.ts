import * as core from '@actions/core'
import {
  logDebug,
  logInfo,
  timeout,
  HardTimeoutError,
  Runner,
  VM
} from 'anka-actions-common'

type ActionParams = {
  ghOwner: string
  ghRepo: string
  ghPAT: string

  actionId: string

  baseUrl: string

  rootToken?: string

  httpsAgentCa?: string
  httpsAgentCert?: string
  httpsAgentPassphrase?: string
  httpsAgentSkipCertVerify?: boolean
  httpsAgentKey?: string

  pollDelay: number
  hardTimeout: number

  vcpu?: number
  vram?: number
  group_id?: string
}
;(async function main(): Promise<void> {
  try {
    const params = await parseParams()
    if (params.hardTimeout > 0) {
      await Promise.race([
        timeout(params.hardTimeout * 1000, 'hard-timeout exceeded'),
        doAction(params)
      ])
    } else {
      await doAction(params)
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

async function doAction(params: ActionParams): Promise<void> {
  const runner = new Runner(params.ghPAT, params.ghOwner, params.ghRepo)
  const runnerId = await runner.getRunnerByActionId(params.actionId)
  if (runnerId !== null) {
    logInfo(
      `[Action Runner] deleting runner with \u001b[40;1m id \u001b[33m${runnerId} \u001b[0m / \u001b[40;1m name \u001b[33m${params.actionId}`
    )
    await runner.delete(runnerId)
  } else {
    logInfo(`[Action Runner] not found, skipping...`)
  }

  const vm = new VM(
    params.baseUrl,
    params.rootToken,
    params.httpsAgentCa,
    params.httpsAgentCert,
    params.httpsAgentKey,
    params.httpsAgentPassphrase,
    params.httpsAgentSkipCertVerify
  )

  const instanceId = await vm.getInstanceId(params.actionId)
  if (instanceId !== null) {
    logInfo(
      `[VM] terminating instance with \u001b[40;1m id \u001b[33m${instanceId} \u001b[0m / \u001b[40;1m External ID \u001b[33m${params.actionId}`
    )
    await vm.terminate(instanceId)
  } else {
    logInfo(`[VM] not found, skipping...`)
  }
}

async function parseParams(): Promise<ActionParams> {
  const pollDelay: number = parseInt(
    core.getInput('poll-delay', {required: true}),
    10
  )
  if (pollDelay <= 0) throw new Error('poll-delay must be positive integer')

  const hardTimeout: number = parseInt(
    core.getInput('hard-timeout', {required: true}),
    10
  )
  if (hardTimeout < 0)
    throw new Error('hard-timeout must be greater then or equal to 0')

  const ghOwner = core.getInput('gh-owner', {required: true})

  const params: ActionParams = {
    ghOwner,
    ghRepo: core
      .getInput('gh-repository', {required: true})
      .replace(`${ghOwner}/`, ''),
    ghPAT: core.getInput('gh-pat', {required: true}),

    actionId: core.getInput('action-id', {required: true}),
    baseUrl: core.getInput('base-url', {required: true}),

    rootToken: core.getInput('root-token'),

    pollDelay,
    hardTimeout
  }

  const httpsAgentCa = core.getInput('https-agent-ca')
  if (httpsAgentCa) {
    params.httpsAgentCa = httpsAgentCa
  }

  const httpsAgentCert = core.getInput('https-agent-cert')
  if (httpsAgentCert) {
    params.httpsAgentCert = httpsAgentCert
  }

  const httpsAgentKey = core.getInput('https-agent-key')
  if (httpsAgentKey) {
    params.httpsAgentKey = httpsAgentKey
  }

  const httpsAgentPassphrase = core.getInput('https-agent-cert-passphrase')
  if (httpsAgentPassphrase) {
    params.httpsAgentPassphrase = httpsAgentPassphrase
  }

  const httpsAgentSkipCertVerify = core.getBooleanInput(
    'https-agent-skip-cert-verify'
  )
  if (httpsAgentSkipCertVerify) {
    params.httpsAgentSkipCertVerify = httpsAgentSkipCertVerify
  }

  logDebug(`Parsed params: ${JSON.stringify(params)}`)
  return params
}
