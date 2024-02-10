import middleware from './middleware.js';
const { 
    indentation, 
    closeConnection, 
    startStream
} = middleware;


const main = () => {
    startStream();
}

process.on('SIGINT', () => {
    console.log(`${indentation(4)}<--- Closing the dht_indexer\n`);
    closeConnection();
    process.exit();
});


 main();