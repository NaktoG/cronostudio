// domain/repositories/ChannelRepository.ts
// Interface for Channel persistence

import { Channel, CreateChannelInput, UpdateChannelInput } from '../entities/Channel';

export interface ChannelRepository {
    /**
     * Find a channel by its unique ID
     */
    findById(id: string): Promise<Channel | null>;

    /**
     * Find all channels for a specific user
     */
    findByUser(userId: string): Promise<Channel[]>;

    /**
     * Find all channels (public listing)
     */
    findAll(): Promise<Channel[]>;

    /**
     * Create a new channel
     */
    create(input: CreateChannelInput): Promise<Channel>;

    /**
     * Update an existing channel
     */
    update(id: string, userId: string, input: UpdateChannelInput): Promise<Channel | null>;

    /**
     * Delete a channel
     */
    delete(id: string, userId: string): Promise<boolean>;

    /**
     * Check if a YouTube channel ID already exists
     */
    youtubeChannelExists(youtubeChannelId: string): Promise<boolean>;
}
