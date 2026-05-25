const CODE_TO_STATUS = {
  "invalid-argument": 400,
  unauthenticated: 401,
  "permission-denied": 403,
  "not-found": 404,
  "already-exists": 409,
  "failed-precondition": 412,
  "resource-exhausted": 429,
  internal: 500,
  unavailable: 503,
  "deadline-exceeded": 504,
};

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code || "internal";
    this.status = status || CODE_TO_STATUS[this.code] || 500;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: "not-found", message: `No route ${req.method} ${req.path}` },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const code = err.code || "internal";
  const status = err.status || CODE_TO_STATUS[code] || 500;
  const message = err.message || "Internal server error";

  if (status >= 500) {
    console.error(`[${req.method} ${req.path}]`, err);
  }

  res.status(status).json({
    error: { code, message },
  });
}
