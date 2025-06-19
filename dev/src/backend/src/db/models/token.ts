import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./user";

@Entity()
export class Token {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    token: string;

    @Column()
    type: TokenType;

    @ManyToOne(() => User, user => user.tokens)
    user: User;

    constructor(id: number, token: string, user: User, type: TokenType) {
        this.id = id;
        this.token = token;
        this.user = user;
        this.type = type;
    }
}

export type TokenType = "access" | "refresh";
