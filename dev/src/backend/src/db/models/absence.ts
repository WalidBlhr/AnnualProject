import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user";

@Entity()
export class Absence {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.absences)
    user: User;

    @Column({ type: 'date' })
    start_date: Date;

    @Column({ type: 'date' })
    end_date: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ default: 'pending' })
    status: string; // pending, accepted, completed, canceled

    @ManyToMany(() => User)
    @JoinTable()
    trusted_contacts: User[] = [];

    constructor(id: number, user: User, start_date: Date, end_date: Date, notes: string, status: string) {
        this.id = id;
        this.user = user;
        this.start_date = start_date;
        this.end_date = end_date;
        this.notes = notes;
        this.status = status;
    }
}