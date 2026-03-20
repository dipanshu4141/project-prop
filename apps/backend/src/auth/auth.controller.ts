import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtRefreshGuard, JwtAuthGuard } from './guards/auth.guards';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './jwt-payload.interface';

const IS_PROD = process.env.NODE_ENV === 'production';

const BASE_COOKIE = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: 'lax' as const,
  path:     '/',
};

const ACCESS_COOKIE  = { ...BASE_COOKIE, maxAge: 15 * 60 * 1000 };
const REFRESH_COOKIE = { ...BASE_COOKIE, maxAge: 30 * 24 * 60 * 60 * 1000 };

function setCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token',  accessToken,  ACCESS_COOKIE);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE);
}

function clearCookies(res: Response) {
  res.clearCookie('access_token',  { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/register
   * Creates User + Workspace + WorkspaceMember(OWNER).
   * Sets httpOnly cookies — client receives user/workspace info only.
   */
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req()  req: Request,
    @Res()  res: Response,
  ) {
    const result = await this.authService.register(dto, req);
    setCookies(res, result.accessToken, result.refreshToken);
    return res.json({ user: result.user, workspace: result.workspace });
  }

  /**
   * POST /auth/login
   * Sets httpOnly cookies — client receives user/workspace info only.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req()  req: Request,
    @Res()  res: Response,
  ) {
    const result = await this.authService.login(dto, req);
    setCookies(res, result.accessToken, result.refreshToken);
    return res.json({ user: result.user, workspace: result.workspace });
  }

  /**
   * POST /auth/refresh
   * Rotates both cookies silently — called automatically by the
   * frontend API client on 401, invisible to the user.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @Req() req: Request & { user: { userId: string; sessionId: string } },
    @Res() res: Response,
  ) {
    const result = await this.authService.refresh(req.user.userId, req.user.sessionId, req);
    setCookies(res, result.accessToken, result.refreshToken);
    return res.json({ user: result.user, workspace: result.workspace });
  }

  /**
   * POST /auth/logout
   * Revokes the session in DB and clears both cookies.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtRefreshGuard)
  async logout(
    @Req() req: Request & { user: { sessionId: string } },
    @Res() res: Response,
  ) {
    await this.authService.logout(req.user.sessionId);
    clearCookies(res);
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  /**
   * GET /auth/me
   * Returns current user from JWT — used by AuthContext on page load
   * to restore session without a password prompt.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return user;
  }
}