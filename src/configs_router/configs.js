import fs from 'fs';
import toml from 'toml';
import memoryHandler from '../app_modules/memory_handler.js';

const { checkIfDbDirExits } = memoryHandler;


// Global settings
const config = toml.parse(fs.readFileSync('./Settings.toml', 'utf-8'));
const databaseName = config.settings.database_name;
const databaseDirectory = config.settings.database_dir_name;
const dhtPort = config.settings.dht_port;
const timeDelay = config.settings.metada_collection_time_delay;
const hashHuntersPort = config.settings.hash_hunters_port;
const numberOfHunters = config.settings.number_of_hunters;

// Mulitiple chunks
const arrayProssesingChunkSize = 5;
// in GB
const maxTmpDirSize = 3;
// in minutes
const tmpDirCleanInterval = 5;
// seconds converted to milliseconds
const millisecondsTimeDelay = timeDelay * 1000;


// For console logs formating purposes
const indentation = (size) => ' '.repeat(size);


const getFullCsvPath = (csvFileName) => {
    return `${databaseDirectory}/${csvFileName}`;
}


const csvFilePath = getFullCsvPath('initial_hashes.csv');
const tempDir = checkIfDbDirExits('tmp');


export default {
    databaseName,
    databaseDirectory,
    dhtPort,
    timeDelay,
    hashHuntersPort,
    numberOfHunters,
    indentation,
    csvFilePath,
    tempDir,
    arrayProssesingChunkSize,
    maxTmpDirSize,
    tmpDirCleanInterval,
    millisecondsTimeDelay
};

