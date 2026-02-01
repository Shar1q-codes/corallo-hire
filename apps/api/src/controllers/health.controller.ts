import { Controller, Get } from '@nestjs/common';

import { Public } from '../auth/decorators.js';

@Controller()
export class HealthController {
  @Get('/')
  @Public()
  root() {
    return { name: 'ats-api', status: 'ok' };
  }

  @Get('/health')
  @Public()
  health() {
    return { status: 'ok' };
  }
}
