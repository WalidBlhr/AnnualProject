import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Token } from "./token"
import { Service } from "./service";
import { Event } from "./event";
import { TrocOffer } from "./troc_offer";
import { Message } from "./message";
import { EventParticipant } from "./event_participant";
import { Absence } from "./absence";
import { Booking } from "./booking";
import * as Joi from 'joi';

@Entity({ name: "user" })
export class User {
    [x: string]: any;
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        unique: true
    })
    email: string

    @Column()
    password: string

    @Column()
    lastname: string

    @Column()
    firstname: string

    @Column()
    role: number

    @CreateDateColumn({ type: "timestamptz" })
    createdAt: Date

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt: Date

    @OneToMany(() => Token, token => token.user)
    tokens: Token[];

    @OneToMany(() => Service, service => service.provider)
    providedServices: Service[];

    @OneToMany(() => TrocOffer, offer => offer.user)
    offers: TrocOffer[];

    @OneToMany(() => Message, message => message.sender)
    sentMessages: Message[];

    @OneToMany(() => Message, message => message.receiver)
    receivedMessages: Message[];

    @OneToMany(() => EventParticipant, ep => ep.user)
    eventParticipations: EventParticipant[];

    @OneToMany(() => Event, event => event.creator)
    createdEvents: Event[];

    @OneToMany(() => Absence, absence => absence.user)
    absences: Absence[];

    @OneToMany(() => Booking, booking => booking.requester)
    bookings: Booking[];

    @ManyToMany(() => User)
    @JoinTable({
        name: "trusted_contacts",
        joinColumn: { name: "user_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "trusted_user_id", referencedColumnName: "id" }
    })
    trusted_contacts: User[];

    @Column({ nullable: true, default: 'offline' })
    status: string;

    @Column({ type: "timestamptz", nullable: true, default: () => "CURRENT_TIMESTAMP"})
    last_active: Date;

    @Column({ type: "boolean", default: true })
    email_notifications_enabled: boolean;

    constructor(id: number, 
        email: string, password: string, 
        lastname: string, 
        firstname: string, 
        role: number, 
        createdAt: Date, 
        updatedAt: Date, 
        tokens: Token[], 
        providedServices: Service[], 
        offers: TrocOffer[], 
        sentMessages: Message[], 
        receivedMessages: Message[], 
        eventParticipations: EventParticipant[], 
        createdEvents: Event[],
        absences: Absence[],
        bookings: Booking[],
        trusted_contacts: User[],
        status: 'online' | 'offline',
        last_active: Date,
        email_notifications_enabled: boolean = true
    ) {
        this.id = id
        this.email = email
        this.password = password
        this.lastname = lastname
        this.firstname = firstname
        this.role = role
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.tokens = tokens
        this.providedServices = providedServices
        this.offers = offers
        this.sentMessages = sentMessages
        this.receivedMessages = receivedMessages
        this.eventParticipations = eventParticipations
        this.createdEvents = createdEvents
        this.absences = absences
        this.bookings = bookings
        this.trusted_contacts = trusted_contacts
        this.status = status
        this.last_active = last_active
        this.email_notifications_enabled = email_notifications_enabled
    }
}
