# About the csv file
Note that the csv file contains initial torrent hashes to simulate the initial state of the database. This is the part of the code base that should be extended with scraper modules as I mentioned previously in the slack dm chat with you.

## The suggested approach
A couple of scrappers should be implemented to scrape the torrent hashes from the 2-3 popular sites and then stores those hashes should in a database so that when you launch your site, you already have and extended library that this `indexer` will be tracking so that you have a good amount of data to show to the users. 

## Last but not least
If you have any questions, please open a github ticket on this repository and we can discuss it there. 
