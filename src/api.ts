export type ActionParams = {
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

export const API_STATUS_OK = 'OK'
export const INSTANCE_STATE_STARTED = 'Started'

export type StartVMRequest = {
  vmid: string
  tag?: string
  version?: number
  name?: string
  external_id?: string
  count?: number
  node_id?: string
  startup_script?: string
  startup_script_condition?: number
  script_monitoring?: boolean
  script_timeout?: number
  script_fail_handler?: number
  name_template?: string
  group_id?: string
  priority?: number
  usb_device?: string
  vcpu?: number
  vram?: number
  metadata?: object
  mac_address?: string
  vlan_tag?: string
  video_controller?: string
  csr_active_config?: string
  hvapic?: string
}

export interface StartVMResponse {
  status: string
  message: string
  body: string[]
}

interface VMInstance {
  instance_id: string
  instance_state: string
  anka_registry: string
  vmid: string
  tag: string
  vminfo: {
    uuid: string
    name: string
    cpu_cores: number
    ram: string
    status: string
    node_id: string
    host_ip: string
    ip: string
    tag: string
    vnc_port: number
    creation_date: string
    stop_date: string
    version: string
  }
  node_id: string
  inflight_reqid: string
  ts: string
  cr_time: string
  progress: number
  external_id: string
  arch: string
  vlan: string
  startup_script: {
    return_code: number
    did_timeout: boolean
    stdout: string
    stderr: string
  }
}

export interface TerminateVMResponse {
  status: string
  message: string
}

export interface ListVMResponse {
  status: string
  message: string
  body: VMInstance[]
}

export interface ListVMResponseSingle {
  status: string
  message: string
  body: VMInstance
}
