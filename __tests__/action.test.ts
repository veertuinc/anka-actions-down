import {expect, jest, test} from '@jest/globals'
import {getBooleanInput, getInput} from '@actions/core'
import {parseParams} from '../src/action'

jest.mock('@actions/core')

const mockedGetInput = <jest.Mock<typeof getInput>>getInput
const mockedGetBooleanInput = <jest.Mock<typeof getBooleanInput>>getBooleanInput

beforeEach(() => {
  jest.clearAllMocks()
})

test('parse all parameters', async () => {
  mockedGetBooleanInput.mockImplementation((name: string, attr) => {
    switch (name) {
      default:
        return false
      case 'https-agent-skip-cert-verify':
        return true
    }
  })

  mockedGetInput.mockImplementation((name, attr) => {
    switch (name) {
      default:
        return name
      case 'poll-delay':
        return '1'
      case 'hard-timeout':
        return '2'
      case 'vcpu':
        return '3'
      case 'vram':
        return '4'
    }
  })
  const params = await parseParams()
  expect(params).toEqual({
    actionId: 'action-id',
    ghOwner: 'gh-owner',
    ghRepo: 'gh-repository',
    ghPAT: 'gh-pat',
    baseUrl: 'base-url',
    rootToken: 'root-token',
    pollDelay: 1,
    hardTimeout: 2,
    httpsAgentCa: 'https-agent-ca',
    httpsAgentCert: 'https-agent-cert',
    httpsAgentKey: 'https-agent-key',
    httpsAgentPassphrase: 'https-agent-cert-passphrase',
    httpsAgentSkipCertVerify: true
  })
})

test('parse pollDelay throws', async () => {
  mockedGetInput.mockImplementation((name, attr) => {
    switch (name) {
      default:
        return name
      case 'hard-timeout':
        return '2'
    }
  })
  expect(parseParams()).rejects.toThrowError(
    'poll-delay must be positive integer'
  )
})

test('parse hardTimeout throws', async () => {
  mockedGetInput.mockImplementation((name, attr) => {
    switch (name) {
      default:
        return name
      case 'poll-delay':
        return '1'
    }
  })
  expect(parseParams()).rejects.toThrowError(
    'hard-timeout must be greater then or equal to 0'
  )
})
