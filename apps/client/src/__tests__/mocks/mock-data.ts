import { Otp, User } from '@repo/types';

type MockData = {
  user: User;
  otp: Otp;
};

const mockData: MockData = {
  user: {
    id: '1',
    email: 'test@email.com',
    password: 'password',
    username: '@test',
    displayName: 'test',
    status: 'ONLINE',
    lastOnline: new Date(),
    lastUpdated: new Date(),
    dateCreated: new Date(),
    conversations: [],
  },
  otp: {
    email: 'test@email.com',
    pin: '123XYZ',
    type: 'RECOVER',
    dateCreated: new Date(),
  },
};

export default mockData;
