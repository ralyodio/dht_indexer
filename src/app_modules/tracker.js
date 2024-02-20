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
    millisecondsTimeDelay
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
            .then((exists) => {
                if (!exists) {
                    setTimeout(async () => {
                        await _extractFilesInfo(infoHash, torrent.files);
                        await addProcessedHash(infoHash);

                        _updateTorrentInfo(torrentInfo, infoHash);
                    }, millisecondsTimeDelay);

                } else {
                    setTimeout(() => {
                        _updateTorrentInfo(torrentInfo, infoHash);
                    }, millisecondsTimeDelay);

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

    });
};


const _updateTorrentInfo = (_torrentInfo, _infoHash) => {
    let name = _torrentInfo.name;
    let seeders = _torrentInfo.seeders.size;
    let leechers = _torrentInfo.leechers.size;

    console.log(
        `--> | Name: ${name}\n` +
        `--> | InfoHash: ${_infoHash}\n` +
        `--> | Seeders (peers): ${seeders}\n` +
        `--> | Leechers: ${leechers}`
    );

    insertTorrent(_infoHash, name, seeders, leechers)
        .then(() => {
            console.log('\n===> Seeder/Leecher counts updated in the database\n' +
                '\n################################################\n');
        })
        .catch((err) => {
            console.error('\nxxxxx Error updating database:', err);
        });
};


const _extractFilesInfo = async (infoHash, files) => {

    const filesDetails = files.map((file) => ({
        infoHash,
        name: file.name,
        size: file.length,
    }));

    insertFilesBulkInfo(filesDetails)
        .then(() => {
            console.log(
                '------------------------------------------------\n' +
                `\nDiscovered new infoHash:\n---> ${infoHash}\n` +
                '\n------------------------------------------------\n' +
                `${indentation(4)}>>> collected torrent files: ${files.length} files <<<\n` +
                '------------------------------------------------'
            );
        })
        .catch((err) => {
            console.error('\nxxxxx Error updating file info in database:', err);
        });
}


torrentHashHunters(numberOfHunters);


export default { trackTorrent };
