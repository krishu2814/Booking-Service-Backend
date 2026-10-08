import Redis from "ioredis";

class RedisWrapper {
    private _client?: Redis;

    get client(): Redis {
        if (!this._client) {
            throw new Error("Cannot access Redis client before connecting");
        }
        return this._client;
    }

    get isConnected(): boolean {
        return !!this._client && this._client.status === "ready";
    }

    connect(host: string, port = 6379) {
        this._client = new Redis({
            host,
            port,
            lazyConnect: false,
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => Math.min(times * 100, 3000)
        });

        this._client.on("connect", () => {
            console.log("Connected to Redis in orders service");
        });

        this._client.on("error", (err) => {
            console.error("Redis connection error in orders service:", err);
        });
    }

    close() {
        if (this._client) {
            this._client.disconnect();
            this._client = undefined;
        }
    }
}

export const redisWrapper = new RedisWrapper();

export class RedisLock {
    /**
     * Fast-path in-memory reservation lock: SET ticket:<id>:lock <userId> NX EX 900
     * Atomically locks ticket in memory to scale flash-sale concurrency.
     */
    static async acquire(ticketId: string, userId: string, ttlSeconds = 900): Promise<boolean> {
        try {
            if (!redisWrapper.isConnected) {
                return true;
            }
            const key = `ticket:${ticketId}:lock`;
            const result = await redisWrapper.client.set(key, userId, "EX", ttlSeconds, "NX");
            return result === "OK";
        } catch (error) {
            console.error("RedisLock acquire error:", error);
            return true;
        }
    }

    /**
     * Release the fast-path in-memory reservation lock: DEL ticket:<id>:lock
     * If userId is provided, atomically deletes only if the lock is held by that userId.
     */
    static async release(ticketId: string, userId?: string): Promise<void> {
        try {
            if (!redisWrapper.isConnected) {
                return;
            }
            const key = `ticket:${ticketId}:lock`;
            if (userId) {
                const luaScript = `
                    if redis.call("get", KEYS[1]) == ARGV[1] then
                        return redis.call("del", KEYS[1])
                    else
                        return 0
                    end
                `;
                await redisWrapper.client.eval(luaScript, 1, key, userId);
            } else {
                await redisWrapper.client.del(key);
            }
        } catch (error) {
            console.error("RedisLock release error:", error);
        }
    }
}
