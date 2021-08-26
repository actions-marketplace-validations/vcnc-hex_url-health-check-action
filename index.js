const core = require("@actions/core")
const proc = require("child_process")
const duration = require("duration-js")
const axios = require("axios")

function asBoolean(str) {
  return str && ["yes", "true", "y", "1"].includes(str)
}

const processConfig = {
  stdio: "inherit",
  encoding: "utf8",
}

async function curl(url, { maxAttempts, maxTime, requestTimeout }) {
  let success, res
  const startTime = Date.now()
  for (let i = 0; i < maxAttempts; i++) {
    core.info(`Checking ${url}`)
    res = await axios.get(url, { timeout: requestTimeout }).catch((e) => e)
    if (res.success) {
      core.info("Got success response")
      success = true
      break
    } else {
      core.info(
        `Received: ${JSON.stringify(
          res.data || res.response ? res.response.data : res.status
        )}`
      )
    }

    if (Date.now() > startTime + maxTime) {
      break
    }
    // Wait 100ms
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (!success) {
    throw new Error(JSON.stringify(res.data || res.response.data))
  }
}

try {
  let urlString = core.getInput("url", { required: true })
  let maxAttemptsString = core.getInput("max-attempts")
  let maxTimeString = core.getInput("max-time")
  let requestTimeoutString = core.getInput("request-timeout")

  let urls = urlString.split("|")
  let maxAttempts =
    maxAttemptsString === "forever" ||
    maxAttemptsString === "until-max-time" ||
    maxAttemptsString === "infinite"
      ? Infinity
      : parseInt(maxAttemptsString)
  let maxTime = duration.parse(maxTimeString).milliseconds()
  let requestTimeout = duration.parse(requestTimeoutString).milliseconds()

  urls.forEach((url) => {
    curl(url, { maxAttempts, maxTime, requestTimeout })
  })

  core.info("Success")
} catch (e) {
  console.error("Error running action", e)
  core.setFailed(e.message)
}
