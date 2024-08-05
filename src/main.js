const core = require('@actions/core')
const superagent = require('superagent')
const github = require('@actions/github')

/**
 * Send a POST request to PagerDuty Events V2 API.
 * @param {string} routingKey The integration key for the PagerDuty service.
 * @param {Object} payload The payload to send to PagerDuty.
 * @returns {Promise<void>} Resolves when the request is complete.
 */
async function sendPagerDutyEvent (routingKey, payload) {
  const pagerDutyEventsApiUrl = 'https://events.pagerduty.com/v2/enqueue'

  try {
    const response = await superagent
      .post(pagerDutyEventsApiUrl)
      .send(payload)
      .set('Content-Type', 'application/json')
      .set('x-routing-key', routingKey)

    core.info('PagerDuty event sent successfully')
    core.info(JSON.stringify(response, null, 2))
    core.info(JSON.stringify(response.body, null, 2))
  } catch (error) {
    core.error(`Failed to send PagerDuty event: ${error.message}`)
    throw error // Rethrow to handle it in the calling function
  }
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run () {
  try {
    // Get the inputs from the workflow file
    const routingKey = core.getInput('integration-key', { required: true })
    const dedupKey = core.getInput('dedup-key')
    const eventAction = core.getInput('event-action')
    const summary = core.getInput('summary')
    const source = core.getInput('source')
    const severity = core.getInput('severity')
    const client = core.getInput('client')
    const clientUrl = core.getInput('client-url')

    // Access GitHub context
    const repository = github.context.repo.repo
    const repoOwner = github.context.repo.owner
    const sha = github.context.sha
    const ref = github.context.ref
    const event = github.context.eventName
    const actor = github.context.actor

    // Payload for PagerDuty Events API
    const payload = {
      event_action: eventAction,
      dedup_key: dedupKey,
      payload: {
        summary,
        source,
        severity,
        custom_details: {
          github: {
            repository,
            repo_owner: repoOwner,
            sha,
            ref,
            event,
            actor
          }
        }
      },
      client,
      client_url: clientUrl
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
