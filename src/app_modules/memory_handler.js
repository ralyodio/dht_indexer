import { join } from 'path';
import fs from 'fs';
import {
    existsSync,
    mkdirSync,
} from 'fs';


const checkAndCleanTempDir = async (dirPath, gbSizeLimit) => {
    const files = await fs.promises.readdir(dirPath);

    let size = 0;

    for (const file of files) {
        const filePath = join(dirPath, file);
        const stats = await fs.promises.lstat(filePath);

        if (stats.isDirectory()) {
            size += await _calculateDirSize(filePath);
        } else {
            size += stats.size;
        }
    }

    const gbSize = size / (1024 ** 3);
    //console.log(`\n>>> TMP DIR SIZE: ${gbSize}`)

    if (gbSize > gbSizeLimit) {
        for (let file of files) {
            const filePath = join(dirPath, file);
            const stats = await fs.promises.lstat(filePath);

            if (stats.isDirectory()) {
                await fs.promises.rmdir(filePath, { recursive: true });
            } else {
                await fs.promises.unlink(filePath);
            }
        }
    }
}


const _calculateDirSize = async (dirPath) => {
    const files = await fs.promises.readdir(dirPath);
    let size = 0;

    for (const file of files) {
        const filePath = join(dirPath, file);
        const stats = await fs.promises.lstat(filePath);

        if (stats.isDirectory()) {
            size += await _calculateDirSize(filePath);
        } else {
            size += stats.size;
        }
    }

    return size;
}


const checkIfDbDirExits = (directoryName) => {
    const dir = join(process.cwd(), directoryName);
    if (!existsSync(dir)) {
        mkdirSync(dir);
    }
    return dir;
}


export default {
    checkAndCleanTempDir,
    checkIfDbDirExits
}