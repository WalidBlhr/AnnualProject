import {Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm"
import {User} from "./user";
import { Message } from "./message";

@Entity({name: "messagegroup"})
export class MessageGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @ManyToOne(() => User, user => user.ownedGroups)
    @JoinColumn({name: "ownerId"})
    owner: User;

    @ManyToMany(() => User, user => user.joinedGroups)
    @JoinTable({
      joinColumn: {name: "groupId", referencedColumnName: "id"},
      inverseJoinColumn: {name: "userId", referencedColumnName: "id"},
    })
    members: User[];

    @OneToMany(() => Message, message => message.group)
    messages: Message[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    constructor(
      id: number,
      name: string,
      description: string, 
      owner: User,
      members: User[],
      messages: Message[],
      createdAt: Date,
      updatedAt: Date
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.owner = owner;
        this.members = members;
        this.messages = messages;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}