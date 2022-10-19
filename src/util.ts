import * as core from '@actions/core'

export class HardTimeoutError extends Error {}

export const sleep = async (waitTimeInMs: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, waitTimeInMs))

export const timeout = async (ms: number, message: string): Promise<void> =>
  new Promise((_, reject) => {
    const id = setTimeout(() => {
      reject(new HardTimeoutError(message))
    }, ms)
    // let timer to not block Nodejs process to exit naturally
    id.unref()
  })

const logDecorator =
  (
    logFn: (message: string) => void,
    decFn: (message: string) => string
  ): ((message: string) => void) =>
  (message: string) =>
    logFn(decFn(message))

const dateTimeDecorator = (m: string): string =>
  `[${new Date().toLocaleString()}] ${m}`

export const debug = logDecorator(core.debug, dateTimeDecorator)
export const info = logDecorator(core.info, dateTimeDecorator)
export const error = logDecorator(core.error, dateTimeDecorator)
