# Task 19 admin AI contract

All routes require an authenticated admin. The client must not supply envelope identity fields; the backend uses the authenticated user and creates a fresh UUID session for every request.

All three events use the shared `DEFAULT_AI_MODEL` constant (configured by the environment variable of the same name), defaulting to `gemini-3.5-flash-lite`.

| REST endpoint | Client input | Kafka event and data |
| --- | --- | --- |
| `POST /api/v1/admin/documents/sample` | `title`, `source` (MinIO bucket/key), `refId`, optional `language` | `admin_documents`, `documents: [{ title, source, ref_id }]`, document ID `admin-doc` |
| `POST /api/v1/admin/documents/user-guide` | `documents_urls` (nonempty array of MinIO bucket/key paths), `data_id`, optional metadata | `user_guide_documents`, document ID `admin-user-guide` |
| `GET /api/v1/admin/documents/journals` | Optional integer `last_updated` between 1999 and the current year | `get_journals`, defaults `last_updated` to the current year. Legacy `field`, `ranking`, `query` parameters are not forwarded. |

These three events use the shared `EVENT_TIMEOUT_CONFIG` in `timeout-manager.service.ts`: 300,000 ms each. The admin service does not override this timeout. AI errors retain their supplied 6xx code, including timeout 604.

The AI response must echo `user_id`, `document_id`, `session_id`, `event_type` and `model_id` on success and error. Correlation currently uses the first four fields. No `job_id` is required for this request/response flow. A non-`admin` document ID permits AI process-status webhooks; receiving and persisting job status is a separate concern from matching this HTTP response.

For separate development backends sharing Kafka, set a distinct `KAFKA_GROUP_ID` in each machine's local `.env`. Instances sharing one group divide response partitions and can consume another instance's reply while its pending request exists only in memory on the originating instance.

Build outside the running watch process. Use an isolated checkout/output when a container shares the workspace's `dist` directory; a separate container alone still shares bind-mounted build output.
