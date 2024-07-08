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
declare class HTTPLog implements IHTTPLogger {
    #private;
    constructor({ url, bufferSize, throttle, fetch, getMetadata, }: HTTPLoggerOptions);
    log(event: string, ...tags: string[]): Promise<void>;
}
declare global {
    var HTTPLogger: typeof HTTPLog;
}
export {};
//# sourceMappingURL=index.d.ts.map