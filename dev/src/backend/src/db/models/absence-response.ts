import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user";
import { Absence } from "./absence";

@Entity()
export class AbsenceResponse {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Absence, absence => absence.responses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "absence_id" })
    absence: Absence;

    @ManyToOne(() => User)
    @JoinColumn({ name: "contact_id" })
    contact: User;

    @Column({ default: 'pending' })
    status: string; // pending, accepted, refused

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    responded_at: Date;

    @Column({ type: 'text', nullable: true })
    response_notes: string;

    constructor(absence: Absence, contact: User, status: string = 'pending', response_notes: string = '') {
        this.absence = absence;
        this.contact = contact;
        this.status = status;
        this.response_notes = response_notes;
        this.responded_at = new Date();
    }
}
