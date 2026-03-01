// Request validation middleware factory
function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value === undefined || value === null) continue;

      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
      }

      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} must be at most ${rules.maxLength} characters`);
      }

      if (rules.min && typeof value === 'number' && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }

      if (rules.max && typeof value === 'number' && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}`);
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(`${field} has invalid format`);
      }

      if (rules.oneOf && !rules.oneOf.includes(value)) {
        errors.push(`${field} must be one of: ${rules.oneOf.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
}

function validateParams(paramNames) {
  return (req, res, next) => {
    const errors = [];
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const param of paramNames) {
      const value = req.params[param];
      if (!value) {
        errors.push(`${param} is required`);
      } else if (!uuidPattern.test(value)) {
        errors.push(`${param} must be a valid UUID`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Invalid parameters', details: errors });
    }

    next();
  };
}

module.exports = { validateBody, validateParams };
