interface MessageBase{
  id: number;
  content: string;
  date_sent: string;
  status: string;
  sender: User;
}

export type AnyMessage = PrivateMessage | GroupMessage;

export type PrivateMessage = MessageBase & (
  {receiver: User, group: null}
);

export type GroupMessage = MessageBase & (
  {receiver: null, group: Group}
);

export interface User{
  id: number;
  firstname: string;
  lastname: string;
}

interface Group{
  id: number;
  name: string;
  createdAt: string;
}

export interface MessageGroup{
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type DetailedMessageGroup = MessageGroup & {
  owner: User;
  members: User[];
}

export type PatchMessageGroupRequestBody = {
  name?: string;
  description?: string;
  ownerId?: number;
} & ({
  newMembersIDs?: number[];
  removedMembersIDs?: number[];
} | {membersIDs?: number[]})