const core = require("@actions/core");
const proc = require("child_process");
const duration = require("duration-js");
const axios = require("axios");

function asBoolean(str) {
  return str && ["yes", "true", "y", "1"].includes(str);
}

const processConfig = {
  stdio: "inherit",
  encoding: "utf8",
};

async function curl(url, { maxAttempts, maxTime, requestTimeout, retryDelay }) {
  let success, res;
  const startTime = Date.now();
  for (let i = 0; i < maxAttempts; i++) {
    core.info(`Checking ${url}`);
    res = await axios.get(url, { timeout: requestTimeout }).catch((e) => e);
    if (res.status >= 200 && res.status < 300) {
      core.info("Got success response");
      success = true;
      break;
    } else {
      core.info(`Received status: ${res.status}`);
    }

    if (Date.now() > startTime + maxTime) {
      break;
    }
    // Wait 100ms
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }
  if (!success) {
    throw new Error(
      "maxAttempts exceeded. Last error:\n" +
        JSON.stringify((res || {}).data || ((res || {}).response || {}).data)
    );
  }
}

async function main() {
  try {
    let urlString = core.getInput("url", { required: true });
    let maxAttemptsString = core.getInput("max-attempts");
    let maxTimeString = core.getInput("max-time") || "1m";
    let requestTimeoutString = core.getInput("request-timeout") || "10s";
    let retryDelayString = core.getInput("retry-delay") || "1s";

    core.info(
      `maxAttempts ${maxAttemptsString} maxTime ${maxTimeString} requestTimeout ${requestTimeoutString}`
    );

    let urls = urlString.split("|");
    let maxAttempts =
      maxAttemptsString === "forever" ||
      maxAttemptsString === "until-max-time" ||
      maxAttemptsString === "infinite"
        ? Infinity
        : parseInt(maxAttemptsString);
    let maxTime = duration.parse(maxTimeString).milliseconds();
    let requestTimeout = duration.parse(requestTimeoutString).milliseconds();
    let retryDelay = duration.parse(retryDelayString).milliseconds();

    for (const url of urls) {
      await curl(url, { maxAttempts, maxTime, requestTimeout, retryDelay });
    }

    core.info("Success");
  } catch (e) {
    console.error("Error running action", e);
    core.setFailed(e.message);
  }
}

main();
