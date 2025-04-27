import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schema/user.schema';
import { isValidObjectId, Model } from 'mongoose';
import { Ticket } from 'src/ticket/schema/ticket.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existUser) throw new BadRequestException('User already exist');

    const user = await this.userModel.create(createUserDto);
    if (!user) throw new BadRequestException('User could not be created');
    return user;
  }

  findAll() {
    return this.userModel.find();
  }

  async fetchAgents() {
    const agents = await this.userModel.find({ role: 'agent' });
    return agents;
  }
  fetchUsers() {
    return this.userModel.find({ role: 'user' });
  }
  fetchAdmins() {
    return this.userModel.find({ role: 'admin' });
  }
  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Not valid id');
    const user = await this.userModel.findById(id).populate({ path: 'tickets' });
    if (!user) throw new BadRequestException('User Not Found');
    return user || {};
  }

  async findOneByEmail(email: string) {
    const user = await this.userModel
      .findOne({ email: email })
      .select('+password +otpCode +validateOtpCodeDate');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (!isValidObjectId(id)) throw new BadRequestException('Not valid id');
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true },
    );

    return { message: 'user updated', data: updatedUser };
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Not valid id');
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new BadRequestException('User Not Found');
    return { message: 'user deleted', data: user };
  }
}
