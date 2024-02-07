import DHT from 'bittorrent-dht'
import configs from './configs_router/configs.js';
import dbHandler from './app_modules/db_handler.js'
import tracker from './app_modules/tracker.js'

const { trackTorrent } = tracker;

const { 
    openConnection, 
    closeConnection 
} = dbHandler;

const { 
    timeInterval, 
    dhtPort, 
    databaseName, 
    indentation, 
    getInitialHashes 
} = configs;


const dht = new DHT()
let visited = new Set()

const hashesArray = getInitialHashes('./example/initial_hashes.csv');


openConnection(databaseName).then(() => {
    console.log(`${indentation(4)}---> Connection to database established\n`);
    console.log(
        `>>> Time interval set to check every ${timeInterval / 60000} minutes <<<\n`,
        `${indentation(3)}---> Please wait for the tracking session to start...\n`,
    );
    console.log('================================================\n');
});


let isSocketBound = false;
if (!isSocketBound) {
    dht.listen(dhtPort, () => {
        console.log('------------------------------------------------');
        console.log('>>>> Starting tracking and indexing session <<<<')
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


export default {
    indexer,
    closeConnection,
    indentation,
    hashesArray
};