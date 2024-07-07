const core = require('@actions/core')
const superagent = require('superagent') // Import superagent
const github = require('@actions/github') // Import @actions/github

/**
 * Send a POST request to PagerDuty Events V2 API.
 * @param {string} routingKey The integration key for the PagerDuty service.
 * @param {Object} payload The payload to send to PagerDuty.
 * @returns {Promise<void>} Resolves when the request is complete.
 */
async function sendPagerDutyEvent(routingKey, payload) {
  const pagerDutyEventsApiUrl = 'https://events.pagerduty.com/v2/enqueue'

  try {
    const response = await superagent
      .post(pagerDutyEventsApiUrl)
      .send(payload)
      .set('Content-Type', 'application/json')
      .set('x-routing-key', routingKey)

    core.info(`PagerDuty event sent successfully: ${response.body}`)
  } catch (error) {
    core.error(`Failed to send PagerDuty event: ${error.message}`)
    throw error // Rethrow to handle it in the calling function
  }
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    // Get the inputs from the workflow file
    const routingKey = core.getInput('pagerDutyRoutingKey', { required: true })
    const eventAction = core.getInput('eventAction')
    const summary = core.getInput('summary')
    const source = core.getInput('source')
    const severity = core.getInput('severity')

    // Access GitHub context
    const repoName = github.context.repo.repo
    const ownerName = github.context.repo.owner
    const sha = github.context.sha
    const eventName = github.context.eventName
    const actor = github.context.actor

    // Payload for PagerDuty Events API
    const payload = {
      event_action: eventAction,
      payload: {
        summary: summary,
        source: source,
        severity: severity,
        custom_details: {
          github: {
            repo: repoName,
            owner: ownerName,
            repo_nwo: `${ownerName}/${repoName}`,
            sha: sha,
            event: eventName,
            actor: actor
          }
        }
      }
    }

    // Send a PagerDuty event
    await sendPagerDutyEvent(routingKey, payload)

    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
