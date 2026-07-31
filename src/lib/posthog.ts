import type { PostHog } from 'posthog-js'

const key = import.meta.env.VITE_POSTHOG_KEY
const host = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'
let client: Promise<PostHog | null> | null = null
let warned = false

export function getPostHog() {
  if (!key) {
    if (import.meta.env.DEV && !warned) {
      warned = true
      console.error('VITE_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_KEY is configured')
    }
    return Promise.resolve(null)
  }

  if (!client) {
    client = import('posthog-js').then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: host,
        capture_pageview: 'history_change',
        defaults: '2025-05-24',
      })
      return posthog
    })
  }

  return client
}

export function initPostHog() {
  void getPostHog()
}

export async function identifyPostHogUser(
  id: string,
  properties: { email?: string; name?: string; role?: string },
) {
  const posthog = await getPostHog()
  posthog?.identify(id, properties)
}

export async function resetPostHog() {
  const posthog = await getPostHog()
  posthog?.reset()
}

export async function capturePostHog(event: string, properties?: Record<string, string | number | boolean>) {
  const posthog = await getPostHog()
  posthog?.capture(event, properties)
}
