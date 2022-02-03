// create a variable to hold db connection
let db;
const indexedDB = 
window.indexedDB || 
window.mozIndexedDB ||
window.webkitIndexedDB ||
window.msIndexedDB ||
window.shimIndexedDB;
// establish connection to IndexedDB 
const request = indexedDB.open('budgetTracker', 1);

// event that will emit if the database version changes
request.onupgradeneeded = function(event) {
    // save a reference to the database
    let db = event.target.result;
    // create object store
    db.createObjectStore('newEntry', {autoIncrement: true});
};

// upon a successful
request.onsuccess = function(event) {
    // when db is created with its object store
    db = event.target.result;

    // check if app is onine
    if (navigator.onLine) {
        uploadBudget()
    }
};

request.onerror = function (event) {
    // log error
    console.log(event.target.errorCode);
};

// function that is going to be executed if we attempt to submit budget without internet connection
function saveRecord(record){
    // open a new transaction with the database with read and write permission
    const transaction = db.transaction(['newBudget'], 'readwrite');
    
    // access the object store for 'newBudget'
    const budgetObjectStore = transaction.budgetObjectStore('newBudget');

    // add budget to my store with add method
    budgetObjectStore.add(record);

};

function uploadBudget(){
    // open a transaction on your db
    const transaction = db.transaction(['newBudget'], 'readwrite');

    // access pending object store
    const budgetObjectStore = transaction.objectStore('newBudget');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, send it to the api server
        if(getAll.result.length > 0){
            fetch("/api/transaction/bulk", {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message){
                    throw new Error (serverResponse);
                }

                const transaction = db.transaction(['newBudget'], 'readwrite');
                const budgetObjectStore = transaction.budgetObjectStore('newBudget');
                // clear all items in store
                budgetObjectStore.clear();
            })
            .catch(err => {
                // set reference to redirect back here
                console.log(err);
            });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadBudget);
