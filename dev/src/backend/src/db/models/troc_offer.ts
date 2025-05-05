import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, } from "typeorm"
import { User } from "./user";

@Entity({ name: "trocoffer" })
export class TrocOffer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column({ type: 'timestamptz' })
    creation_date: Date;

    @Column()
    status: string;

    @Column()
    type: string; // 'offer' ou 'request'

    @Column({ type: 'varchar', nullable: true })
    image_url: string | null;

    @ManyToOne(() => User, user => user.offers)
    @JoinColumn({ name: 'user_id' })
    user: User;

    constructor(id: number, title: string, description: string, creation_date: Date, status: string, type: string, image_url: string, user: User) {
        this.id = id
        this.title = title
        this.description = description
        this.creation_date = creation_date
        this.status = status
        this.type = type
        this.image_url = image_url
        this.user = user
    }
}
