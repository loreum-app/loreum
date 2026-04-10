import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { CookieService } from '../services/cookie.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { AuthUser, OAuthUserData } from '../types/jwt.types';
import { AppConfig } from '../../config/app.config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
    private config: AppConfig,
  ) {}

  // ---------------------------------------------------------------------------
  // Google OAuth
  // ---------------------------------------------------------------------------

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  googleLogin() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const oauthData = req.user as OAuthUserData;
    const result = await this.authService.handleOAuthLogin(
      oauthData,
      req.ip,
      req.headers['user-agent'],
    );

    this.cookieService.setCookie(res, result.token);
    this.cookieService.setCsrfCookie(res, result.user.sessionId);

    // Redirect to frontend after successful auth
    res.redirect(this.config.api.corsOrigin);
  }

  // ---------------------------------------------------------------------------
  // Session Management
  // ---------------------------------------------------------------------------

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('auth_token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@User() user: AuthUser) {
    return this.authService.getUserProfile(user.id);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('auth_token')
  @ApiOperation({ summary: 'List active sessions' })
  async getSessions(@User() user: AuthUser) {
    return this.authService.getUserSessions(user.id);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('auth_token')
  @ApiOperation({ summary: 'Invalidate a specific session' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async invalidateSession(
    @User() user: AuthUser,
    @Param('sessionId') sessionId: string,
  ) {
    await this.authService.invalidateSession(sessionId, user.id);
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('auth_token')
  @ApiOperation({ summary: 'Invalidate all sessions except current' })
  async invalidateAllSessions(@User() user: AuthUser) {
    const count = await this.authService.invalidateAllUserSessions(
      user.id,
      user.sessionId,
    );
    return { invalidated: count };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('auth_token')
  @ApiOperation({ summary: 'Logout current session' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @User() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.invalidateSession(user.sessionId);
    this.cookieService.clearCookie(res);
  }
}
