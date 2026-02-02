import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateIdeaUseCase } from '@/application/usecases/idea/CreateIdeaUseCase';
import { UpdateIdeaUseCase } from '@/application/usecases/idea/UpdateIdeaUseCase';
import { DeleteIdeaUseCase } from '@/application/usecases/idea/DeleteIdeaUseCase';
import { IdeaRepository } from '@/domain/repositories/IdeaRepository';
import { Idea } from '@/domain/entities/Idea';

vi.mock('@/lib/observability', () => ({
    emitMetric: vi.fn(),
}));

import { emitMetric } from '@/lib/observability';
import { IdeaStatus } from '@/domain/value-objects/IdeaStatus';

// Mock repository
const createMockRepository = (): IdeaRepository => ({
    findById: vi.fn(),
    findByUser: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByStatus: vi.fn(),
});

const mockIdea: Idea = {
    id: 'idea-123',
    userId: 'user-456',
    channelId: null,
    title: 'Test Idea',
    description: null,
    status: 'draft',
    priority: 5,
    tags: [],
    aiScore: null,
    source: 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('CreateIdeaUseCase', () => {
    let repository: IdeaRepository;
    let useCase: CreateIdeaUseCase;
    const emitMetricMock = vi.mocked(emitMetric);

    beforeEach(() => {
        repository = createMockRepository();
        useCase = new CreateIdeaUseCase(repository);
        emitMetricMock.mockClear();
    });

    it('should create idea with valid input', async () => {
        vi.mocked(repository.create).mockResolvedValue(mockIdea);

        const result = await useCase.execute({
            userId: 'user-456',
            title: 'Test Idea',
            priority: 5,
        });

        expect(repository.create).toHaveBeenCalledWith({
            userId: 'user-456',
            title: 'Test Idea',
            description: undefined,
            channelId: undefined,
            priority: 5,
            tags: [],
        });
        expect(result.id).toBe('idea-123');
        expect(emitMetricMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'idea.created' }));
    });

    it('should reject empty title', async () => {
        await expect(useCase.execute({
            userId: 'user-456',
            title: '   ',
        })).rejects.toThrow('Title cannot be empty');
    });

    it('should reject invalid priority', async () => {
        await expect(useCase.execute({
            userId: 'user-456',
            title: 'Test',
            priority: 15,
        })).rejects.toThrow('Priority must be between 0 and 10');
    });
});

describe('UpdateIdeaUseCase', () => {
    let repository: IdeaRepository;
    let useCase: UpdateIdeaUseCase;

    beforeEach(() => {
        repository = createMockRepository();
        useCase = new UpdateIdeaUseCase(repository);
    });

    it('should update idea with valid status', async () => {
        vi.mocked(repository.update).mockResolvedValue({ ...mockIdea, status: 'approved' });

        const result = await useCase.execute({
            ideaId: 'idea-123',
            userId: 'user-456',
            updates: { status: 'approved' },
        });

        expect(result.status).toBe('approved');
    });

    it('should reject invalid status', async () => {
        await expect(useCase.execute({
            ideaId: 'idea-123',
            userId: 'user-456',
            updates: { status: 'invalid' as unknown as IdeaStatus },
        })).rejects.toThrow('Invalid status');
    });

    it('should throw when idea not found', async () => {
        vi.mocked(repository.update).mockResolvedValue(null);

        await expect(useCase.execute({
            ideaId: 'idea-123',
            userId: 'user-456',
            updates: { title: 'New Title' },
        })).rejects.toThrow('Idea not found or access denied');
    });
});

describe('DeleteIdeaUseCase', () => {
    let repository: IdeaRepository;
    let useCase: DeleteIdeaUseCase;

    beforeEach(() => {
        repository = createMockRepository();
        useCase = new DeleteIdeaUseCase(repository);
    });

    it('should delete existing idea', async () => {
        vi.mocked(repository.delete).mockResolvedValue(true);

        await expect(useCase.execute({
            ideaId: 'idea-123',
            userId: 'user-456',
        })).resolves.toBeUndefined();

        expect(repository.delete).toHaveBeenCalledWith('idea-123', 'user-456');
    });

    it('should throw when idea not found', async () => {
        vi.mocked(repository.delete).mockResolvedValue(false);

        await expect(useCase.execute({
            ideaId: 'idea-123',
            userId: 'user-456',
        })).rejects.toThrow('Idea not found or access denied');
    });
});
