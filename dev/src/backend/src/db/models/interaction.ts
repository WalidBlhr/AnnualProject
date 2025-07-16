import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity({ name: "interaction" })
@Index(["userA", "interactionType", "date"])
@Index(["userB", "interactionType", "date"])
@Index(["userA", "userB"])
@Index(["entityType", "entityId"])
export class Interaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index()
    userA: number; // ID de l'utilisateur qui initie l'interaction

    @Column()
    @Index()
    userB: number; // ID de l'utilisateur qui reçoit/participe à l'interaction

    @Column({
        type: "enum",
        enum: ["service", "troc", "event", "absence", "message", "view", "recommendation"],
    })
    @Index()
    entityType: "service" | "troc" | "event" | "absence" | "message" | "view" | "recommendation"; // Type d'entité concernée

    @Column({
        type: "enum",
        enum: [
            "created", "booked", "accepted", "cancelled", "completed", "declined",
            "joined", "left", "attended", "organized",
            "offered", "requested", "exchanged",
            "sent", "received", "replied",
            "viewed", "recommended", "rated"
        ],
    })
    @Index()
    interactionType: "created" | "booked" | "accepted" | "cancelled" | "completed" | "declined" |
                    "joined" | "left" | "attended" | "organized" |
                    "offered" | "requested" | "exchanged" |
                    "sent" | "received" | "replied" |
                    "viewed" | "recommended" | "rated"; // Type d'action effectuée

    @Column()
    @Index()
    category: string; // Catégorie de l'entité (ex: "garde_animaux", "bricolage", "sport", etc.)

    @Column()
    entityId: number; // ID de l'entité concernée (service, troc, event, etc.)

    @Column()
    entityTitle: string; // Titre/nom de l'entité pour faciliter les recherches

    @Column({ type: "timestamptz" })
    @Index()
    date: Date; // Date de l'interaction

    @Column({ type: "int", nullable: true })
    rating?: number; // Note optionnelle (1-5) pour évaluer l'interaction

    @Column({ type: "text", nullable: true })
    notes?: string; // Notes optionnelles sur l'interaction

    @Column({ type: "jsonb", nullable: true })
    metadata?: {
        location?: string;
        duration?: number;
        price?: number;
        participants?: number[];
        tags?: string[];
        [key: string]: any;
    }; // Métadonnées supplémentaires selon le type d'interaction

    @CreateDateColumn({ type: "timestamptz" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt: Date;

    constructor(
        id: number,
        userA: number,
        userB: number,
        entityType: "service" | "troc" | "event" | "absence" | "message" | "view" | "recommendation",
        interactionType: "created" | "booked" | "accepted" | "cancelled" | "completed" | "declined" |
                        "joined" | "left" | "attended" | "organized" |
                        "offered" | "requested" | "exchanged" |
                        "sent" | "received" | "replied" |
                        "viewed" | "recommended" | "rated",
        category: string,
        entityId: number,
        entityTitle: string,
        date: Date,
        createdAt: Date,
        updatedAt: Date,
        rating?: number,
        notes?: string,
        metadata?: any
    ) {
        this.id = id;
        this.userA = userA;
        this.userB = userB;
        this.entityType = entityType;
        this.interactionType = interactionType;
        this.category = category;
        this.entityId = entityId;
        this.entityTitle = entityTitle;
        this.date = date;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.rating = rating;
        this.notes = notes;
        this.metadata = metadata;
    }
}
