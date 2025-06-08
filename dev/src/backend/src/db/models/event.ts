import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./user";
import { EventParticipant } from "./event_participant";

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    date: Date;

    @Column()
    location: string;

    @Column()
    max_participants: number;
    
    @Column({ nullable: true, default: 0 })
    min_participants: number;

    @Column()
    status: string; // "open", "closed", "pending", "canceled", "draft"

    // Nouveau champ pour déterminer le type d'événement
    @Column({ default: "regular" })
    type: string; // "regular", "community"

    // Fix: Use type string instead of string | null
    @Column({ nullable: true, type: "varchar" })
    category: string;

    // Nouveau champ pour la description détaillée
    @Column({ type: "text", nullable: true })
    description: string;

    // Nouveau champ pour le matériel nécessaire
    @Column({ nullable: true, type: "varchar" })
    equipment_needed: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "creator_id" })
    creator: User;

    @OneToMany(() => EventParticipant, participant => participant.event)
    participants: EventParticipant[];

    constructor(
        id: number,
        name: string,
        date: Date,
        location: string,
        max_participants: number,
        min_participants: number | null,
        status: string,
        creator: User,
        type: string = "regular",
        category: string | null = null,
        description: string | null = null,
        equipment_needed: string | null = null,
        participants: EventParticipant[]
    ) {
        this.id = id;
        this.name = name;
        this.date = date;
        this.location = location;
        this.max_participants = max_participants;
        this.min_participants = min_participants || 0;
        this.status = status;
        this.creator = creator;
        this.type = type;
        this.category = category || "";
        this.description = description || "";
        this.equipment_needed = equipment_needed || "";
        this.participants = participants;
    }
}
