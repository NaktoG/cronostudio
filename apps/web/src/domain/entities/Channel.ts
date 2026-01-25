// domain/entities/Channel.ts
// Channel entity - YouTube channel representation

export interface Channel {
    readonly id: string;
    readonly userId: string;
    readonly name: string;
    readonly youtubeChannelId: string;
    readonly subscribers: number;
    readonly refreshToken?: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export interface CreateChannelInput {
    userId: string;
    name: string;
    youtubeChannelId: string;
    refreshToken?: string | null;
}

export interface UpdateChannelInput {
    name?: string;
    subscribers?: number;
    refreshToken?: string | null;
}
