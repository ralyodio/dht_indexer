import middleware from './middleware.js';
import dotenv from 'dotenv';
dotenv.config();

const { 
    indexer, 
    indentation, 
    closeConnection, 
    hashesArray 
} = middleware;


hashesArray.forEach(async (hash) => {
    await indexer(hash);
});


process.on('SIGINT', () => {
    console.log(`${indentation(4)}<--- Closing tracking the app\n`);
    closeConnection();
    process.exit();
});
