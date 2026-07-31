# PostHog post-wizard report

PostHog is initialized lazily for the Vite SPA, captures History API pageviews and autocapture events, identifies authenticated Supabase users, resets identity on sign-out, and records the main application and member activity events without sending user-generated content.

| Event | Description | File |
| --- | --- | --- |
| `access_request_submitted` | A visitor successfully submitted an application for Astralis access. | `src/pages/RequestAccess.tsx`, `src/contexts/AuthContext.tsx` |
| `chat_message_sent` | An approved member successfully sent a message in Commons. | `src/pages/Chat.tsx` |
| `access_request_approved` | An administrator approved an applicant for member access. | `src/pages/Admin.tsx` |

## Next steps

The [Analytics basics dashboard](https://us.posthog.com/project/447940/dashboard/1933289) contains:

- [Access request funnel](https://us.posthog.com/project/447940/insights/XHsXovQR)
- [Access requests by signup method](https://us.posthog.com/project/447940/insights/plSnDkWr)
- [Approved access requests](https://us.posthog.com/project/447940/insights/bs60Sgxf)
- [Commons messages sent](https://us.posthog.com/project/447940/insights/J9kQPopE)

## Verify before merging

- [ ] Run a full production build and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite; instrumented call sites may need updated mocks or fixtures.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or a Vite upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path calls `identify` after a saved Supabase session is restored.

### Agent skill

The PostHog React and Vite integration guidance is available in `.agents/skills/integration-react-vite`.
