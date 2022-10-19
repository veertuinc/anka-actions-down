import * as axios from 'axios'
import * as core from '@actions/core'
import * as https from 'https'
import {Octokit} from '@octokit/core'
import * as api from './api'
import * as util from './util'
;(async function main(): Promise<void> {
  try {
    const params = await parseParams()
    if (params.hardTimeout > 0) {
      await Promise.race([
        util.timeout(params.hardTimeout * 1000, 'hard-timeout exceeded'),
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

    if (error instanceof util.HardTimeoutError) {
      process.exit(1)
    }
  }
})()

async function doAction(params: api.ActionParams): Promise<void> {
  const instance = await createAxiosInstance(params)
  const octokit = new Octokit({auth: params.ghPAT})
  const runnerId = await getRunnerId(octokit, params.ghRepo, params.actionId)
  if (runnerId !== null) {
    util.info(`[Action Runner] deleting runner with id \u001b[33m${runnerId}`)
    await deleteRunner(octokit, params.ghRepo, runnerId)
  } else {
    util.info(`[Action Runner] not found, skipping...`)
  }

  const instanceId = await getVMInstanceId(instance, params.actionId)
  if (instanceId !== null) {
    util.info(`[VM] terminating instance with id \u001b[33m${instanceId}`)
    await terminateVMInstance(instance, instanceId)
  } else {
    util.info(`[VM] not found, skipping...`)
  }
}

async function createAxiosInstance(
  params: api.ActionParams
): Promise<axios.AxiosInstance> {
  const config: axios.CreateAxiosDefaults = {
    baseURL: params.baseUrl
  }

  if (params.rootToken) {
    config.auth = {
      username: '',
      password: params.rootToken
    }
  }

  if (
    params.httpsAgentCa ||
    params.httpsAgentCert ||
    params.httpsAgentKey ||
    params.httpsAgentPassphrase ||
    params.httpsAgentSkipCertVerify
  ) {
    const agentOpts: https.AgentOptions = {}

    if (params.httpsAgentCa) {
      agentOpts.ca = params.httpsAgentCa
    }

    if (params.httpsAgentCert) {
      agentOpts.cert = params.httpsAgentCert
    }

    if (params.httpsAgentKey) {
      agentOpts.key = params.httpsAgentKey
    }

    if (params.httpsAgentPassphrase) {
      agentOpts.passphrase = params.httpsAgentPassphrase
    }

    if (params.httpsAgentSkipCertVerify) {
      agentOpts.rejectUnauthorized = false
    }

    config.httpsAgent = new https.Agent(agentOpts)
  }

  return axios.default.create(config)
}

async function parseParams(): Promise<api.ActionParams> {
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

  const params: api.ActionParams = {
    ghRepo: core.getInput('gh-repo', {required: true}),
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

  util.debug(`Parsed params: ${JSON.stringify(params)}`)
  return params
}

async function deleteRunner(
  octokit: Octokit,
  ghRepo: string,
  runnerId: number
): Promise<void> {
  const tokenResp = await octokit.request(
    `DELETE /repos/${ghRepo}/actions/runners/runners/{runner_id}`,
    {
      runner_id: runnerId
    }
  )
  util.debug(`GitHub action runner token: ${tokenResp.data.token}`)

  return tokenResp.data.token
}

async function getVMInstanceId(
  ax: axios.AxiosInstance,
  actionId: string
): Promise<string | null> {
  try {
    const response = await ax.get<api.ListVMResponse>(`/api/v1/vm`)
    util.debug(
      `ListVMResponse status: ${response.status}; body: ${JSON.stringify(
        response.data
      )}`
    )

    if (response.data.status !== api.API_STATUS_OK) {
      throw new Error(`API response status:${response.data.status}`)
    }

    const instances = response.data.body.filter(
      instance => instance.external_id === actionId
    )

    if (instances.length) {
      return instances[0].instance_id
    }

    return null
  } catch (error) {
    throw createError(error)
  }
}

async function terminateVMInstance(
  ax: axios.AxiosInstance,
  instanceId: string
): Promise<void> {
  try {
    const response = await ax.delete<api.TerminateVMResponse>(`/api/v1/vm`, {
      data: {
        id: instanceId
      }
    })
    util.debug(
      `TerminateVMResponse status: ${response.status}; body: ${JSON.stringify(
        response.data
      )}`
    )

    if (response.data.status !== api.API_STATUS_OK) {
      throw new Error(`API response status:${response.data.status}`)
    }
  } catch (error) {
    throw createError(error)
  }
}

function createError(error: any): Error {
  if (error instanceof axios.AxiosError && error.response) {
    if (error.response.status === 400) {
      throw new Error(
        `Controller responded with an error: ${JSON.stringify(
          error.response.data
        )}`
      )
    } else {
      throw new Error(
        `HTTP request failed: status: ${
          error.response.status
        }, data: ${JSON.stringify(error.response.data)}`
      )
    }
  } else if (error instanceof axios.AxiosError && error.request) {
    throw new Error(`Controller request failed: ${error.cause}`)
  }

  throw error
}

async function getRunnerId(
  octokit: Octokit,
  ghRepo: string,
  actionId: string
): Promise<number | null> {
  const runnerListResp = await octokit.request(
    `GET /repos/${ghRepo}/actions/runners`
  )

  interface ListRunnersResponse {
    runners: {
      id: number
      name: string
    }[]
  }

  const data = runnerListResp.data as ListRunnersResponse
  const found = data.runners.filter(runner => runner.name === actionId)

  if (found.length) {
    return found[0].id
  }

  return null
}
