class HTTPLog {
    #url;
    #buffer = [];
    #bufferSize = 3;
    #throttle;
    #timeout = void 0;
    #getMetadata;
    #fetch;
    constructor({ url = "", bufferSize = 3, throttle = 1000, fetch = globalThis.fetch, getMetadata = () => ({
        title: globalThis.document?.title || "",
        url: globalThis.location?.href || "",
    }), }) {
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
            globalThis?.navigator?.sendBeacon?.(this.#url, JSON.stringify(this.#buffer));
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
        }
        catch (e) {
            console.log("Error", e);
            this.#buffer.push(...data);
        }
    }
    async #timer() {
        this.#timeout = setTimeout(() => {
            this.#post();
            this.#timer();
        }, this.#throttle);
    }
    async log(event, ...tags) {
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
// @ts-ignore
globalThis.HTTPLogger = HTTPLog;
export {};
//# sourceMappingURL=index.js.map