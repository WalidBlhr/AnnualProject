import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from "typeorm";
import { Service } from "./service";
import { User } from "./user";

export enum BookingDay {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

export enum BookingStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  CANCELLED = 'cancelled'
}

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Service, service => service.bookings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'service_id' })
    service: Service;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'requester_id' })
    requester: User;

    @Column({
        type: 'enum',
        enum: BookingDay,
        comment: 'Jour de la semaine pour la réservation'
    })
    day: BookingDay;

    @Column({
        type: 'varchar',
        length: 11,
        comment: 'Créneau horaire au format HH:mm-HH:mm (ex: 09:00-17:00)'
    })
    time_slot: string;

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.PENDING,
        comment: 'Statut de la réservation'
    })
    status: BookingStatus;

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        comment: 'Date de création de la réservation'
    })
    created_at: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
        comment: 'Date de dernière mise à jour de la réservation'
    })
    updated_at: Date;

    constructor(
        id: number,
        service: Service,
        requester: User,
        day: BookingDay,
        time_slot: string,
        status: BookingStatus,
        created_at: Date,
        updated_at: Date
    ) {
        this.id = id;
        this.service = service;
        this.requester = requester;
        this.day = day;
        this.time_slot = time_slot;
        this.status = status;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}
