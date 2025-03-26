import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { User } from "./user";

@Entity({ name: "message" })
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    content: string;

    @Column({ type: 'timestamptz' })
    date_sent: Date;

    @ManyToOne(() => User, user => user.sentMessages)
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @ManyToOne(() => User, user => user.receivedMessages)
    @JoinColumn({ name: 'receiver_id' })
    receiver: User;

    @Column()
    status: string; // "lu", "non_lu"

    constructor(id: number, content: string, date_sent: Date, sender: User, receiver: User, status: string) {
        this.id = id
        this.content = content
        this.date_sent = date_sent
        this.sender = sender
        this.status = status
        this.receiver = receiver
        this.status = status
    }
}
