/**
 * Script for letting users log in via BadgeBook.
 * 
 * WHAT THIS SCRIPT DOES:
 * 1) Loads any tokens returned from badgebook and stores them in cookies.
 * 2) Provides an object that lets you interact with the BadgeBook Token Handler.
 * 
 * USE:
 * 1) Run this script on your application's pages. Load it before you need to
 *    make authenticated calls to your own server.
 * 
 * 2) Set the cookie name you want to use (default is `authorization`) and use
 *    that same cookie to validate tokens on your server.
 * 
 * 3) Add any custom functionality you want into any of the handlers.
 * 
 * SETUP:
 * - Set constants.
 */
function createBadgeBookTokenHandler() {
    // Set these
    const CLIENT_PUBLIC_KEY = `FJWTwiylut1p2YV8uyoN2usRC-v99i0gHqFIw0KOAUU`;
    const BADGEBOOK_TOKEN_URL = `https://polar-citadel-36387.herokuapp.com/auth/token.html`;
    const TOKEN_COOKIE_NAME = `authorization`;

    // Leave these be
    const TOKEN_REGEX = new RegExp(`${TOKEN_COOKIE_NAME}\\s*=\\s*[\\w\\d\\.\\+-]*`);


    /********************************************
     *              EVENT HANDLERS              *
     ********************************************/
    // Put your custom functionality in these.

    /*
     * Called when a valid token is detected.
     */
    function handleValidToken(claims) {
        console.log(`User has a valid token`);

        // Example:
        // window.sessionStorage.setItem('badgebook-user-id', claims.userId);
    }


    /*
     * Called when no token is detected.
     */
    function handleNoToken() {
        console.log('No token found');

        // Example:
        // window.sessionStorage.deleteItem('badgebook-user-id', claims.userId);
    }


    /*
     * Called when current token is expired.
     */
    function handleExpiredToken() {
        console.log(`User token is expired`);
        clearAccessToken();
        loginWithBadgeBook();
    }


    /********************************************
     *                PUBLIC API                *
     ********************************************/

    /*
     * Redirects the user to BadgeBook.
     */
    function loginWithBadgeBook() {
        let currentUrl = btoa(window.location);
        window.location = `${BADGEBOOK_TOKEN_URL}?client_key=${CLIENT_PUBLIC_KEY}&redirect=${currentUrl}`;
    }


    /**
     * Returns the token from cookies.
     */
    function getCurrentToken() {
        let token;
        try {
            let cookies = document.cookie;
            tokenStr = TOKEN_REGEX.exec(cookies);
            token = tokenStr ? tokenStr[0].split(`${TOKEN_COOKIE_NAME}=`)[1] : '';
        } catch (err) {
            console.log('error parsing token', err);
            token = '';
        }
        return token ? token : '';
    }


    /**
     * Returns the user details from the currently stored token, or an empty
     * object otherwise.
     */
    function getCurrentUserClaims() {
        let token = getCurrentToken();
        let claims = JSON.parse(atob(token.split('.')[1]));
        return claims;
    }


    /**
     * Returns true if a badgebook user is logged in.
     */
    function isBadgeBookUserLoggedIn() {
        return Boolean(getCurrentToken());
    }


    /**
     * Clears the currently stored token from cookies.
     */
    function clearAccessToken() {
        saveCookie(TOKEN_COOKIE_NAME, '', 0, '/');
    }


    /********************************************
     *       MAIN TOKEN RETRIEVAL SCRIPT        *
     ********************************************/
    (function onPageLoad() {
        /**
         * Pulls tokens passed back from badgebook via query strings and stores
         * them in cookies.
         */
        function extractTokenFromQueryString() {
            let url = new URL(window.location);
            if (url.searchParams.has('token')) {

                let token = url.searchParams.get('token');
                saveCookie(TOKEN_COOKIE_NAME, token, 0.1, '/');
                url.searchParams.delete('token');
                window.location = url.toLocaleString();
            }
        };


        /*
        * Checks the current token stored in cookies.
        */
        function checkCurrentToken() {
            try {
                let token = getCurrentToken();
                let claims = JSON.parse(atob(token.split('.')[1]));

                if (token) {
                    if ((token ? claims.exp : 0) > Date.now()) {
                        handleValidToken(claims);
                    } else {
                        handleExpiredToken();
                    }
                } else {
                    handleNoToken();
                }
            } catch (err) {
                handleNoToken();
            }
        };

        extractTokenFromQueryString();
        checkCurrentToken();
    })();


    /**
     * Helper function. Saves a cookie.
     */
    function saveCookie(name, value, exdays, path) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        const expires = d.toUTCString();
        document.cookie = `${name}=${value};expires=${expires};path=${path}`
    }



    // Return public API
    return Object.freeze({
        loginWithBadgeBook: loginWithBadgeBook,
        isBadgeBookUserLoggedIn: isBadgeBookUserLoggedIn,
        getCurrentToken: getCurrentToken,
        getCurrentUserClaims: getCurrentUserClaims,
        clearAccessToken: clearAccessToken
    });
};

// Provides a hook for user to access the script's API.
const badgeBookTokenHandler = createBadgeBookTokenHandler();
