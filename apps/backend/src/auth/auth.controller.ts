import {
  Controller, Post, Get, Body, Req, Res,
  UseGuards, HttpCode, HttpStatus, UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/auth.guards';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './jwt-payload.interface';
import { AuthGuard } from '@nestjs/passport';
import { SkipBilling } from '../modules/billing/skip-billing.decorator';

@SkipBilling()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request & { cookies: any }) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    return this.authService.refresh(refreshToken, req);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.sub);
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };
    res.clearCookie('access_token', cookieOpts);
    res.clearCookie('refresh_token', cookieOpts);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload, @Req() req: Request) {
    return user;
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
  ) {
    return this.authService.registerViaInvite(body, req);
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
}