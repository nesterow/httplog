
export type Event = Record<string, string | string[]>;

export interface IHTTPLogger {
  log(event: string, ...tags: string[]): void;
}

export type HTTPLoggerOptions = {
    url: string;
    bufferSize?: number;
    throttle?: number;
    fetch?: typeof fetch;
    getMetadata?: () => Event;
};

class HTTPLog implements IHTTPLogger {
  #url: string;
  #buffer: Event[] = [];
  #bufferSize: number = 3;
  #throttle: number;
  #timeout: string | number | undefined = void 0;
  #getMetadata: () => Event;

  #fetch: (
    input: RequestInfo | URL,
    init?: RequestInit | undefined,
  ) => Promise<Response>;

  constructor({
    url = "",
    bufferSize = 3,
    throttle = 1000,
    fetch = globalThis.fetch,
    getMetadata = () => ({
        title: globalThis.document?.title || "",
        url: globalThis.location?.href || "",
    }),
  }: HTTPLoggerOptions) {
    if (url === "") {
      throw new Error("URL is required");
    }
    this.#url = url;
    this.#bufferSize = bufferSize;
    this.#throttle = throttle;
    this.#fetch = (...args) => fetch(...args);
    this.#getMetadata = getMetadata;
    if (typeof window === "undefined") {
        return;
    }
    addEventListener("unload", () => {
      globalThis?.navigator?.sendBeacon?.(
        this.#url,
        JSON.stringify(this.#buffer),
      );
    });
  }

  async #post() {
    const data = this.#buffer.slice();
    if (data.length === 0) {
      return;
    }
    this.#buffer = [];
    const body = JSON.stringify(data);
    try {
      const res = await this.#fetch(this.#url, {
        method: "POST",
        body: body,
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
        credentials: "include",
      });
      if (res.status >= 400 && res.status !== 422) {
        this.#buffer.push(...data);
      }
      return res;
    } catch (e) {
      console.log("Error", e);
      this.#buffer.push(...data);
    }
  }

  async #timer() {
    this.#timeout = setTimeout(() => {
      this.#post();
      this.#timer();
    }, this.#throttle) as any;
  }

  async log(event: string, ...tags: string[]) {
    this.#buffer.push({
      event,
      tags,
      ...this.#getMetadata(),
    });

    if (this.#buffer.length >= this.#bufferSize) {
      this.#post();
    }

    if (this.#timeout === void 0) {
      this.#post();
      this.#timer();
    }
  }
}

declare global {
  var HTTPLogger: IHTTPLogger;
}

// @ts-ignore
globalThis.HTTPLogger = HTTPLog;