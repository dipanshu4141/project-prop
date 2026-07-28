import {
  Controller, Post, Get, Body, Req, Res,
  UseGuards, HttpCode, HttpStatus, UnauthorizedException,
  Patch,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/auth.guards';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './jwt-payload.interface';
import { AuthGuard } from '@nestjs/passport';
import { SkipBilling } from '../modules/billing/skip-billing.decorator';

const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: (IS_PROD ? 'none' : 'lax') as 'none' | 'lax',
  path:     '/',
};

function setCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token',  accessToken,  { ...COOKIE_OPTS, maxAge: 60 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

@SkipBilling()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto, req);
    setCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, req);
    setCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request & { cookies: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    const result = await this.authService.refresh(refreshToken, req);
    setCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.sub);
    res.clearCookie('access_token',  COOKIE_OPTS);
    res.clearCookie('refresh_token', COOKIE_OPTS);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.getFullUser(user.sub);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async resendVerification(@CurrentUser() user: JwtPayload) {
    return this.authService.sendVerificationEmail(user.sub);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('register-member')
  @HttpCode(HttpStatus.OK)
  async registerMember(
    @Body() body: { inviteToken: string; name: string; email: string; password: string; phone?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerViaInvite(body, req);
    setCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('update-phone')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updatePhone(@CurrentUser() user: JwtPayload, @Body() body: { phone: string }) {
    return this.authService.updatePhone(user.sub, body.phone);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request & { user: any }, @Res() res: Response) {
    const result = await this.authService.googleAuth(req.user, req);
    const redirectBase = process.env.FRONTEND_URL;
    const params = new URLSearchParams({
      access_token:  result.accessToken,
      refresh_token: result.refreshToken,
      plan_selected: String(result.planSelected ?? false),
      is_new_user:   String(result.isNewUser ?? false),
    });
    res.redirect(`${redirectBase}/api/auth/google/callback?${params.toString()}`);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name?: string },
  ) {
    return this.authService.updateProfile(user.sub, body);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(user.sub, body.currentPassword, body.newPassword);
  }
}