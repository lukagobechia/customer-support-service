import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import mongoose from 'mongoose';
import { Query } from '@nestjs/common';
import { IsAgent, IsCustomer } from 'src/auth/role.guard';
import { ListGateway } from 'src/listGateway/listGateway.gateway';
import { QueryParamsDto } from './dto/query-params.dto';

@Controller('ticket')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly listGateway: ListGateway,
  ) {}

  @Post()
  @UseGuards(AuthGuard, IsCustomer)
  async create(@Body() createTicketDto: CreateTicketDto, @Req() req) {
    const id = req.user.userId;
    const newTicket = await this.ticketService.create(createTicketDto, id);
    this.listGateway.sendUpdate({ type: 'create', item: newTicket });
    return newTicket;
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.ticketService.findAll(query);
  }

  @Get('customer-tickets')
  @UseGuards(AuthGuard, IsCustomer)
  findAllCustomersTickets(@Req() req) {
    const id = req.user.userId;
    return this.ticketService.findAllCustomersTickets(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard, IsCustomer)
  findOne(@Param('id') id: mongoose.Types.ObjectId) {
    return this.ticketService.findOne(id);
  }

  // @Get("refresh-url")
  // async refreshSignedUrl(@Query("filePath") filePath: string) {
  //   if (!filePath) throw new BadRequestException("File path is required");

  //   return { signedUrl: await this.awsS3Service.getSignedUrl(filePath) };
  // }
  
  @Patch(':id/assign')
  @UseGuards(AuthGuard, IsAgent)
  assignTicket(@Param('id') id, @Body() body) {
    const assigneeId = body.assigneeId;
    const ticketId = id;
    console.log(ticketId, body);
    return this.ticketService.assignTicket(ticketId, assigneeId);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, IsAgent)
  changeStatus(@Param('id') id, @Body() body) {
    const ticketId = id;
    const status = body.status;
    return this.ticketService.changeStatus(ticketId, status);
  }

  @Patch(':id/close')
  closeTicket(@Param('id') id: mongoose.Types.ObjectId) {
    return this.ticketService.closeTicket(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, IsAgent)
  async remove(@Param('id') id: mongoose.Types.ObjectId) {
    const deletedTicket = await this.ticketService.remove(id);
    this.listGateway.sendUpdate({ type: 'delete', item: deletedTicket });
    return deletedTicket;
  }
  
}
