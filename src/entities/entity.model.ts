import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Data {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column("jsonb", { default: {}, nullable: false })
    data: Record<string, any>;
}
