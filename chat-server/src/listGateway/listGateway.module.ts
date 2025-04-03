import { Module } from '@nestjs/common';
import { ListGateway } from './listGateway.gateway';

@Module({
  providers: [ListGateway],
  exports: [ListGateway], 
})
export class ListGatewayModule {}
