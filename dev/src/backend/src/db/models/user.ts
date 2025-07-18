import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Token } from "./token"
import { Service } from "./service";
import { Event } from "./event";
import { TrocOffer } from "./troc_offer";
import { Message } from "./message";
import { EventParticipant } from "./event_participant";
import { Absence } from "./absence";
import { Booking } from "./booking";
import { MessageGroup } from "./message_group";

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

    @Column({ type: "boolean", default: false })
    is_banned: boolean;

    @Column({ type: "timestamptz", nullable: true })
    banned_at: Date | null;

    @Column({ type: "text", nullable: true })
    ban_reason: string | null;

    @Column({ type: "timestamptz", nullable: true })
    ban_until: Date | null;

    @OneToMany(() => MessageGroup, group => group.owner)
    ownedGroups: MessageGroup[];

    @ManyToMany(() => MessageGroup, group => group.members)
    joinedGroups: MessageGroup[];

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
        email_notifications_enabled: boolean = true,
        ownedGroups: MessageGroup[],
        joinedGroups: MessageGroup[],
        is_banned: boolean = false,
        banned_at: Date | null = null,
        ban_reason: string | null = null,
        ban_until: Date | null = null
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
        this.ownedGroups = ownedGroups
        this.joinedGroups = joinedGroups
        this.is_banned = is_banned
        this.banned_at = banned_at
        this.ban_reason = ban_reason
        this.ban_until = ban_until
    }
}
