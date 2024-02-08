import middleware from './middleware.js';

const { 
    indexer, 
    indentation, 
    closeConnection, 
    hashsArray 
} = middleware;


const main = () => {
    Promise.all(hashsArray.map(hash => indexer(hash)))
        .catch(error => console.log(error))
}


process.on('SIGINT', () => {
    console.log(`${indentation(4)}<--- Closing the dht_indexer\n`);
    closeConnection();
    process.exit();
});


main();