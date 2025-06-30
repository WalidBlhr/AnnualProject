import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'tictactoe_game' })
export class TicTacToeGame {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    playerXId!: number;

    @Column()
    playerOId!: number;

    @Column('simple-array')
    board!: string[]; // 9 cases, valeurs: '', 'X', 'O'

    @Column()
    nextPlayer!: 'X' | 'O';

    @Column({ default: 'active' })
    status!: 'active' | 'finished';

    @Column({ nullable: true })
    winner!: 'X' | 'O' | 'draw' | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 