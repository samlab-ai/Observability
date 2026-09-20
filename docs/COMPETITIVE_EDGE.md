# Eagle Eye competitive edge

## Position

Eagle Eye is not intended to be another metric, log, or alert dashboard. Its product category is **evidence-weighted service dependency intelligence**.

The central question is:

> Which external dependency is affecting which customer-facing path, what evidence supports that conclusion, and how certain is the conclusion?

## Differentiating capabilities

### 1. Evidence constellation

One service can be observed through official status data, direct API probes, synthetic journeys, DNS/TCP/TLS checks, webhooks, application signals, and public corroboration. Each observation keeps its source, timestamp, region, latency, and evidence link.

### 2. Uncertainty-preserving statuses

A missing status page is not automatically an outage. Eagle Eye separates `operational`, `degraded`, `monitoring`, and source-unavailable evidence so operators do not receive false certainty.

### 3. Path-aware blast radius

The dependency graph starts with product paths and propagates weighted evidence through the edges. The output is not only “OpenAI is degraded”; it is “the checkout assistant path is adding latency in these regions.”

### 4. Explainable incidents

Every incident can show the evidence stack that produced it, including conflicting sources. Operators can challenge the conclusion instead of trusting an opaque alert score.

### 5. Internet-plus-internal view

The same normalized signal contract can combine public SaaS status with internal databases, queues, APIs, and synthetic customer flows. This makes the boundary between external outage and internal regression visible.

## How to compete honestly

Do not claim Eagle Eye replaces every capability in Nexthink, ControlUp, Datadog, or other platforms. Those products have mature breadth, integrations, analytics, and enterprise workflows. Eagle Eye should win a narrower job first:

- cross-vendor dependency incident attribution;
- evidence-backed external outage correlation;
- fast setup for teams that do not want a full telemetry platform; and
- an operator-friendly explanation of customer impact.

## Benchmark plan

Run the same incident corpus through Eagle Eye and comparison tools. Record:

- time from first signal to correct root dependency;
- false-positive rate when a vendor status endpoint is unavailable;
- time to identify the affected customer path;
- number of source integrations required;
- percentage of incident conclusions with inspectable evidence;
- operator time to produce a stakeholder-ready explanation; and
- cost and operational effort at the same check frequency.

Only publish comparative claims after reproducible tests. The goal is to be measurably better at dependency attribution, not to make an untestable claim of being better at all observability.
