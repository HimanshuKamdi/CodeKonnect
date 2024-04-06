import firebase from 'firebase';

import 'firebase/auth';
import 'firebase/storage';
import 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBGVvtLIovta172R6OcLFn7G6oSP9zlKVQ",
  authDomain: "se-project-db38b.firebaseapp.com",
  databaseURL: "https://se-project-db38b-default-rtdb.firebaseio.com",
  projectId: "se-project-db38b",
  storageBucket: "se-project-db38b.appspot.com",
  messagingSenderId: "484067017988",
  appId: "1:484067017988:web:e6d9a89fd71d96d6b2fc51",
  measurementId: "G-4Q8W9Z8NYR"
};

  firebase.initializeApp(firebaseConfig);
  firebase.analytics();

  export default firebase;