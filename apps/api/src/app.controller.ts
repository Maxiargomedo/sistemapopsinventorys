import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/')
  root() {
    return {
      status: 'ok',
      name: 'ventas-inventario-api',
      docs: ['/products', '/health'],
    };
  }

  @Get('/health')
  health() {
    return { status: 'ok' };
  }
}
