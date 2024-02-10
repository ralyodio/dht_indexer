import dbHandler from './db_handler.js'
import hashesHunter from './hashs_hunter.js'
import configs from '../configs_router/configs.js';
import WebTorrent from 'webtorrent'

const { 
    insertTorrent, 
    insertFilesBulkInfo, 
    addProcessedHash, 
    checkProcessedHash,
} = dbHandler;

const {
    torrentHashHunters,
} = hashesHunter;

const { 
    indentation, 
    numberOfHunters, 
    tempDir,
    millisecondsTimeInterval
} = configs;



const client = new WebTorrent();


const trackTorrent = (infoHash) => {

    const torrentOptions = {
        storeCacheSlots: 0,
        path: tempDir  
    };

    client.add(infoHash, torrentOptions, async (torrent) => {
        const torrentInfo = {
            name: torrent.name,
            seeders: new Set(),
            leechers: new Set(),
        };

        await checkProcessedHash(infoHash)
            .then(async (exists) => {
                if (!exists) {
                    await _extractFilesInfo(infoHash, torrent.files, torrent.name);
                    await addProcessedHash(infoHash);
                }
            })
            .catch((err) => {
                console.error('\nxxxxx Error checking for processed hash:', err);
            });

        torrent.on('wire', (wire, addr) => {
            const uniqueId = `${wire.peerId}:${addr}`;
            torrentInfo.seeders.add(uniqueId);

            wire.on('request', () => {
                if (torrentInfo.seeders.has(uniqueId)) {
                    torrentInfo.seeders.delete(uniqueId);
                    torrentInfo.leechers.add(uniqueId);
                }
            });

            wire.on('end', () => {
                if (torrentInfo.seeders.has(uniqueId)) {
                    torrentInfo.seeders.delete(uniqueId);
                }
                if (torrentInfo.leechers.has(uniqueId)) {
                    torrentInfo.leechers.delete(uniqueId);
                }
            });          
        });

        // Function to be run immediately once the CLI app start 
        // and periodically after that.
        const updateTorrentInfo = () => {
            let name = torrentInfo.name;
            let seeders = torrentInfo.seeders.size;
            let leechers = torrentInfo.leechers.size;
            
            console.log(`--> | Name: ${name}`);
            console.log(`--> | InfoHash: ${infoHash}`)
            console.log(`--> | Seeders (peers): ${seeders}`)
            console.log(`--> | Leechers: ${leechers}`)
            
            insertTorrent(infoHash, name, seeders, leechers)
                .then(() => {
                    console.log('\n===> Seeder/Leecher counts updated in the database\n');
                    console.log('###########################################\n');
                })
                .catch((err) => {
                    console.error('\nxxxxx Error updating database:', err);
                });
        };

        updateTorrentInfo();
        setInterval(
            updateTorrentInfo, 
            millisecondsTimeInterval
        );

    });
};


const _extractFilesInfo = async (infoHash, files, name) => {

    const filesDetails = files.map((file) => ({
        infoHash,
        name: file.name,
        size: file.length,
    }));

    insertFilesBulkInfo(filesDetails)
        .then(() => {
            console.log('------------------------------------------------');
            console.log(`${indentation(4)}>>> collected torrent files: ${files.length} files <<<`);
            console.log('------------------------------------------------');
        })
        .catch((err) => {
            console.error('\nxxxxx Error updating file info in database:', err);
        });
}


torrentHashHunters(numberOfHunters);

export default {trackTorrent};