import dbHandler from './db_handler.js'
import configs from '../configs_router/configs.js';
import WebTorrent from 'webtorrent'

const { 
    insertTorrent, 
    insertFilesBulkInfo, 
    addProcessedHash, 
    checkProcessedHash,
} = dbHandler;

const { 
    indentation, 
    timeInterval 
} = configs;


const client = new WebTorrent();

const trackTorrent = (infoHash) => {
    client.add(infoHash, async (torrent) => {
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

        // Imediate run for when the app launches
        updateTorrentInfo();

        // Periodic run
        setInterval(updateTorrentInfo, timeInterval);
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


export default {trackTorrent};