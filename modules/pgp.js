var pgp 		= require('pg-promise')(/*options*/);
exports.db = pgp("postgres://postgres:dom1nion!@127.0.0.1:5432/instads");