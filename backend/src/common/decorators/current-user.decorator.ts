import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Check if user exists in request (should be populated by JWT guard)
    if (!user) {
      throw new UnauthorizedException(
        'User not authenticated. Please ensure you are using proper authentication guards.',
      );
    }

    // If specific property is requested, validate it exists
    if (data) {
      if (!(data in user)) {
        throw new BadRequestException(
          `User property '${data}' does not exist. Available properties: ${Object.keys(user).join(', ')}`,
        );
      }
      return user[data];
    }

    return user;
  },
);
