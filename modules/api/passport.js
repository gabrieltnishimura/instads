// config/passport.js

var LocalStrategy   = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var common 		= require('../../common');
var db 			= common.db; // Database related imports
var bcrypt   	= common.bcrypt; // Passport and Auth related imports
var log 		= common.log; // Logging related imports
var cfg 		= common.config; // General Configs

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, {id : user.id, email : user.email});
    });

    // used to deserialize the user
    passport.deserializeUser(function(sessionUser, done) {
		done(null, sessionUser);
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        // asynchronous
        process.nextTick(function() {
			// find a user whose email is the same as the forms email
			// we are checking to see if the user trying to login already exists
			db.none("SELECT * FROM instads_user WHERE email = ($1)", [email])
			.then(function(data){
				bcrypt.hash(password, bcrypt.genSaltSync(10), null, function(err, hash) {
					db.one("INSERT INTO instads_user (name, email, password) VALUES ($1, $2, $3) RETURNING id_user", ["GABIE", email, hash])
					.then(function(data){
						console.log("Signup of user with id: " + data.id_user);					
						return done(null, {id : data.id_user, email : email});
					}, function(reason){
						return done(reason);
					});
				});
			}, function(reason) { // >1 row
				return done(null, false, { message: 'That email is already taken.' });
			});

        });

    }));
	
    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
		// find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
		db.one("SELECT * FROM instads_user WHERE email = ($1)", [email])
		.then(function(data){
			bcrypt.compare(password, data.password, function(err, res) {
				if (!res) {
					return done(null, false, {message : "Invalid login or password3"});
				} else {			
					console.log("Login of user with id: " + data.id_user);
					return done(null, {id : data.id_user, email : email});
				}
			});
		}, function(reason) {
			return done(null, false, {message : "Invalid login or password4"});
		});
        
    }));
	
    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : cfg.facebookAuth.clientID,
        clientSecret    : cfg.facebookAuth.clientSecret,
        callbackURL     : cfg.facebookAuth.callbackURL

    },

    // facebook will send back the token and profile
    function(token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {
			db.any("SELECT * FROM instads_user WHERE facebook_user_id = ($1)", [profile.id])
			.then(function(data){
				if (data.length != 0) {
					done(null, {id: data[0].id_user, email : data[0].email});
					console.log("hey");
				} else {
					db.one("INSERT INTO instads_user (name, email, access_token, facebook_user_id)"+
						" VALUES ($1, $2, $3, $4) RETURNING id_user", [profile.name.givenName + ' ' + profile.name.familyName, profile.emails[0].value, token, profile.id])
					.then(function(data){
						console.log("Signup of user with id: " + data.id_user);
						return done(null, {id: data.id_user, email : profile.emails[0].value});
					}, function(reason){
						return done(reason);
					});
				}
			}, function(reason) { // error
				return done(null, false);
			});
        });

    }));

};