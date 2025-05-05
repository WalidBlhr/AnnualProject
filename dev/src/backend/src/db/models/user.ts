import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Token } from "./token"
import { Service } from "./service";
import { Event } from "./event";
import { TrocOffer } from "./troc_offer";
import { Message } from "./message";
import { EventParticipant } from "./event_participant";

@Entity({ name: "user" })
export class User {
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

    @OneToMany(() => Service, service => service.requester)
    requestedServices: Service[];

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

    constructor(id: number, 
        email: string, password: string, 
        lastname: string, 
        firstname: string, 
        role: number, 
        createdAt: Date, 
        updatedAt: Date, 
        tokens: Token[], 
        providedServices: Service[], 
        requestedServices: Service[], 
        offers: TrocOffer[], 
        sentMessages: Message[], 
        receivedMessages: Message[], 
        eventParticipations: EventParticipant[], 
        createdEvents: Event[]
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
        this.requestedServices = requestedServices
        this.offers = offers
        this.sentMessages = sentMessages
        this.receivedMessages = receivedMessages
        this.eventParticipations = eventParticipations
        this.createdEvents = createdEvents
    }
}
