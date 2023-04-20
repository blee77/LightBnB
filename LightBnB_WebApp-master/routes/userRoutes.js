const express = require("express");
const bcrypt = require("bcrypt");
const database = require("../db/database");

const router = express.Router();
const pool = require('../db/database');

// Create a new user
router.post("/", (req, res) => {

  const user = req.body;
  user.password = bcrypt.hashSync(user.password, 12);
  database
    .addUser(user)
    .then((user) => {
      if (!user) {
        return res.send({ error: "error" });
      }

      req.session.userId = user.id;
      res.send("🤗");
    })
    .catch((e) => res.send(e));
});



// Log a user in
router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
 
  // return pool.query(`
  //     SELECT *
  //     FROM users
  //     WHERE email = $1;
  //   `, [email])
  //   .then(res => {
  //     console.log(res.rows[0]);

  //     res.rows[0] || null;
  //   })
    
    database.getUserWithEmail(email)
    .then((user) => {
      console.log("user :", user);
      if (!user) {
        return res.send({ error: "no user with that id" });
      }

      if (!bcrypt.compareSync(password, user.password)) {
        return res.send({ error: "error" });
      }

      req.session.userId = user.id;
      res.send({
        user: {
          name: user.name,
          email: user.email,
          id: user.id,
        },
      });
    });
});

// Log a user out
router.post("/logout", (req, res) => {
  req.session.userId = null;
  res.send({});
});

// Return information about the current user (based on cookie value)
router.get("/me", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.send({ message: "not logged in" });
  }



  database
    .getUserWithId(userId)
    .then((user) => {
      if (!user) {
        return res.send({ error: "no user with that id" });
      }

      res.send({
        user: {
          name: user.name,
          email: user.email,
          id: userId,
        },
      });
    })
    .catch((e) => res.send(e));
});

module.exports = router;



