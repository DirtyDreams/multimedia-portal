import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateContentVersionDto,
  QueryContentVersionDto,
  VersionableType,
} from './dto';

@Injectable()
export class ContentVersionsService {
  private readonly logger = new Logger(ContentVersionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new content version
   */
  async create(userId: string, createVersionDto: CreateContentVersionDto) {
    const {
      contentType,
      contentId,
      versionNumber,
      title,
      content,
      excerpt,
      metadata,
      changeNote,
    } = createVersionDto;

    // Verify content exists
    await this.verifyContentExists(contentType, contentId);

    // Check if version number already exists
    const existingVersion = await this.prisma.contentVersion.findFirst({
      where: {
        contentType,
        contentId,
        versionNumber,
      },
    });

    if (existingVersion) {
      throw new BadRequestException(
        `Version ${versionNumber} already exists for this content`,
      );
    }

    const version = await this.prisma.contentVersion.create({
      data: {
        contentType,
        contentId,
        versionNumber,
        title,
        content,
        excerpt,
        metadata,
        changeNote,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Created version ${versionNumber} for ${contentType} ${contentId}`,
    );

    return version;
  }

  /**
   * Auto-save a new version for content
   * Automatically increments version number
   */
  async autoSaveVersion(
    userId: string,
    contentType: VersionableType,
    contentId: string,
    title: string,
    content: string,
    excerpt?: string,
    metadata?: Record<string, any>,
    changeNote?: string,
  ) {
    // Get the latest version number
    const latestVersion = await this.prisma.contentVersion.findFirst({
      where: {
        contentType,
        contentId,
      },
      orderBy: {
        versionNumber: 'desc',
      },
      select: {
        versionNumber: true,
      },
    });

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    return this.create(userId, {
      contentType,
      contentId,
      versionNumber: nextVersionNumber,
      title,
      content,
      excerpt,
      metadata,
      changeNote: changeNote || 'Auto-saved version',
    });
  }

  /**
   * Get all versions for a piece of content
   */
  async findAllForContent(
    contentType: VersionableType,
    contentId: string,
    queryDto: QueryContentVersionDto,
  ) {
    const { page = 1, limit = 10, userId } = queryDto;
    const skip = (page - 1) * limit;

    const where = {
      contentType,
      contentId,
      ...(userId && { userId }),
    };

    const [versions, total] = await Promise.all([
      this.prisma.contentVersion.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          versionNumber: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.contentVersion.count({ where }),
    ]);

    return {
      data: versions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a specific version by ID
   */
  async findOne(id: string) {
    const version = await this.prisma.contentVersion.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }

    return version;
  }

  /**
   * Get a specific version by number
   */
  async findByVersionNumber(
    contentType: VersionableType,
    contentId: string,
    versionNumber: number,
  ) {
    const version = await this.prisma.contentVersion.findFirst({
      where: {
        contentType,
        contentId,
        versionNumber,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(
        `Version ${versionNumber} not found for ${contentType} ${contentId}`,
      );
    }

    return version;
  }

  /**
   * Get the latest version for a piece of content
   */
  async findLatestVersion(
    contentType: VersionableType,
    contentId: string,
  ) {
    const version = await this.prisma.contentVersion.findFirst({
      where: {
        contentType,
        contentId,
      },
      orderBy: {
        versionNumber: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(
        `No versions found for ${contentType} ${contentId}`,
      );
    }

    return version;
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    contentType: VersionableType,
    contentId: string,
    versionA: number,
    versionB: number,
  ) {
    const [vA, vB] = await Promise.all([
      this.findByVersionNumber(contentType, contentId, versionA),
      this.findByVersionNumber(contentType, contentId, versionB),
    ]);

    return {
      versionA: vA,
      versionB: vB,
      diff: {
        title: vA.title !== vB.title,
        content: vA.content !== vB.content,
        excerpt: vA.excerpt !== vB.excerpt,
      },
    };
  }

  /**
   * Delete old versions (keep only the latest N versions)
   */
  async pruneOldVersions(
    contentType: VersionableType,
    contentId: string,
    keepCount: number = 10,
  ) {
    const versions = await this.prisma.contentVersion.findMany({
      where: {
        contentType,
        contentId,
      },
      orderBy: {
        versionNumber: 'desc',
      },
      select: {
        id: true,
        versionNumber: true,
      },
      take: keepCount + 1,
    });

    if (versions.length <= keepCount) {
      return { deleted: 0 };
    }

    const versionsToDelete = versions.slice(keepCount);
    const deleteResult = await this.prisma.contentVersion.deleteMany({
      where: {
        id: {
          in: versionsToDelete.map((v) => v.id),
        },
      },
    });

    this.logger.log(
      `Pruned ${deleteResult.count} old versions for ${contentType} ${contentId}`,
    );

    return { deleted: deleteResult.count };
  }

  /**
   * Restore content to a specific version
   * This returns the version data but doesn't update the actual content
   */
  async getRestoreData(
    contentType: VersionableType,
    contentId: string,
    versionNumber: number,
  ) {
    const version = await this.findByVersionNumber(
      contentType,
      contentId,
      versionNumber,
    );

    return {
      title: version.title,
      content: version.content,
      excerpt: version.excerpt,
      metadata: version.metadata,
    };
  }

  /**
   * Verify content exists
   */
  private async verifyContentExists(
    contentType: VersionableType,
    contentId: string,
  ) {
    let exists = false;

    switch (contentType) {
      case VersionableType.ARTICLE:
        exists = !!(await this.prisma.article.findUnique({
          where: { id: contentId },
        }));
        break;
      case VersionableType.BLOG_POST:
        exists = !!(await this.prisma.blogPost.findUnique({
          where: { id: contentId },
        }));
        break;
      case VersionableType.WIKI_PAGE:
        exists = !!(await this.prisma.wikiPage.findUnique({
          where: { id: contentId },
        }));
        break;
      case VersionableType.GALLERY_ITEM:
        exists = !!(await this.prisma.galleryItem.findUnique({
          where: { id: contentId },
        }));
        break;
      case VersionableType.STORY:
        exists = !!(await this.prisma.story.findUnique({
          where: { id: contentId },
        }));
        break;
    }

    if (!exists) {
      throw new NotFoundException(
        `Content ${contentType} with ID ${contentId} not found`,
      );
    }
  }
}
