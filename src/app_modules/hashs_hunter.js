import DHT from 'bittorrent-dht';
import { randomBytes } from 'crypto';
import fs from 'fs';
import { join } from 'path';
import configs from '../configs_router/configs.js';

const { dhtPort } = configs;


const torrentHashHunter = () => {
    const dht = new DHT();
    const infoHashes = new Set();

    dht.listen(dhtPort, () => {
        console.log(`\n>>> Now listening to DHT for new torrent hashes: ${dhtPort}`);
    });

    // This is to initiate a lookup for a random infoHash
    // to stimulate traffic which in return will help with
    // geting access to dht network data
    const randomInfoHash = () => {
        return randomBytes(20).toString('hex');
    }

    const performLookup = () => {
        const infoHash = randomInfoHash();
        dht.lookup(infoHash)
    }

    // Performing initial lookup
    performLookup();

    // And then perform lookups periodically to stimulate traffic.
    setInterval(() => {
        performLookup();
    }, 500); 

    dht.on('announce', (peer, infoHash) => {
        infoHash = infoHash.toString('hex');

        if (!infoHashes.has(infoHash)) { 
            infoHashes.add(infoHash);
            //console.log(`\n>>> Peer: ${peer} \nNew infoHash announced:\n${infoHash}\n`);
            console.log(
                '>>> Peer discovered --> ', peer,
                `\nNew infoHash announced:\n--> ${infoHash}\n`
            );

            // striping any potential formatting from the infoHash
            let stripedInfoHash = infoHash
                .replace(/(\r\n|\n|\r)/gm, "")
                .toUpperCase();

            _writeInfoHashToFile(stripedInfoHash);

        }
    });

    // Listening for errors
    dht.on('error', (err) => {
        console.error('Error:', err);
    });

}


const _writeInfoHashToFile = (infoHash) => {
    const filePath = join(process.cwd(), './example/initial_hashes.csv');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Failed to read file: ${err}`);
            return;
        }

        let fileData = data;
        if (!data.endsWith('\n')) {
            fileData += '\n';
        }

        fs.appendFile(filePath, `${infoHash}\n`, (err) => {
            if (err) {
                console.error(`Failed to write infoHash to file: ${err}`);
            }
        });
    });

}


//torrentHashHunter();