export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  event: string;
  sessionId?: string;
  data?: Record<string, unknown>;
}

function emit(
  level: LogEntry["level"],
  event: string,
  extra?: { sessionId?: string; data?: Record<string, unknown> }
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...extra,
  };

  const json = JSON.stringify(entry);

  if (level === "error") {
    console.error(json);
  } else if (level === "warn") {
    console.warn(json);
  } else {
    console.log(json);
  }
}

export const logger = {
  info(
    event: string,
    extra?: { sessionId?: string; data?: Record<string, unknown> }
  ): void {
    emit("info", event, extra);
  },

  warn(
    event: string,
    extra?: { sessionId?: string; data?: Record<string, unknown> }
  ): void {
    emit("warn", event, extra);
  },

  error(
    event: string,
    extra?: { sessionId?: string; data?: Record<string, unknown> }
  ): void {
    emit("error", event, extra);
  },
};
