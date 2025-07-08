import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user";
import { AbsenceResponse } from "./absence-response";

@Entity()
export class Absence {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.absences)
    @JoinColumn({ name: "user_id" })
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
    trusted_contacts: User[];

    @OneToMany(() => AbsenceResponse, response => response.absence)
    responses: AbsenceResponse[];

    constructor(id: number, user: User, start_date: Date, end_date: Date, notes: string, status: string, trusted_contacts: User[], responses: AbsenceResponse[]) {
        this.id = id;
        this.user = user;
        this.start_date = start_date;
        this.end_date = end_date;
        this.notes = notes;
        this.status = status;
        this.trusted_contacts = trusted_contacts;
        this.responses = [];
        this.responses = responses;
    }
}