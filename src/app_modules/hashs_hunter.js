import createCrawler from 'dht-infohash-crawler';
import configs from '../configs_router/configs.js';
import fs from 'fs';
import { join } from 'path';

const { 
    indentation, 
    hashHuntersPort, 
    numberOfHunters 
} = configs;


const KBUCKET_SIZE = 128;

const DEFAULT_BUFFER_SIZE = 1024;
class customBuffer {
    constructor(capacity = DEFAULT_BUFFER_SIZE) {
        this._capacity = Math.floor((capacity + 15) / 16);
        this._infohashes = Array.from({ length: 16 }, () => new Map());
    }

    enqueue(infohashString) {
        const infohashIndex = parseInt(infohashString[0], 16);
        const infoHashesMap = this._infohashes[infohashIndex];

        if (!infoHashesMap.has(infohashString)) {
            if (infoHashesMap.size >= this._capacity) {
                let oldestKey = infoHashesMap.keys().next().value;
                infoHashesMap.delete(oldestKey);
            }

            infoHashesMap.set(infohashString, infohashString);
            return true;
        }

        return false;
    }
}

let hashCount = 0;
setInterval(() => {
    console.log(`\n>>> Number of new hashes fund in the last 15 minutes: ${hashCount}\n`);
    hashCount = 0;
}, 15 * 60 * 1000);


const recentInfohashes = new customBuffer(1024);
const torrentHashHunters = (numOfCrawlers) => {
    console.log('\n>>> Starting torrent hash search...');
    console.log(`${indentation(4)}---> Number of DHT crawlers: ${numOfCrawlers}\n`);

    Array(numOfCrawlers >= 5 ? 5 : numOfCrawlers)
        .fill(undefined)
        .forEach((_, index) => {
            let crawler = createCrawler({
                address: '0.0.0.0',
                port: hashHuntersPort + index,
                kbucketSize: KBUCKET_SIZE,
                name: `Hunter --> ${index + 1}`
            });
        
            crawler.on('infohash', (infohash, peerId, peerAddr) => {
                if (!recentInfohashes.enqueue(infohash))
                    return;

                console.log('\n--------------------------------------------\n');
                console.log(`Discovered new infoHash:\n---> ${infohash}`);
                console.log('\n--------------------------------------------');

                _writeInfoHashToFile(infohash);
                hashCount++;
            });
        });
        console.log('>>> Now hunting for new infoHashes...\n')

}


const _writeInfoHashToFile = (infoHashToSave) => {
    const filePath = join(process.cwd(), './example/initial_hashes.csv');
    
    let infoHash = infoHashToSave
        .replace(/(\r\n|\n|\r)/gm, "")
        .toUpperCase();
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Failed to read file: ${err}`);
            return;
        }
        
        let fileData = data
            .endsWith('\n') ? data : data.concat('\n');

        fileData = fileData
            .concat(infoHash)
            .concat('\n');
        
        fs.writeFile(filePath, fileData, (err) => {
            if (err) {
                console.error(`Failed to write infoHash to file: ${err}`);
            }
        });
    });
}


torrentHashHunters(numberOfHunters);