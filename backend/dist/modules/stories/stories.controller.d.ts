import { StoriesService } from './stories.service';
import { CreateStoryDto, UpdateStoryDto, QueryStoryDto } from './dto';
export declare class StoriesController {
    private readonly storiesService;
    constructor(storiesService: StoriesService);
    create(userId: string, createStoryDto: CreateStoryDto): Promise<any>;
    findAll(queryDto: QueryStoryDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getSeries(): Promise<any>;
    findOne(identifier: string): Promise<any>;
    update(id: string, updateStoryDto: UpdateStoryDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
