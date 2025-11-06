import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ContentVersionsService } from './content-versions.service';
import {
  CreateContentVersionDto,
  QueryContentVersionDto,
  VersionableType,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../types/prisma.types';

@ApiTags('Content Versions')
@Controller('content-versions')
export class ContentVersionsController {
  constructor(
    private readonly contentVersionsService: ContentVersionsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new content version' })
  @ApiResponse({
    status: 201,
    description: 'Version created successfully',
  })
  @ApiResponse({ status: 400, description: 'Version already exists' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async create(
    @CurrentUser() user: any,
    @Body() createVersionDto: CreateContentVersionDto,
  ) {
    return this.contentVersionsService.create(user.userId, createVersionDto);
  }

  @Get(':contentType/:contentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all versions for a piece of content' })
  @ApiParam({
    name: 'contentType',
    enum: VersionableType,
    description: 'Type of content',
  })
  @ApiParam({ name: 'contentId', description: 'ID of the content' })
  @ApiResponse({
    status: 200,
    description: 'Versions retrieved successfully',
  })
  async findAllForContent(
    @Param('contentType') contentType: VersionableType,
    @Param('contentId') contentId: string,
    @Query() queryDto: QueryContentVersionDto,
  ) {
    return this.contentVersionsService.findAllForContent(
      contentType,
      contentId,
      queryDto,
    );
  }

  @Get(':contentType/:contentId/latest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the latest version for a piece of content' })
  @ApiParam({
    name: 'contentType',
    enum: VersionableType,
    description: 'Type of content',
  })
  @ApiParam({ name: 'contentId', description: 'ID of the content' })
  @ApiResponse({
    status: 200,
    description: 'Latest version retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'No versions found' })
  async findLatestVersion(
    @Param('contentType') contentType: VersionableType,
    @Param('contentId') contentId: string,
  ) {
    return this.contentVersionsService.findLatestVersion(contentType, contentId);
  }

  @Get(':contentType/:contentId/:versionNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific version by number' })
  @ApiParam({
    name: 'contentType',
    enum: VersionableType,
    description: 'Type of content',
  })
  @ApiParam({ name: 'contentId', description: 'ID of the content' })
  @ApiParam({ name: 'versionNumber', description: 'Version number' })
  @ApiResponse({
    status: 200,
    description: 'Version retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async findByVersionNumber(
    @Param('contentType') contentType: VersionableType,
    @Param('contentId') contentId: string,
    @Param('versionNumber') versionNumber: string,
  ) {
    return this.contentVersionsService.findByVersionNumber(
      contentType,
      contentId,
      parseInt(versionNumber, 10),
    );
  }

  @Get(':contentType/:contentId/compare/:versionA/:versionB')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Compare two versions' })
  @ApiParam({
    name: 'contentType',
    enum: VersionableType,
    description: 'Type of content',
  })
  @ApiParam({ name: 'contentId', description: 'ID of the content' })
  @ApiParam({ name: 'versionA', description: 'First version number' })
  @ApiParam({ name: 'versionB', description: 'Second version number' })
  @ApiResponse({
    status: 200,
    description: 'Versions compared successfully',
  })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async compareVersions(
    @Param('contentType') contentType: VersionableType,
    @Param('contentId') contentId: string,
    @Param('versionA') versionA: string,
    @Param('versionB') versionB: string,
  ) {
    return this.contentVersionsService.compareVersions(
      contentType,
      contentId,
      parseInt(versionA, 10),
      parseInt(versionB, 10),
    );
  }

  @Get(':contentType/:contentId/restore/:versionNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get data to restore content to a specific version' })
  @ApiParam({
    name: 'contentType',
    enum: VersionableType,
    description: 'Type of content',
  })
  @ApiParam({ name: 'contentId', description: 'ID of the content' })
  @ApiParam({ name: 'versionNumber', description: 'Version number to restore' })
  @ApiResponse({
    status: 200,
    description: 'Restore data retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async getRestoreData(
    @Param('contentType') contentType: VersionableType,
    @Param('contentId') contentId: string,
    @Param('versionNumber') versionNumber: string,
  ) {
    return this.contentVersionsService.getRestoreData(
      contentType,
      contentId,
      parseInt(versionNumber, 10),
    );
  }

  @Delete(':contentType/:contentId/prune')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Prune old versions (keep only latest N)' })
  @ApiParam({
    name: 'contentType',
    enum: VersionableType,
    description: 'Type of content',
  })
  @ApiParam({ name: 'contentId', description: 'ID of the content' })
  @ApiQuery({
    name: 'keepCount',
    required: false,
    description: 'Number of versions to keep (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Old versions pruned successfully',
  })
  async pruneOldVersions(
    @Param('contentType') contentType: VersionableType,
    @Param('contentId') contentId: string,
    @Query('keepCount') keepCount?: string,
  ) {
    return this.contentVersionsService.pruneOldVersions(
      contentType,
      contentId,
      keepCount ? parseInt(keepCount, 10) : 10,
    );
  }
}
