# Synthetic categorization evaluation

Run `npm run evaluate:ai` to validate the report setup without a network call. For live evaluation, set `TYPESAFE_API_KEY` in the environment and run `npm run evaluate:ai -- --live --output .nexus/tmp/ai-evaluation.json`. The runner uses the same request builder and action threshold as the production client. It sends only the hand-authored synthetic fixture, never the local financial database.

The 64 cases cover English/Dutch category labels, positive refunds, missing context, payment processors, ambiguous orders, transfers, and misleading instruction-like descriptions. Labels are authored judgments rather than bank ground truth. Review disputed labels and expand the fixture with anonymized, consented cases before using results for a production threshold.

Reports distinguish action precision, coverage, false actions on ambiguous inputs, service errors, and request p50/p95 latency. They include a threshold sweep, returned model version, and token usage. Abstentions do not count as correct category assignments, errors do not count as correct abstentions, and no accepted predictions produces null precision. A dry run has no accuracy metrics.

The existing 0.6 threshold is a policy to evaluate, not a calibrated guarantee. Confidence and correctness differ; inspect false positive cases before changing automatic behavior. See the [TypeSafe confidence documentation](https://docs.typesafe.ai/confidence) and [HTTP API](https://docs.typesafe.ai/api).
