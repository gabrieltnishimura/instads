/*jslint node: true */

'use strict';

var util = require('util');
var oneDay = 86400;

module.exports = function (session) {

  var Store = session.Store || session.session.Store,
    PGStore;

  PGStore = function (options) {
    options = options || {};
    Store.call(this, options);

    this.tableName = options.tableName || 'session';

    this.ttl =  options.ttl;
	this.db = options.db;
    this.ownsPg = !options.db;

    this.errorLog = options.errorLog || console.error.bind(console);
    if (options.pruneSessionInterval === false) {
      this.pruneSessionInterval = false;
    } else {
      this.pruneSessionInterval = (options.pruneSessionInterval || 60) * 1000; // one hour
      setImmediate(function () {
        this.pruneSessions();
      }.bind(this));
    }
  };

  /**
   * Inherit from `Store`.
   */

  util.inherits(PGStore, Store);

  /**
   * Closes the session store
   *
   * Currently only stops the automatic pruning, if any, from continuing
   *
   * @access public
   */

  PGStore.prototype.close = function () {
    this.closed = true;

    if (this.pruneTimer) {
      clearTimeout(this.pruneTimer);
      this.pruneTimer = undefined;
    }
  };

  /**
   * Does garbage collection for expired session in the database
   *
   * @param {Function} [fn] - standard Node.js callback called on completion
   * @access public
   */

  PGStore.prototype.pruneSessions = function (fn) {
	this.db.any('DELETE FROM ' + this.quotedTable() + ' WHERE expire < NOW()', undefined)
	.then(function(data){
      if (fn && typeof fn === 'function') {
        return fn(err);
      }
      if (this.pruneSessionInterval && !this.closed) {
        if (this.pruneTimer) {
          clearTimeout(this.pruneTimer);
        }
        this.pruneTimer = setTimeout(this.pruneSessions.bind(this, true), this.pruneSessionInterval);
      }
	}.bind(this), function(err) {
	  if (err) {
        this.errorLog('Failed to prune sessions:', err.message);
      }
	}.bind(this));
  };

  /**
   * Get the quoted table.
   *
   * @return {String} the quoted schema + table for use in queries
   * @access private
   */

  PGStore.prototype.quotedTable = function () {
    var result = '"' + this.tableName + '"';

    if (this.schemaName) {
      result = '"' + this.schemaName + '".' + result;
    }

    return result;
  };

  /**
   * Query the database.
   *
   * @param {String} query - the database query to perform
   * @param {(Array|Function)} [params] - the parameters of the query or the callback function
   * @param {Function} [fn] - standard Node.js callback returning the resulting rows
   * @access private
   *//*

  PGStore.prototype.query = function (query, params, fn) {
	  console.log("----------QYERYDUDE");
    if (!fn && typeof params === 'function') {
      fn = params;
    }
	
	this.db.any(query, params || [])
	.then(function(data){
	  done(err || false);
	  if (fn) { fn(err, result && data[0] ? data[0] : false); }
	}, function(err) {
      if (fn) { fn(err); }
	});
  };*/

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String} sid – the session id
   * @param {Function} fn – a standard Node.js callback returning the parsed session object
   * @access public
   */

  PGStore.prototype.get = function (sid, fn) {
	this.db.any('SELECT sess FROM ' + this.quotedTable() + ' WHERE sid = $1 AND expire >= NOW()', [sid])
	.then(function(data) {
	  if (!data) { return fn(); }
	  return fn(null, ('string' === typeof data.sess) ? JSON.parse(data.sess) : data.sess);
	}, function(err) {
      if (fn) { console.log(err);fn.apply(this, err); }
	});
  };

  /**
   * Commit the given `sess` object associated with the given `sid`.
   *
   * @param {String} sid – the session id
   * @param {Object} sess – the session object to store
   * @param {Function} fn – a standard Node.js callback returning the parsed session object
   * @access public
   */

  PGStore.prototype.set = function (sid, sess, fn) {
    var self = this,
      maxAge = sess.cookie.maxAge,
      ttl = this.ttl;

    ttl = ttl || (typeof maxAge === 'number' ? maxAge / 1000 : oneDay);
    ttl = Math.ceil(ttl + Date.now() / 1000);

	this.db.any('UPDATE ' + this.quotedTable() + ' SET sess = $1, expire = to_timestamp($2) WHERE sid = $3 RETURNING sid', [sess, ttl, sid])
    .then(function(data){
		if (!data || data.length == 0) {
			console.log('INSERT INTO ' + self.quotedTable() + ' (sess, expire, sid) SELECT $1, to_timestamp($2), $3 WHERE NOT EXISTS (SELECT 1 FROM ' + self.quotedTable() + ' WHERE sid = $4)');
			return this.db.query('INSERT INTO ' + self.quotedTable() + ' (sess, expire, sid) SELECT $1, to_timestamp($2), $3 WHERE NOT EXISTS (SELECT 1 FROM ' + self.quotedTable() + ' WHERE sid = $4)', [sess, ttl, sid, sid]);
		}
    }.bind(this))
    .then(function(data){
		if (fn) {
			fn.apply(this, data); 
		}
    }.bind(this), function(err){
		if (fn) {
			fn.apply(this, err); 
		}
    });
	
	
  };

  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String} sid – the session id
   * @access public
   */

  PGStore.prototype.destroy = function (sid, fn) {
	this.db.none('DELETE FROM ' + this.quotedTable() + ' WHERE sid = $1', [sid])
	.then(function(data) {
		// ?
	}, function(err) {
      if (fn) { fn(err); }
	});
  };

  return PGStore;
};
