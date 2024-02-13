import middleware from './middleware.js';
const { 
    indentation, 
    closeConnection, 
    startStream,
    exitCleanups,
} = middleware;


const main = () => {
    startStream();
}

process.on('SIGINT', () => {
    console.log(`${indentation(4)}<--- Closing the dht_indexer\n`);
    
    exitCleanups();
    setTimeout(() => {
        process.exit();
    }, 3000);

    closeConnection();

});


 main();