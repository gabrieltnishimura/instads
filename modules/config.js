// config.js
const DEFAULT_QUERY_LIMIT_COMPANY = 15;
const DEFAULT_MAXIMUM_UPLOAD_LIMIT_COMPANY = 20; // MB

const DEFAULT_QUERY_LIMIT_POST = 15;
const DEFAULT_MAXIMUM_UPLOAD_LIMIT_POST = 50;

const DEFAULT_QUERY_LIMIT_USER =  5;
const DEFAULT_MAXIMUM_UPLOAD_LIMIT_USER = 10;

const DEFAULT_QUERY_LIMIT_COMPETITION = 5;
const DEFAULT_MAXIMUM_UPLOAD_LIMIT_COMPETITION = 20;
// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : '397424690433990', // your App ID
        'clientSecret'  : '25f5cb8ad41dee85a1fd0da9e429eba8', // your App Secret
        'callbackURL'   : 'http://localhost:3000/auth/facebook/callback',
		'accessToken' 	: '397424690433990|DfvftNF_mRlYF27VbMoj_8dzpiw' // App Access Token
    },

    'twitterAuth' : {
        'consumerKey'       : 'your-consumer-key-here',
        'consumerSecret'    : 'your-client-secret-here',
        'callbackURL'       : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : 'your-secret-clientID-here',
        'clientSecret'  : 'your-client-secret-here',
        'callbackURL'   : 'http://localhost:8080/auth/google/callback'
    },
	
	'app_secret' : 'bb5544e5-8bda-454a-9f03-396b3f4ddbbc', 
	
	// DAO COMPANY
	DEFAULT_QUERY_LIMIT_COMPANY : DEFAULT_QUERY_LIMIT_COMPANY,
	DEFAULT_MAXIMUM_UPLOAD_LIMIT_COMPANY : DEFAULT_MAXIMUM_UPLOAD_LIMIT_COMPANY, 
	// DAO POST
	DEFAULT_QUERY_LIMIT_POST : DEFAULT_QUERY_LIMIT_POST,
	DEFAULT_MAXIMUM_UPLOAD_LIMIT_POST : DEFAULT_MAXIMUM_UPLOAD_LIMIT_POST,
	// DAO USER
	DEFAULT_QUERY_LIMIT_USER : DEFAULT_QUERY_LIMIT_USER,
	DEFAULT_MAXIMUM_UPLOAD_LIMIT_USER : DEFAULT_MAXIMUM_UPLOAD_LIMIT_USER,
	// DAO COMPETITION
	DEFAULT_QUERY_LIMIT_COMPETITION : DEFAULT_QUERY_LIMIT_COMPETITION,
	DEFAULT_MAXIMUM_UPLOAD_LIMIT_COMPETITION : DEFAULT_MAXIMUM_UPLOAD_LIMIT_COMPETITION
};