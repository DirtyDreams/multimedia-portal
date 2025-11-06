import { WikiPagesService } from './wiki-pages.service';
import { CreateWikiPageDto, UpdateWikiPageDto, QueryWikiPageDto } from './dto';
export declare class WikiPagesController {
    private readonly wikiPagesService;
    constructor(wikiPagesService: WikiPagesService);
    create(userId: string, createWikiPageDto: CreateWikiPageDto): Promise<any>;
    findAll(queryDto: QueryWikiPageDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getTree(): Promise<any[]>;
    getChildren(identifier: string): Promise<any>;
    getBreadcrumbs(identifier: string): Promise<{
        id: string;
        title: string;
        slug: string;
    }[]>;
    findOne(identifier: string): Promise<any>;
    update(id: string, updateWikiPageDto: UpdateWikiPageDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
