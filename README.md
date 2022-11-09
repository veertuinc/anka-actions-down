# Anka Actions - Down

This action is mean to be used with [anka-actions-up](https://github.com/veertuinc/anka-actions-up). Please be sure to start there.

## Prerequisites

1. [anka-actions-up](https://github.com/veertuinc/anka-actions-up) has started a VM and returned the `action-id` output.

## Inputs

| input name                          | required? | description                                                                                                                     |
|-------------------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------|
| `gh-pat`                            | **yes** | Github personal access token (requires `repo` scope in order to be able to create/remove self-hosted runners in the repository) |
| `controller-url`                    | **yes** | The Anka Build Cloud Controller's URL to communicate with                                                                       |
| `action-id`                         | **yes** | The action id received in the output of `anka-actions-up`                                                                       |
| `gh-owner`                          | no | GitHub repository owner                                                                                                         |
| `gh-repository`                     | no | GitHub repository the github action runner will be attached to                                                                  |
| `gh-base-url`                       | no | GitHub Enterprise Server base url with /api/v3 on the end. At the moment only v3 is supported.                                                                           |
| `controller-root-token`             | no | Anka Build Cloud Controller's Root Token used for authentication                                                                |
| `controller-tls-ca`                 | no | Anka Build Cloud Controller TLS certificate's CA (needed if controller TLS cert is self-signed)                                 |
| `controller-https-skip-cert-verify` | no | Skip the Anka Build Cloud Controller's TLS certificate verification                                                             |
| `controller-auth-cert`              | no | Certificate to use for authorization with the Anka Build Cloud Controller                                                       |
| `controller-auth-cert-key`          | no | Private key to use for authorization with the Anka Build Cloud Controller                                                       |
| `controller-auth-cert-passphrase`   | no | The Auth Certificate's passphrase                                                                                               |
| `controller-http-poll-delay`        | no | Delay (in seconds) between the HTTP requests to the Anka Build Cloud Controller's API                                           |
| `job-ttl`                           | no | TTL (in seconds) after which job will be forced to stop (fails with error) (disable with `0`)                                   |

## Usage Examples

```yaml
jobs:
 
  action-up:
    runs-on: ubuntu-latest
    steps:
      - uses: veertuinc/anka-actions-up@v1
        id: action-up
        with:
          gh-pat: ${{ secrets.SERVICE_USER_PAT }}
          template-id: '9690461a-02b5-412d-8778-dab4167743db'
          controller-url: 'https://controller.mysite.com'
    outputs:
      action-id: ${{ steps.action-up.outputs.action-id }}

  inside_vm_job:
    needs: action-up
    runs-on: [ self-hosted, "${{ needs.action-up.outputs.action-id }}" ]
    steps:
      - name: Inside VM Job
        id: inside_vm_job
        run: |
          echo "running on runner inside of VM (${{ needs.action-up.outputs.action-id }})"
          echo "user: $USER"
          echo "home: $HOME"
          
  action_down:
    if: always()
    needs: [ action-up, inside_vm_job ]
    runs-on: ubuntu-latest
    steps:
      - uses: veertuinc/anka-actions-down@v1
        with:
          action-id: ${{ needs.action-up.outputs.action-id }}
          gh-pat: ${{ secrets.SERVICE_USER_PAT }}
          controller-url: 'https://controller.mysite.com'
```

### Authenticating using [Certificate Authentication](https://docs.veertu.com/anka/anka-build-cloud/advanced-security-features/certificate-authentication/)

```yaml
    steps:
      - uses: veertuinc/anka-actions-down@v1
        with:
          controller-url: 'https://controller.mysite.com'
          controller-auth-cert-passphrase: 'secret'
          controller-auth-cert: ${{ secrets.CONTROLLER_CERT }}
          controller-auth-cert-key: ${{ secrets.CONTROLLER_KEY }}
          controller-https-skip-cert-verify: true # only needed if using self-signed cert for HTTPS/TLS
```

### Authenticating using [RTA (Root Token Auth)](https://docs.veertu.com/anka/anka-build-cloud/advanced-security-features/token-authentication/#protecting-your-cloud-with-rta-root-token-auth)

We do not recommend this as it exposes your root token. The root token has access to absolutely everything permissions-wise.

```yaml
    steps:
      - uses: veertuinc/anka-actions-down@v1
        with:
          controller-url: 'https://controller.mysite.com'
          controller-root-token: ${{ secrets.ROOT_TOKEN }}
```

### Job TTL

The maximum seconds a job can run. If this TTL is reached it will stop and be marked as failed. It can be disabled with `0`. If not set, it will default to 5 minutes (300 seconds).

```yaml
    steps:
      - uses: veertuinc/anka-actions-down@v1
        with:
          controller-url: 'https://controller.mysite.com'
          job-ttl: 300
```

### Controller HTTP Poll Delay

This is a interval between requests to your Anka Build Cloud Controller's REST API. It can be disabled with `0`. If not set, it will default to 5 minutes (300 seconds).

```yaml
    steps:
      - uses: veertuinc/anka-actions-down@v1
        with:
          . . .
          controller-http-poll-delay: 5
```

### Using with Github Enterprise Server

When using with GitHub Enterprise Server, set `gh-base-url` to the root URL of the API.
For example, if your GitHub Enterprise Server's hostname is `github.acme-inc.com`,
then set `gh-base-url` to `https://github.acme-inc.com/api/v3`

```yaml
    steps:
      - uses: veertuinc/anka-actions-down@v1
        with:
          . . .
          gh-base-url: 'https://github.acme-inc.com/api/v3'
```