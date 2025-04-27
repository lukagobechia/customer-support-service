import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Ticket } from './schema/ticket.schema';
import { User } from 'src/user/schema/user.schema';
import { ChatGateway } from 'src/chatGateway/chatGateway.gateway';
import { QueryParamsDto } from './dto/query-params.dto';

@Injectable()
export class TicketService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async addMessage(
    ticketId: string,
    sender: string,
    message?: string,
    imageUrl?: string,
    filePath?: string,
  ) {
    const ticket = await this.ticketModel.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.messages.push({ sender, message, imageUrl,filePath, timestamp: new Date() });
    return await ticket.save();
  }

  async create(createTicketDto: CreateTicketDto, id: mongoose.Types.ObjectId) {
    const customer = await this.userModel.findById(id);
    if (!customer) throw new BadRequestException('Customer not found');

    const newTicket = await this.ticketModel.create({
      ...createTicketDto,
      customer: id,
    });

    if (!newTicket)
      throw new BadRequestException('Ticket could not be created');
    return newTicket;
  }

  async findAll(queryParams: QueryParamsDto) {
    const {
      page = 1,
      take = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      priority,
      assignee,
      customer,
      startDate,
      endDate,
    } = queryParams;

    const filters: any = {};

    if (search) {
      filters.$or = [{ issue: { $regex: search, $options: 'i' } }];
    }

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignee) filters.assignee = assignee;
    if (customer) filters.customer = customer;

    if (startDate && endDate) {
      filters.createdAt = { $gte: startDate, $lte: endDate };
    }

    const limit = Math.min(take, 5);
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.ticketModel
        .find(filters)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'customer',
          select:
            '-__v -password -otpCode -validateOtpCodeDate -createdAt -updatedAt -isVerified',
        })
        .populate({
          path: 'assignee',
          select:
            '-__v -password -otpCode -validateOtpCodeDate -createdAt -updatedAt -isVerified',
        }),

      this.ticketModel.countDocuments(filters),
    ]);

    if (!tickets) throw new BadRequestException('Tickets not found');

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllCustomersTickets(
    id: mongoose.Types.ObjectId,
    query: QueryParamsDto,
  ) {
    const customer = await this.userModel.findById(id);

    if (!customer) throw new BadRequestException('Customer not found');

    const {
      page = 1,
      take = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
      status,
      priority,
    } = query;

    const filters: any = {
      customer: id,
    };

    if (search) {
      filters.$or = [
        { issue: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const skip = (page - 1) * take;

    const tickets = await this.ticketModel
      .find(filters)
      .populate({
        path: 'customer',
        select:
          '-__v -password -otpCode -validateOtpCodeDate -createdAt -updatedAt -isVerified',
      })
      .populate({
        path: 'assignee',
        select:
          '-__v -password -otpCode -validateOtpCodeDate -createdAt -updatedAt -isVerified',
      })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(take);

    const total = await this.ticketModel.countDocuments(filters);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: mongoose.Types.ObjectId) {
    const ticket = await this.ticketModel
      .findById(id)
      .populate({
        path: 'customer',
        select:
          '-__v -createdAt -updatedAt -password -isVerified -otpCode -validateOtpCodeDate',
      })
      .populate({
        path: 'assignee',
        select:
          '-__v -createdAt -updatedAt -password -isVerified -otpCode -validateOtpCodeDate',
      })
      .select('-__v')
      .exec();

    if (!ticket) throw new BadRequestException('Ticket not found');
    return ticket;
  }

  async assignTicket(
    ticketId: mongoose.Types.ObjectId,
    assigneeId: mongoose.Types.ObjectId,
  ) {
    const ticket = await this.ticketModel.findById(ticketId);
    if (!ticket) throw new BadRequestException('Ticket not found');

    const assignee = await this.userModel.findById(assigneeId);
    if (!assignee) throw new BadRequestException('Assignee not found');

    const updatedTicket = await this.ticketModel.findByIdAndUpdate(
      ticketId,
      { assignee: assigneeId },
      { new: true },
    );

    if (!updatedTicket)
      throw new BadRequestException('Ticket could not be assigned');

    return updatedTicket;
  }

  async changeStatus(id: mongoose.Types.ObjectId, status: string) {
    const ticket = await this.ticketModel.findById(id);
    if (!ticket) throw new BadRequestException('Ticket not found');

    const updatedTicket = await this.ticketModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    return updatedTicket;
  }

  async closeTicket(id: mongoose.Types.ObjectId) {
    const ticket = await this.ticketModel.findById(id);
    if (!ticket) throw new BadRequestException('Ticket not found');
    const updatedTicket = await this.ticketModel.findByIdAndUpdate(
      id,
      { status: 'closed' },
      { new: true },
    );
    if (!updatedTicket)
      throw new BadRequestException('Ticket could not be closed');
    return updatedTicket;
  }

  async remove(id: mongoose.Types.ObjectId) {
    const ticket = await this.ticketModel.findByIdAndDelete(id);
    if (!ticket) throw new BadRequestException('Ticket not found');
    return ticket;
  }
}
