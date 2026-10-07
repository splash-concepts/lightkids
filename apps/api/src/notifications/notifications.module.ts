import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway.js';

@Module({
  providers: [NotificationsGateway],
  exports: [NotificationsGateway], // Export so HandoffService can use it
})
export class NotificationsModule {}
