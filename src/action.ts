import * as core from '@actions/core'
import {logDebug, logInfo, Runner, VM} from 'anka-actions-common'

type ActionParams = {
  ghOwner: string
  ghRepo: string
  ghBaseUrl: string
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

export async function doAction(
  runner: Runner,
  vm: VM,
  params: ActionParams
): Promise<void> {
  const runnerId = await runner.getRunnerByName(params.actionId)
  if (runnerId !== null) {
    logInfo(
      `[Action Runner] deleting runner with \u001b[40;1m id \u001b[33m${runnerId} \u001b[0m / \u001b[40;1m name \u001b[33m${params.actionId}`
    )
    await runner.delete(runnerId)
  } else {
    logInfo(`[Action Runner] not found, skipping...`)
  }

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

export async function parseParams(): Promise<ActionParams> {
  const pollDelay: number = parseInt(
    core.getInput('controller-http-poll-delay', {required: true}),
    10
  )
  if (isNaN(pollDelay) || pollDelay <= 0)
    throw new Error('controller-http-poll-delay must be positive integer')

  const hardTimeout: number = parseInt(
    core.getInput('job-ttl', {required: true}),
    10
  )
  if (isNaN(hardTimeout) || hardTimeout < 0)
    throw new Error('job-ttl must be greater then or equal to 0')

  const ghOwner = core.getInput('gh-owner', {required: true})

  const params: ActionParams = {
    ghBaseUrl: core.getInput('gh-base-url'),
    ghOwner,
    ghRepo: core
      .getInput('gh-repository', {required: true})
      .replace(`${ghOwner}/`, ''),
    ghPAT: core.getInput('gh-pat', {required: true}),

    actionId: core.getInput('action-id', {required: true}),
    baseUrl: core.getInput('controller-url', {required: true}),

    rootToken: core.getInput('controller-root-token'),

    pollDelay,
    hardTimeout
  }

  if (!params.ghBaseUrl.match('github.com') && !params.ghBaseUrl.match('/api/'))
    throw new Error('gh-base-urls must include /api/v3')

  const httpsAgentCa = core.getInput('controller-tls-ca')
  if (httpsAgentCa) {
    params.httpsAgentCa = httpsAgentCa
  }

  const httpsAgentCert = core.getInput('controller-auth-cert')
  if (httpsAgentCert) {
    params.httpsAgentCert = httpsAgentCert
  }

  const httpsAgentKey = core.getInput('controller-auth-cert-key')
  if (httpsAgentKey) {
    params.httpsAgentKey = httpsAgentKey
  }

  const httpsAgentPassphrase = core.getInput('controller-auth-cert-passphrase')
  if (httpsAgentPassphrase) {
    params.httpsAgentPassphrase = httpsAgentPassphrase
  }

  const httpsAgentSkipCertVerify = core.getBooleanInput(
    'controller-https-skip-cert-verify'
  )
  if (httpsAgentSkipCertVerify) {
    params.httpsAgentSkipCertVerify = httpsAgentSkipCertVerify
  }

  logDebug(`Parsed params: ${JSON.stringify(params)}`)
  return params
}
