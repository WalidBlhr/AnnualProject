interface MessageBase{
  id: number;
  content: string;
  date_sent: string;
  status: string;
  sender: User;
}

export type PrivateMessage = MessageBase & (
  {receiver: User, group: null}
);

export type GroupMessage = MessageBase & (
  {receiver: null, group: Group}
);

interface User{
  id: number;
  firstname: string;
  lastname: string;
  email_notifications_enabled: boolean;
}

interface Group{
  id: number;
  name: string;
  createdAt: string;
}
