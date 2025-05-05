import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { User } from "./user";

@Entity({ name: "service" })
export class Service {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column()
    type: string;

    @Column()
    status: string;

    @Column({ type: 'timestamptz' })
    date_start: Date;

    @Column({ type: 'timestamptz' })
    date_end: Date;

    @Column({ type: 'jsonb', nullable: true })
    availability: {
        days: string[];
        time_slots: {
            start: string;
            end: string;
        }[];
    };

    @CreateDateColumn({ type: "timestamptz" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt: Date;

    @ManyToOne(() => User, user => user.providedServices)
    @JoinColumn({ name: 'provider_id' })
    provider: User;

    @ManyToOne(() => User, user => user.requestedServices, { nullable: true })
    @JoinColumn({ name: 'requester_id' })
    requester: User | null;

    constructor(
        id: number, 
        title: string, 
        description: string, 
        type: string, 
        createdAt: Date, 
        updatedAt: Date,
        date_start: Date, 
        date_end: Date, 
        status: string, 
        provider: User, 
        requester?: User
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.type = type;
        this.status = status;
        this.date_start = date_start;
        this.date_end = date_end;
        this.availability = {
            days: [],
            time_slots: []
        };
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.provider = provider;
        this.requester = requester || null;
    }
}
