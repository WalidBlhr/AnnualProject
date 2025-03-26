import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { User } from "./user";

@Entity({ name: "service" })
export class Service {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    type_service: string

    @Column()
    description: string

    @Column({ type: "timestamptz" })
    date: Date

    @Column()
    status: string // "en_attente", "termine", ...

    @CreateDateColumn({ type: "timestamptz" })
    createdAt: Date

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt: Date

    @ManyToOne(() => User, user => user.services)
    @JoinColumn({ name: 'user_id' })
    user: User;

    constructor(id: number, type_service: string, description: string, date: Date, status: string, createdAt: Date, updatedAt: Date, user: User) {
        this.id = id
        this.type_service = type_service
        this.description = description
        this.date = date
        this.status = status
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.user = user
    }
}
