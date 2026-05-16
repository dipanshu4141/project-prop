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
  Query,
  Redirect,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtRefreshGuard, JwtAuthGuard } from './guards/auth.guards';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './jwt-payload.interface';

import { AuthGuard } from '@nestjs/passport';

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
  const opts = {
    path:     '/',
    sameSite: 'lax' as const,
    secure:   IS_PROD,
  };
  res.clearCookie('access_token',  opts);
  res.clearCookie('refresh_token', opts);
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
  async logout(@Res() res: Response) {
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

  @Post('register-member')
  async registerMember(
    @Body() dto: { name: string; email: string; password: string; inviteToken: string },
    @Req()  req: Request,
    @Res()  res: Response,
  ) {
    const result = await this.authService.registerViaInvite(dto, req);
    setCookies(res, result.accessToken, result.refreshToken);
    return res.json({ user: result.user, workspace: result.workspace });
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  // Google OAuth — callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    const result = await this.authService.googleAuth(req.user, req);
    setCookies(res, result.accessToken, result.refreshToken);
    // Redirect to frontend
    const isNewUser = !result.workspace.name; // rough check
    const redirectUrl = !result.planSelected
        ? `${process.env.FRONTEND_URL}/onboarding?step=plan&type=INDIVIDUAL`
        : `${process.env.FRONTEND_URL}/v2/dashboard`;
      res.redirect(redirectUrl);

  }

  // Verify email
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    await this.authService.verifyEmail(token);
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=1`);
  }

  // Forgot password
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    await this.authService.forgotPassword(body.email);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // Reset password
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; password: string }) {
    await this.authService.resetPassword(body.token, body.password);
    return { message: 'Password reset successfully.' };
  }

  // Resend verification email
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async resendVerification(@CurrentUser() user: JwtPayload) {
    await this.authService.sendVerificationEmail(user.sub);
    return { message: 'Verification email sent.' };
  }

 

}