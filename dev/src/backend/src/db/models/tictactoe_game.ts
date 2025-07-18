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

    @Column({ type: 'varchar' })
    nextPlayer!: 'X' | 'O';

    @Column({ type: 'varchar', default: 'pending' })
    status!: 'pending' | 'active' | 'finished' | 'declined';

    @Column({ type: 'varchar', nullable: true })
    winner!: 'X' | 'O' | 'draw' | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 