import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { User } from "./user";
import { Event } from "./event";

@Entity({ name: "eventparticipant" })
export class EventParticipant {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, user => user.eventParticipations)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Event, event => event.participants)
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @Column({ type: 'timestamptz' })
    date_inscription: Date;

    @Column()
    status_participation: string;

    constructor(id: number, user: User, event: Event, date_inscription: Date, status_participation: string) {
        this.id = id
        this.user = user
        this.event = event
        this.date_inscription = date_inscription
        this.status_participation = status_participation
    }
}
