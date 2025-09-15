import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersController } from './users.controller';
import { OrdersController } from './orders.controller';
import { ReportsController } from './reports.controller';
import { InvoicesController } from './invoices.controller';
import { SettingsController } from './settings.controller';
import { ProductTypesController } from './product-types.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AppController, HealthController, AuthController, UsersController, ProductsController, CategoriesController, OrdersController, ReportsController, InvoicesController, SettingsController, ProductTypesController],
  providers: [PrismaService, AuthService, JwtStrategy, ProductsService, CategoriesService],
})
export class AppModule {}
