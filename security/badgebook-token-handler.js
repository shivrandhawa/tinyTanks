const log = require('log4js').getLogger();
const jose = require('node-jose');

// This is the name of the cookie that should hold the token you're looking for.
const BADGEBOOK_COOKIE_NAME = 'authorization';
const CLIENT_KEY = "FJWTwiylut1p2YV8uyoN2usRC-v99i0gHqFIw0KOAUU"
const CLIENT_SECRET = 'ftWvLDdGayoRQAoc3EIwRa5W2Tm6G37XLKtNEGiYFqg';

// Key JSON. Used by node-jose to make a key.
const KEY_JSON = {
    kty: "oct",
    kid: CLIENT_KEY,
    k: CLIENT_SECRET
};

/**
 * Checks req for a badgebook token that's signed for your app and verifies it.
 * If it's valid, it sets req.isValidBadgeBookUser to true and appends all that
 * users details to req.badgeBookUserDetails
 */
async function attachBadgeBookUserToSocket(socket) {
    let token;
    let tokenPayload;

    try {
        let cookies = socket.handshake.headers.cookie;
        let authRegExp = new RegExp(`\\b${BADGEBOOK_COOKIE_NAME}=[\\w\\d\\+\\-\\.]*`);
        let authCookie = authRegExp.exec(cookies)[0];
        token = authCookie.split('authorization=')[1];
    } catch (err) {
        log.trace(`attachBadgeBookUserToSocket() - No authorization cookie found. Returning.`);
        return socket;
    }

    try {
        let key = await jose.JWK.asKey(KEY_JSON);
        let verifier = await jose.JWS.createVerify(key);
        let verifiedToken = await verifier.verify(token);
        let payload = JSON.parse(verifiedToken.payload.toString());

        if (payload) {
            tokenPayload = payload;
        }
    } catch (err) {
        log.trace(`attachBadgeBookUserToSocket() - Couldn't validate token. Returning.`)
        return socket;
    }

    if (tokenPayload) {
        socket.isValidBadgeBookUser = true;
        socket.badgeBookUserDetails = tokenPayload;
        log.trace(`attachBadgeBookUserToSocket() - Found valid badgebook user ${tokenPayload.userId}`);
    }

    return socket;
}

module.exports = attachBadgeBookUserToSocket;