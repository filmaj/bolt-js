import chalk from 'chalk';
import objectEntries = require('object.entries'); // tslint:disable-line:no-require-imports

/**
 * Severity levels for log entries
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Interface for objects where objects in this package's logs can be sent (can be used as `logger` option).
 */
export interface Logger {
  /**
   * Output debug message
   *
   * @param msg any data to log
   */
  debug(...msg: any[]): void;

  /**
   * Output info message
   *
   * @param msg any data to log
   */
  info(...msg: any[]): void;

  /**
   * Output warn message
   *
   * @param msg any data to log
   */
  warn(...msg: any[]): void;

  /**
   * Output error message
   *
   * @param msg any data to log
   */
  error(...msg: any[]): void;

  /**
   * This disables all logging below the given level, so that after a log.setLevel("warn") call log.warn("something")
   * or log.error("something") will output messages, but log.info("something") will not.
   *
   * @param level as a string, like 'error' (case-insensitive)
   */
  setLevel(level: LogLevel): void;

  /**
   * This allows the instance to be named so that they can easily be filtered when many loggers are sending output
   * to the same destination.
   *
   * @param name as a string, will be output with every log after the level
   */
  setName(name: string): void;
}

/**
 * Default logger which logs to stdout and stderr
 */
export class ConsoleLogger implements Logger {
  /** Setting for level */
  private level: LogLevel;
  /** Name */
  private name: string;
  /** Map of labels for each log level */
  private static labels: Map<LogLevel, string> = (() => {
    const entries = objectEntries(LogLevel) as ([string, LogLevel])[];
    const map = entries.map(([key, value]) => {
      return [value, `[${key}] `] as [LogLevel, string];
    });
    return new Map(map);
  })();
  /** Map of severity as comparable numbers for each log level */
  private static severity: { [key in LogLevel]: number } = {
    [LogLevel.ERROR]: 400,
    [LogLevel.WARN]: 300,
    [LogLevel.INFO]: 200,
    [LogLevel.DEBUG]: 100,
  };

  /** Reference to a function that can be used as console.debug() */
  private debugFn: (message?: any, ...optionalParams: any[]) => void;

  constructor() {
    this.level = LogLevel.INFO;
    // TODO: do we need a name?
    this.name = '';
    chalk.enabled = true;

    // In node < 8.0.0, console.debug does not exist
    // TODO: remove this
    if (console.debug !== undefined) {
      this.debugFn = console.debug;
    } else {
      this.debugFn = console.log;
    }
  }

  /**
   * Sets the instance's log level so that only messages which are equal or more severe are output to the console.
   */
  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Set the instance's name, which will appear on each log line before the message.
   */
  public setName(name: string): void {
    this.name = name;
  }

  /**
   * Sets whether color is enabled for logging
   */
  public setColor(color: boolean): void {
    chalk.enabled = color;
  }

  /**
   * Log a debug message
   */
  public debug(...msg: any[]): void {
    if (ConsoleLogger.isMoreOrEqualSevere(LogLevel.DEBUG, this.level)) {
      this.debugFn(chalk.cyan((ConsoleLogger.labels.get(LogLevel.DEBUG) as string), this.name, ...msg));
    }
  }
  /**
   * Log an info message
   */
  public info(...msg: any[]): void {
    if (ConsoleLogger.isMoreOrEqualSevere(LogLevel.INFO, this.level)) {
      console.info(ConsoleLogger.labels.get(LogLevel.INFO), this.name, ...msg);
    }
  }
  /**
   * Log a warning message
   */
  public warn(...msg: any[]): void {
    if (ConsoleLogger.isMoreOrEqualSevere(LogLevel.WARN, this.level)) {
      console.warn(chalk.yellow(ConsoleLogger.labels.get(LogLevel.WARN) as string), this.name, ...msg);
    }
  }
  /**
   * Log an error message
   */
  public error(...msg: any[]): void {
    if (ConsoleLogger.isMoreOrEqualSevere(LogLevel.ERROR, this.level)) {
      console.error(chalk.red(ConsoleLogger.labels.get(LogLevel.ERROR) as string), this.name, ...msg);
    }
  }

  /**
   * Helper to compare two log levels and determine if a is equal or more severe than b
   */
  private static isMoreOrEqualSevere(a: LogLevel, b: LogLevel): boolean {
    return ConsoleLogger.severity[a] >= ConsoleLogger.severity[b];
  }
}