import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm"
import { User } from "./user";
import { EventParticipant } from "./event_participant";

@Entity({ name: "event" })
export class Event {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string;

    @Column({ type: 'timestamptz' })
    date: Date;

    @Column()
    location: string;

    @Column()
    max_participants: number;

    @Column({ nullable: true })
    min_participants?: number;

    @Column()
    status: string;

    @ManyToOne(() => User, user => user.createdEvents)
    @JoinColumn({ name: 'creator_id' })
    creator: User;

    @OneToMany(() => EventParticipant, ep => ep.event)
    participants: EventParticipant[];

    constructor(id: number, name: string, date: Date, location: string, max_participants: number, min_participants: number, status: string, creator: User, participants: EventParticipant[]) {
        this.id = id
        this.name = name
        this.date = date
        this.location = location
        this.max_participants = max_participants
        this.min_participants = min_participants
        this.status = status
        this.creator = creator
        this.participants = participants
    }
}
