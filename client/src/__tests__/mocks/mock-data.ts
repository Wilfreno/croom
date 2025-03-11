import { Otp, User } from "@/lib/types/server-data-types";

type MockData = {
  user: User;
  otp: Otp;
};

const mock_data: MockData = {
  user: {
    id: "1",
    email: "test@email.com",
    password: "password",
    username: "@test",
    display_name: "test",
    status: "ONLINE",
    last_online: new Date(),
    last_updated: new Date(),
    date_created: new Date(),
    conversations: [],
  },
  otp: {
    email: "test@email.com",
    pin: "123XYZ",
    type: "RECOVER",
    date_created: new Date(),
  },
};

export default mock_data;
