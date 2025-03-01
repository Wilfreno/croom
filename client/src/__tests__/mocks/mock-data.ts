import { User } from "@/lib/types/server-data-types";

type MockData = {
  user: User;
};

const mock_data: MockData = {
  user: {
    id: "1",
    email: "test@email.com",
    password: "123456",
    username: "@test",
    display_name: "test",
    status: "ONLINE",
    last_online: new Date(),
    last_updated: new Date(),
    date_created: new Date(),
    conversations: [],
  },
};

export default mock_data;
