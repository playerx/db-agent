import tracer from "dd-trace"

tracer.init({
  service: process.env.DD_SERVICE || "db-agent",
  env: process.env.DD_ENV || "production",
  version: process.env.DD_VERSION || "1.0.0",
  logInjection: true,
  runtimeMetrics: true,
  profiling: true,
})

export default tracer
