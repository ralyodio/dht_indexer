import DHT from 'bittorrent-dht'
import configs from './configs_router/configs.js';
import dbHandler from './app_modules/db_handler.js'
import memoryHandler from './app_modules/memory_handler.js'
import tracker from './app_modules/tracker.js'
import { parse } from 'fast-csv';
import { watch, createReadStream } from 'fs';

const { trackTorrent } = tracker;
const { checkAndCleanTempDir } = memoryHandler;

const {
    openConnection,
    closeConnection
} = dbHandler;

const {
    timeDelay,
    dhtPort,
    databaseName,
    indentation,
    csvFilePath,
    tempDir,
    tmpDirCleanInterval,
    maxTmpDirSize,
    arrayProssesingChunkSize
} = configs;


const dht = new DHT();
let visited = new Set();

openConnection(databaseName).then(() => {
    console.log(
        `${indentation(4)}---> Connection to database established\n\n` +
        `>>> Metadata collection time delay set to ${timeDelay} seconds <<<\n` +
        '\n================================================\n' +
        `\n>>> Please wait | ${timeDelay} | seconds...\n` +
        `${indentation(4)}---> the indexer is collecting initial metadata\n` +
        '\n================================================\n'
    );
});


let isSocketBound = false;
if (!isSocketBound) {
    dht.listen(dhtPort, () => {
        console.log(
            '------------------------------------------------\n' +
            '>>>> Starting tracking and indexing session <<<<'
        );
    });

    isSocketBound = true;
}


const indexer = async (hashToProcess) => {

    dht.on('peer', (peer, infoHashBuf) => {
        const infoHash = infoHashBuf.toString('hex')

        if (visited.has(infoHash)) return
        visited.add(infoHash)

        //console.log(`Found potential peer ${peer.host}:${peer.port}`)
        trackTorrent(infoHash);
    })

    dht.lookup(hashToProcess)

}


let timeoutId;
const chunkSize = arrayProssesingChunkSize;

const _readAndProcessCSV = (filePath) => {
    let stream = createReadStream(filePath);
    let chunks = [];
    let currentChunk = [];

    let csvStream = parse()
        .on('data', (record) => {
            currentChunk.push(...record);

            if (currentChunk.length === chunkSize) {
                chunks.push(currentChunk);
                currentChunk = [];
            }
        })
        .on('end', () => {
            if (currentChunk.length) {
                chunks.push(currentChunk);
            }
            _runIndexSession(chunks);
        });

    stream.pipe(csvStream);
};


const startStream = () => {

    let filePath = csvFilePath;
    _readAndProcessCSV(filePath);

    watch(filePath, (eventType, filename) => {
        if (eventType === 'change') {
            if (timeoutId) clearTimeout(timeoutId);

            timeoutId = setTimeout(() => {
                _readAndProcessCSV(filePath);
            }, 1000);
        }
    });

    setInterval(() => {
        checkAndCleanTempDir(tempDir, maxTmpDirSize);
    }, tmpDirCleanInterval * 60 * 1000);

};


const _runIndexSession = async (chunks) => {
    for (let chunk of chunks) {
        try {
            await Promise.allSettled(chunk.map(hash => indexer(hash)));
        } catch (error) {
            console.log(error);
        }
    }
};


const exitCleanups = () => {
    checkAndCleanTempDir(tempDir, 0);
}


export default {
    indexer,
    closeConnection,
    indentation,
    csvFilePath,
    checkAndCleanTempDir,
    exitCleanups,
    tempDir,
    startStream,
};
