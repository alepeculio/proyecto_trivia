var jwt = require( 'jsonwebtoken' );
var config = require( '../config' );

function verifyToken( req, res, next ) {
	var token = req.headers['x-access-token'];

	if ( !token )
		return res.status( 403 ).send( { auth: false, message: 'No hay token' } );

	jwt.verify( token, config.secret, ( err, decoded ) => {
		if ( err )
			return res.status( 500 ).send( { auth: false, message: 'Fallo de autentificación' } );

		req.userId = decoded.id;
		next();
	} );
}

module.exports = verifyToken;