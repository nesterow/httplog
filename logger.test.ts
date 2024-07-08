import { expect, test, beforeAll, jest } from "bun:test";
import './index.ts';

beforeAll(() => {
    // Bun: not yet implemented
   // jest.useFakeTimers();
});

test("HTTPLogger", async () => {
    let ping = 0;
    let instance = new HTTPLogger({
        url: "http://localhost:3000",
        fetch: async (_, body) => {
            ping++;
            return new Response(null, {
                status: 200,
            });
        },
    });
    instance.log("test");
    expect(ping).toBe(1);
    instance.log("test2");
    expect(ping).toBe(1);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(ping).toBe(2);
});