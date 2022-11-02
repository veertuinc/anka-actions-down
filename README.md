# anka-actions-down
# Use cases
## Connecting to a controller
There are only 3 required parameters:
 - `gh-pat` stand for Github personal access token (requires `repo` scope in order to be able to create/remove self-hosted runners in the repository).
 - `base-url` is a base URL to Anka controller
 - `action-id` action id received as a result of `anka-actions-up`

The rest are optional!

### Using unencrypted HTTP connection
```yaml
    steps:
      - uses: veertuinc/anka-actions-up@v1
        with:
          gh-pat: ${{ secrets.REPO_SCOPE_PAT }}
          base-url: 'http://192.168.1.1'
```

### Using HTTPS connection
#### Authenticating with trusted certificate
```yaml
    steps:
      - uses: veertuinc/anka-actions-up@v1
        with:
          # ...
          https-agent-cert: ${{ secrets.YOUR_CERTIFICATE }}
          https-agent-cert-passphrase: ${{ secrets.YOUR_CERTIFICATE_PASSPHRASE }}
          https-agent-key: ${{ secrets.YOUR_KEY }}
```

#### Authenticating with self-signed certificates
This will also require specifying root certificate with `https-agent-ca:`
```yaml
    steps:
      - uses: veertuinc/anka-actions-up
        with:
          # ...
          https-agent-ca: ${{ secrets.YOUR_CERTIFICATE }}
```

#### Using self-signed certificates without authentication
If you do not use HTTPS authentication you could simply add `https-agent-skip-cert-verify: true` instead:
```yaml
    steps:
      - uses: veertuinc/anka-actions-up
        with:
          # ...
          https-agent-skip-cert-verify: true
```

## Authenticating with a root token
```yaml
    steps:
      - uses: veertuinc/anka-actions-up
        with:
          # ...
          root-token: ${{ secrets.ROOT_TOKEN }}
```

# Setting timeouts
## Hard timeout
Maximum time within which job has to finish successfully,
otherwise it will be stopped and marked as failed. You can disable this behaviour by setting it to `0`
```yaml
    steps:
      - uses: veertuinc/anka-actions-up
        with:
          # ... defaults to 5 minutes
          hard-timeout: 300
```

## Poll delay
This is a sleep interval between requests to your Anka controller REST API
```yaml
    steps:
      - uses: veertuinc/anka-actions-up
        with:
          # ... defaults to 5 seconds
          poll-delay: 5
```