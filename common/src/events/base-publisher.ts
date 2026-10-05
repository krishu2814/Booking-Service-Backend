import { JetStreamClient, JetStreamManager, NatsConnection, StreamInfo } from "nats";

export abstract class Publisher {
    abstract name: string;
    abstract subject: string[];
    private nc: NatsConnection;
    private js: JetStreamClient;
    private jsm!: JetStreamManager;

    constructor(nc: NatsConnection) {
        this.nc = nc;
        this.js = nc.jetstream();
    }

    async init(): Promise<void> {
        this.jsm = await this.nc.jetstreamManager();
    }

    async createStream(): Promise<StreamInfo | undefined> {
        await this.init();
        try {
            return await this.jsm.streams.info(this.name);
        } catch (e: any) {
            const isNotFound = e.code === "404" || e.code === 404 || e.api_error?.code === 404 || e.message?.toLowerCase().includes("not found");
            if (isNotFound) {
                return await this.jsm.streams.add({
                    name: this.name,
                    subjects: this.subject
                });
            }
            throw e;
        }
    }

    async publish(publishId: string, data: any): Promise<void> {
        try {
            await this.createStream();
            await this.js.publish(publishId, Buffer.from(JSON.stringify(data)));
        } catch (error) {
            console.error('Publishing error:', error);
            throw error;
        }
    }
}
