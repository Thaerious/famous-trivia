import {OAuth2Client} from "google-auth-library";

/**
 * Verify a Google auth id token.
 * Returns the Google username and the
 * @param token
 * @returns {Promise<{userName: string, userId: string}>}
 * @see https://developers.google.com/identity/sign-in/web/backend-auth
 * @throws error uncaught from google api
 */
async function verify(token){
    const client = new OAuth2Client(token);
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: "158823134681-98bgkangoltk636ukf8pofeis7pa7jbk.apps.googleusercontent.com"
    });
    const payload = ticket.getPayload();

    return {
        userId : payload['sub'],
        userName : payload['name']
    };
}

export default verify;