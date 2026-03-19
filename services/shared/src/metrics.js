// In-process metrics collection for platform monitoring
class MetricsCollector {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.startTime = Date.now();
  }

  increment(name, value = 1, labels = {}) {
    const key = this._key(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  gauge(name, value, labels = {}) {
    const key = this._key(name, labels);
    this.gauges.set(key, value);
  }

  observe(name, value, labels = {}) {
    const key = this._key(name, labels);
    const bucket = this.histograms.get(key) || { count: 0, sum: 0, min: Infinity, max: -Infinity };
    bucket.count++;
    bucket.sum += value;
    bucket.min = Math.min(bucket.min, value);
    bucket.max = Math.max(bucket.max, value);
    this.histograms.set(key, bucket);
  }

  requestTimer() {
    return (req, res, next) => {
      const start = process.hrtime.bigint();

      res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        this.observe('http_request_duration_ms', durationMs, {
          method: req.method,
          path: req.route?.path || req.path,
          status: res.statusCode,
        });
        this.increment('http_requests_total', 1, {
          method: req.method,
          status: res.statusCode,
        });
      });

      next();
    };
  }

  snapshot() {
    const mem = process.memoryUsage();
    this.gauge('process_memory_rss_bytes', mem.rss);
    this.gauge('process_memory_heap_used_bytes', mem.heapUsed);
    this.gauge('process_memory_heap_total_bytes', mem.heapTotal);
    this.gauge('process_uptime_seconds', Math.floor((Date.now() - this.startTime) / 1000));

    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(this.histograms),
      collectedAt: new Date().toISOString(),
    };
  }

  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  _key(name, labels) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }
}

const metrics = new MetricsCollector();

module.exports = metrics;
