import { MongoClient } from 'mongodb';

if (!process.env['MONGODB_URL']) {
    throw new Error("The environment variable 'MONGODB_URL' is not set");
}

const url: string = process.env['MONGODB_URL'];

namespace Database {

    export const Client = new MongoClient(url);

    export const connect = () => Client.connect().then(() =>
        console.log("[INFO] Connected to mongodb instance on '%s'", url)
    );

}

export default Database;
