# URL health check action

A post-deploy health check with build-it redirect & retry. An quick & easy way to verify a deployment.

```yaml
steps:
  - name: Check the deployed service URL
    uses: vcnc-hex/url-health-check-action@v1
    with:
      # Check the following URLs one by one sequentially
      url: https://example.com|http://example.com
      # Max time to keep requesting url
      max-time: 1m
      # Max time until a request times out
      request-timeout: 10s
      # Fail this action after this many failed attempts
      # set to "until-max-time" to request forever
      max-attempts: 1 # Optional, defaults to 1
      # Delay between retries
      retry-delay: 1s
```
