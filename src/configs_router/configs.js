import fs from 'fs';
import toml from 'toml';

// Global settings
const config = toml.parse(fs.readFileSync('./Settings.toml', 'utf-8'));
const databaseName = config.settings.database_name;
const databaseDirectory = config.settings.database_dir_name;
const dhtPort = config.settings.dht_port;
const timeInterval = config.settings.time_interval;
const hashHuntersPort = config.settings.hash_hunters_port;
const numberOfHunters = config.settings.number_of_hunters;

// For console logs formating purposes
const indentation = (size) => ' '.repeat(size);


// This is to etract torrents hashes from `example/inital_hashes.csv`
// and return an array of them for testing purposes.
// for more context, please read `example/readme.md`
const getInitialHashes = (csvFilePath) => {
    let data;
    try {
        data = fs.readFileSync(csvFilePath, 'utf-8');
    } catch (err) {
        console.error(`Failed to read file at ${csvFilePath}: ${err}`);
        return [];
    }
    const hashes = data.split('\n');
    hashes.pop();

    return hashes;
}


export default {
    databaseName,
    databaseDirectory,
    dhtPort,
    timeInterval,
    hashHuntersPort,
    numberOfHunters,
    indentation,
    getInitialHashes
};

