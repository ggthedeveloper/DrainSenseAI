# DrainSense India — Scientific Limitations & Ethical Guardrails

1. **Decision-Support vs Statutory Warning:**
   DrainSense is a decision-support prototype. It does not replace official statutory alerts issued by the India Meteorological Department (IMD) or Central Water Commission (CWC).
2. **Statistical Proxy vs 2D Hydrodynamic Modeling:**
   The ML model predicts susceptibility using terrain and antecedent rainfall proxies. It does not solve the 2D Saint-Venant shallow water equations and therefore does not simulate dynamic hydraulic wave propagation or breach mechanics in real-time.
3. **Drainage Network Granularity:**
   While major canals (Eluru, Ryves, Bandar) and rivers (Krishna, Budameru) are explicitly mapped, localized underground pipe blockages and municipal siltation levels are modeled via proxy drainage density rather than direct sensor telemetry.
4. **Data Freshness Dependency:**
   In real-world deployment, prediction accuracy is bound to telemetry latency from upstream rain gauges. If data is stale, the system surfaces a prominent alert indicating reduced reliability.
