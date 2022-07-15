// create variable to hold db connection
let db;
// establish connection to IndexedDB database called budget tracker and set it to version 1
const request = indexedDB.open('budget-tracker', 1);

// this event emits if the database version changes
request.onupgradeneeded = function(event) {
  // save a reference to the database
  const db = event.target.result;

  // create an object store called new-trade and set it to have autoincrement primary keys
  db.createObjectStore('new-trade', {autoIncrement: true});
};

// upon success
request.onsuccess = function(event) {
  // when db is successfully created with its object store or simply established a connection, save reference to db in global variable
  db =  event.target.result;

  // check if app is online, if yes run uploadBudget() function to send all local db data to api
  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function(event) {
  console.log(event.target.errorCode);
}

// This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read/write permissions
  const transaction = db.transaction(['new-trade'], 'readwrite');

  // access the object store for new-trade
  const budgetObjectStore = transaction.objectStore('new-trade');

  // add record to store with add method
  budgetObjectStore.add(record);
}

function uploadBudget() {
  // open a transaction on the db
  const transaction = db.transaction(['new-trade'], 'readwrite');

  // access the objectStore
  const budgetObjectStore = transaction.objectStore('new-trade');

  // get all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  // upon a successful .getAll() execution
  getAll.onsuccess = function() {
    // if there was data in the indexedDB's store, send it to the api server
    if(getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(serverResponse => {
        if (serverResponse.message) {
          throw new Error(serverResponse);
        }
        // open one more transaction
        const transaction = db.transaction(['new-trade'], 'readwrite');
        // access the new_trade objectstore
        const budgetObjectStore = transaction.objectStore('new-trade');
        // clear all items
        budgetObjectStore.clear();

        alert('All transactions have been submitted.')
      })
      .catch(err => console.log(err));
    }
  }
}

// listen for app coming back online
window.addEventListener('online', uploadBudget);