const properties = require("./json/properties.json");
const users = require("./json/users.json");

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  // const queryParams = [];

  let queryString = `
    SELECT * 
    FROM users
    WHERE users.email = $1
  `;

  // queryParams.push(email);
  // this is a promise
  return pool.query(queryString, [email])
    .then((result) => {
      console.log("Login User :", result.rows[0]);

      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const queryParams = [];

  let queryString = `
    SELECT * 
    FROM users
    WHERE users.id = $1
    
  `;

  queryParams.push(id);
  // this is a promise
  return pool.query(queryString, queryParams)
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });


};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  const queryParams = [];

  let queryString = `
  INSERT INTO users ( name, email, password) 
  VALUES ($1, $2, $3)
    
  `;

  queryParams.push(user.name, user.email, user.password);
  // this is a promise
  return pool.query(queryString, queryParams)
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });


};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

// const getAllReservations = function (guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// };

const getAllReservations = function(guest_id, limit = 10) {

  const queryString =
    `SELECT reservations.*, properties.*, avg(property_reviews.rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY start_date DESC
  LIMIT $2`;

  const values = [guest_id, limit];
  console.log("guest_id:", guest_id);
  return pool
    .query(queryString, values)
    .then(res => {
      console.log("Reservations:", res.rows);
      return res.rows;
    })
    .catch(err => console.error(err.stack));
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */


const getAllProperties = function(options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  //Need to find a query where there is no property review
  // What if the join does not return anything
  //outer join - make sure there is not property reviews returning

  let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating, count(property_reviews.rating) as review_count
    FROM properties
    LEFT OUTER JOIN property_reviews ON properties.id = property_id
    WHERE 1 = 1
    `;

  // let queryString = `
  // SELECT properties.*
  // FROM properties
  // WHERE 1 =1
  // `;

    
  // let queryString = `
  // SELECT reservations.*, properties.*, avg(property_reviews.rating) as average_rating
  // FROM reservations
  // JOIN properties ON reservations.property_id = properties.id
  // JOIN property_reviews ON properties.id = property_id
  // WHERE reservations.guest_id = $1
  // GROUP BY reservations.id, properties.id
  // ORDER BY reservations.start_date DESC
  // LIMIT $2;
  //   `;
  // 3a city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` AND city LIKE $${queryParams.length} `;
  }
  //3b owner id
  console.log('Owner ID:',options.owner_id);

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `AND owner_id = $${queryParams.length}`;
  }
  //3c min price
  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    queryString += ` AND cost_per_night >= $${queryParams.length}`;
  }
  //3d max price
  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    queryString += ` AND cost_per_night <= $${queryParams.length}`;
  }
  queryString += ` GROUP BY properties.id 
 `;
  
  //3e min rating
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += ` HAVING avg(rating) >= $${queryParams.length}\n`;
  }
  // 4
  queryParams.push(limit);
  queryString += `
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
  // 5
 
  // 6
  console.log(queryString);
  console.log(queryParams);
  return pool.query(queryString, queryParams).then((res) => {
    // console.log(res.rows);
    return res.rows;
  });

};





/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */


// function to add a new property to the database

const addProperty = function(property) {
  const query = `
    INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
  `;
  const values = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night * 100,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ];

  return pool.query(query, values)
    .then(res => {
      return res.rows[0];
    })
    .catch(err => console.error('Error executing query', err.stack));
};


module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
  pool
};