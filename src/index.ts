import "reflect-metadata";
import { StorageSpec } from "@tanglelabs/ssimon";
import { DataSource, Repository } from "typeorm";
import { Data } from "./entities/entity.model";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class StorageDriver implements StorageSpec<any, any> {
    dataSource: DataSource;
    repository: Repository<Data>;

    private constructor() {}
    private async _findEntity(options: Partial<any>): Promise<Data> {
        const entity = await this.repository
            .createQueryBuilder("entity")
            .where("entity.data ::jsonb @> :data", {
                data: {
                    ...options,
                },
            })
            .getOne();
        return entity;
    }

    static async build(props: {
        databaseUrl: string;
        type: unknown;
    }): Promise<StorageSpec<any, any>> {
        const { type, databaseUrl } = props;
        const dataSource = new DataSource({
            // @ts-ignore
            type,
            url: databaseUrl,
            entities: [__dirname + "/../**/*.model.{js,ts}"],
            synchronize: true,
        });
        await dataSource.initialize();
        const storage = new StorageDriver();
        storage.dataSource = dataSource;
        storage.repository = dataSource.getRepository(Data);
        return storage;
    }

    async create(body: any): Promise<Record<string, any>> {
        const entity = this.repository.create({ data: body });
        await this.repository.save(entity);
        console.log(entity);
        return entity.data;
    }

    async findOne(options: Partial<any>): Promise<Record<string, any>> {
        const entity = await this._findEntity(options);
        if (!entity) return null;
        return entity.data;
    }

    async findMany(options: Partial<any>): Promise<Record<string, any>[]> {
        const entities = await this.repository
            .createQueryBuilder("entity")
            .where("entity.data ::jsonb @> :data", {
                data: {
                    ...options,
                },
            })
            .getMany();
        return entities.map((e) => e.data);
    }

    async findOneAndUpdate(
        searchParams: Partial<any>,
        body: Partial<any>
    ): Promise<Record<string, any>> {
        console.log("updating");
        const entity = await this._findEntity(searchParams);
        entity.data = { ...entity.data, ...body };
        await this.repository.save({
            ...entity,
        });
        return entity.data;
    }

    async findOneAndDelete(searchParams: Partial<any>): Promise<any> {
        const entity = await this._findEntity(searchParams);
        await this.repository.remove(entity);
        return entity.data;
    }
}
