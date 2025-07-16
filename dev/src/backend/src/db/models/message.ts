import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from "typeorm"
import {User} from "./user";
import { MessageGroup } from "./message_group";

@Entity({name: "message"})
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    content: string;

    @Column({type: 'timestamptz'})
    date_sent: Date;

    @ManyToOne(() => User, user => user.sentMessages)
    @JoinColumn({name: 'sender_id'})
    sender: User;

    @ManyToOne(() => User, user => user.receivedMessages)
    @JoinColumn({name: 'receiver_id'})
    receiver: User;

    @Column()
    status: string; // "lu", "non_lu"

    @ManyToOne(() => MessageGroup, group => group.messages)
    @JoinColumn({name: 'groupId'})
    group?: MessageGroup;

    constructor(id: number, content: string, date_sent: Date, sender: User, receiver: User, status: string, group?: MessageGroup) {
        this.id = id;
        this.content = content;
        this.date_sent = date_sent;
        this.sender = sender;
        this.status = status;
        this.receiver = receiver;
        this.group = group;
        this.status = status;
    }
}
